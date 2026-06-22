// ForgeNote M1 — GET / POST /api/profile/preferences（I-11：偏好假设最小闭环）。
// 当前登录用户的偏好（profile_preferences）：列出 + 创建/更新（upsert by 唯一键）。
// 偏好 = 一条「假设维度」（intent_type + dimension_key + value），下次 /forge 作为 source="profile" 假设带出。
// 边界（I-11）：必须登录；只读写自己的偏好（依赖 0001 RLS：auth.uid() = user_id）；不做自动学习、不做 F-16。
// 依据：docs/API-CONTRACT.md（§2 / §3 / §4 / §5.9 / §5.10）、docs/DATA-SCHEMA.md（§3.4 profile_preferences / §6 RLS）。

import { z } from "zod";

import { getAuthenticatedContext } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INTENT_TYPES = [
  "content_package",
  "xiaohongshu_note",
  "card_prompt",
  "generic_content",
] as const;

type RouteErrorCode = "VALIDATION_FAILED" | "AUTH_REQUIRED" | "DATABASE_ERROR";

function httpStatusFor(code: RouteErrorCode): number {
  switch (code) {
    case "VALIDATION_FAILED":
      return 400;
    case "AUTH_REQUIRED":
      return 401;
    case "DATABASE_ERROR":
    default:
      return 500;
  }
}

function errorResponse(code: RouteErrorCode, message: string): Response {
  return Response.json(
    { ok: false, error: { code, message } },
    { status: httpStatusFor(code) },
  );
}

// 字段最大长度（自由文本，防滥用；profile_preferences 列为 text）。
const MAX_KEY = 80;
const MAX_LABEL = 80;
const MAX_VALUE = 500;

const createSchema = z.object({
  intentType: z.enum(INTENT_TYPES),
  dimensionKey: z.string().max(MAX_KEY),
  dimensionLabel: z.string().max(MAX_LABEL),
  value: z.string().max(MAX_VALUE),
});

export async function GET(): Promise<Response> {
  // 鉴权（API-CONTRACT §4：只读自己的偏好）。
  const auth = await getAuthenticatedContext();
  if (!auth) {
    return errorResponse("AUTH_REQUIRED", "需要登录后才能查看偏好");
  }
  const { supabase } = auth;

  // RLS 仅返回当前用户的行。
  const { data, error } = await supabase
    .from("profile_preferences")
    .select("id, intent_type, dimension_key, dimension_label, value, source, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    return errorResponse("DATABASE_ERROR", "读取偏好失败，请稍后重试");
  }

  const preferences = (data ?? []).map((row) => ({
    id: row.id,
    intentType: row.intent_type,
    dimensionKey: row.dimension_key,
    dimensionLabel: row.dimension_label,
    value: row.value,
    source: row.source,
    updatedAt: row.updated_at,
  }));

  return Response.json({ ok: true, data: { preferences } });
}

export async function POST(request: Request): Promise<Response> {
  // 1) 解析 body。
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("VALIDATION_FAILED", "请求体不是合法 JSON");
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_FAILED", "请求参数不合法");
  }

  // 2) 鉴权（写入必须登录）。
  const auth = await getAuthenticatedContext();
  if (!auth) {
    return errorResponse("AUTH_REQUIRED", "需要登录后才能保存偏好");
  }
  const { supabase, user } = auth;

  // 3) trim 后业务校验：三项均不能为空。
  const dimensionKey = parsed.data.dimensionKey.trim();
  const dimensionLabel = parsed.data.dimensionLabel.trim();
  const value = parsed.data.value.trim();
  if (dimensionKey.length === 0 || dimensionLabel.length === 0 || value.length === 0) {
    return errorResponse("VALIDATION_FAILED", "维度 key / 名称 / 值都不能为空");
  }

  // 4) upsert by 唯一键 (user_id, intent_type, dimension_key)：同维度覆盖，便于「记住已改的假设」。
  //    source 固定 manual（M1 不做自动学习，DATA-SCHEMA §3.4）。
  const { data, error } = await supabase
    .from("profile_preferences")
    .upsert(
      {
        user_id: user.id,
        intent_type: parsed.data.intentType,
        dimension_key: dimensionKey,
        dimension_label: dimensionLabel,
        value,
        source: "manual",
      },
      { onConflict: "user_id,intent_type,dimension_key" },
    )
    .select("id")
    .single();

  if (error || !data) {
    return errorResponse("DATABASE_ERROR", "保存偏好失败，请稍后重试");
  }

  return Response.json({ ok: true, data: { id: data.id } });
}
