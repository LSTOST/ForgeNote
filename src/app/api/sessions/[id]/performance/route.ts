// ForgeNote M1 — POST /api/sessions/:id/performance（I-12：F-16 表现回填 lite，手动）。
// 把已发布内容的表现数据（区间枚举 + 发布时间 + 一句话复盘）手动回填到自己的 session。
// 边界（I-12）：必须登录；只能写自己的 session（RLS + user_id 条件）；M1 不算 perf_score、不自动抓取、不自动分析。
// 依据：docs/API-CONTRACT.md（§3 / §4 / §5.13）、docs/DATA-SCHEMA.md（§2.6 range 枚举 / §3.2 sessions F-16 列 / §6 RLS）、
//       docs/DECISIONS.md（D-02）。无 migration：F-16 列在 0001_init.sql 已存在。

import { z } from "zod";

import { getAuthenticatedContext } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

// 表现区间枚举（DATA-SCHEMA §2.6）。
const RANGE = ["0", "1-10", "11-50", "51-100", "101-500", "500+", "unknown"] as const;
const rangeSchema = z.enum(RANGE);

const MAX_NOTE = 500;

// 所有字段可选；至少一项非空由业务校验保证。
const bodySchema = z.object({
  publishedAt: z.string().datetime().nullish(),
  likeRange: rangeSchema.nullish(),
  favoriteRange: rangeSchema.nullish(),
  commentRange: rangeSchema.nullish(),
  followerGainRange: rangeSchema.nullish(),
  performanceNote: z.string().max(MAX_NOTE).nullish(),
});

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

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  // 1) 解析 body。
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("VALIDATION_FAILED", "请求体不是合法 JSON");
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_FAILED", "请求参数不合法");
  }

  // 2) 鉴权（写入必须登录）。
  const auth = await getAuthenticatedContext();
  if (!auth) {
    return errorResponse("AUTH_REQUIRED", "需要登录后才能回填表现");
  }
  const { supabase, user } = auth;

  // 3) 校验路径 id。非法 UUID 按不存在处理（不泄露存在性）。
  const { id } = await context.params;
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return errorResponse("SESSION_NOT_FOUND", "Session 不存在");
  }

  // 4) 组装 patch：只写显式提供的字段；performanceNote trim，空串视为清空（null）。
  const d = parsed.data;
  const patch: Record<string, unknown> = {};
  if (d.publishedAt !== undefined) patch.published_at = d.publishedAt;
  if (d.likeRange !== undefined) patch.like_range = d.likeRange;
  if (d.favoriteRange !== undefined) patch.favorite_range = d.favoriteRange;
  if (d.commentRange !== undefined) patch.comment_range = d.commentRange;
  if (d.followerGainRange !== undefined)
    patch.follower_gain_range = d.followerGainRange;
  if (d.performanceNote !== undefined) {
    const note = (d.performanceNote ?? "").trim();
    patch.performance_note = note.length > 0 ? note : null;
  }

  if (Object.keys(patch).length === 0) {
    return errorResponse("VALIDATION_FAILED", "至少提供一项表现数据");
  }

  // 5) 更新：仅当前用户的该 session（RLS + user_id；他人/不存在 → SESSION_NOT_FOUND，不泄露存在性）。
  const { data, error } = await supabase
    .from("sessions")
    .update(patch)
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("id, published_at")
    .maybeSingle();

  if (error) {
    return errorResponse("DATABASE_ERROR", "回填表现失败，请稍后重试");
  }
  if (!data) {
    return errorResponse("SESSION_NOT_FOUND", "Session 不存在");
  }

  // 6) 记录事件 performance_filled（API-CONTRACT §5.13 规则）。best-effort，不阻断主流程；
  //    仅记录被填字段名，不存复盘正文等内容，避免冗余/敏感数据扩散。
  await supabase.from("usage_events").insert({
    user_id: user.id,
    session_id: parsedId.data,
    event_name: "performance_filled",
    event_payload: { fields: Object.keys(patch) },
  });

  return Response.json({
    ok: true,
    data: { sessionId: data.id, published: data.published_at !== null },
  });
}
