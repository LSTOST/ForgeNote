// ForgeNote M1 — POST /api/recipes（I-08：保存配方最小闭环）。
// 把一次生成的 recipe_snapshot 固化为 recipes 表中的一条可复用配方。
// 边界（I-08）：必须登录；只保存属于当前用户、且有 recipe_snapshot 的 session；同名允许、不覆盖。
//   不做列表 / 详情 / 重跑 / 偏好记忆 / F-16。
// 依据：docs/API-CONTRACT.md（§2 通用响应 / §3 错误码 / §4 权限 / §5.5）、
//       docs/DATA-SCHEMA.md（§3.3 recipes / §6 RLS）、docs/PRD-M1.md（F-10）、Next.js 16 Route Handlers。

import { z } from "zod";

import { getAuthenticatedContext } from "@/lib/supabase/server";

// 读 Auth cookie + 写库需 Node 运行时，禁止静态化。
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteErrorCode =
  | "VALIDATION_FAILED"
  | "AUTH_REQUIRED"
  | "SESSION_NOT_FOUND"
  | "DATABASE_ERROR";

function httpStatusFor(code: RouteErrorCode): number {
  switch (code) {
    case "VALIDATION_FAILED":
      return 400;
    case "AUTH_REQUIRED":
      return 401;
    case "SESSION_NOT_FOUND":
      return 404;
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

// 入参：sessionId（来源 session）+ name（配方名，trim 后校验非空）。
const requestBodySchema = z.object({
  sessionId: z.string().uuid(),
  name: z.string(),
});

/** recipe_snapshot 中可拆出的列表字段（缺省为 []）。其余字段整体存入 fields。 */
function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function POST(request: Request): Promise<Response> {
  // 1) 解析 body。非法 JSON / 结构不符 → VALIDATION_FAILED。
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("VALIDATION_FAILED", "请求体不是合法 JSON");
  }

  const parsed = requestBodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_FAILED", "请求参数不合法");
  }

  // 2) 鉴权（API-CONTRACT §4：写入必须登录）。未登录 → AUTH_REQUIRED，不查库、不写库。
  const auth = await getAuthenticatedContext();
  if (!auth) {
    return errorResponse("AUTH_REQUIRED", "需要登录后才能保存配方");
  }
  const { supabase, user } = auth;

  // 3) name 业务校验：trim 后不能为空（API-CONTRACT §5.5 规则）。
  const name = parsed.data.name.trim();
  if (name.length === 0) {
    return errorResponse("VALIDATION_FAILED", "配方名称不能为空");
  }

  // 4) 读取来源 session（RLS 仅返回自己的行；他人/不存在均为空 → SESSION_NOT_FOUND）。
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id, intent_type, recipe_snapshot")
    .eq("id", parsed.data.sessionId)
    .maybeSingle();

  if (sessionError) {
    return errorResponse("DATABASE_ERROR", "读取 session 失败");
  }
  if (!session) {
    return errorResponse("SESSION_NOT_FOUND", "Session 不存在");
  }

  // 5) 必须有 recipe_snapshot 才能保存（draft 失败 session 无快照 → VALIDATION_FAILED）。
  const snapshot = session.recipe_snapshot as Record<string, unknown> | null;
  if (!snapshot) {
    return errorResponse("VALIDATION_FAILED", "当前 session 没有可保存的配方");
  }

  // 6) 插入 recipes：fields 存整份快照；acceptance/variables/negative_rules 从快照拆出便于检索。
  //    schema 用最小稳定结构（消费方按 intentType 渲染 fields）。同名允许、不覆盖（独立行）。
  const { data: inserted, error: insertError } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      name,
      intent_type: session.intent_type,
      schema: { intentType: session.intent_type, version: 1 },
      fields: snapshot,
      acceptance: asStringArray(snapshot.acceptance),
      variables: asStringArray(snapshot.variables),
      negative_rules: asStringArray(snapshot.negativeRules),
      source_session_id: session.id,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return errorResponse("DATABASE_ERROR", "配方保存失败，请稍后重试");
  }

  // 7) 成功：API-CONTRACT §5.5 返回 recipeId。
  return Response.json({ ok: true, data: { recipeId: inserted.id } });
}
