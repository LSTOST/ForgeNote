// ForgeNote M2-05 — POST /api/account/intake（账号接入：生成账号记忆 + 持久化）。
// 流程：校验输入 → 鉴权 → 反编造生成（M2-05 域核心）→ 写 account_memory_items（RLS）→ 通用响应。
// 边界：必须登录（无用户 → AUTH_REQUIRED，不调 OpenRouter、不落库）；不绕过 RLS。
// 依据：src/app/api/forge/route.ts 约定、CODEX-REVIEW §M2-05、migration 0003、Next.js 16 Route Handlers。

import { z } from "zod";

import { generateAccountMemory } from "@/lib/account/intake";
import { MAX_ACCOUNT_POST_CHARS, MAX_INPUT_CHARS } from "@/lib/constants";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteErrorCode =
  | "VALIDATION_FAILED"
  | "AUTH_REQUIRED"
  | "INPUT_EMPTY"
  | "INPUT_TOO_LONG"
  | "MODEL_NOT_CONFIGURED"
  | "GENERATION_FAILED"
  | "DATABASE_ERROR";

function httpStatusFor(code: RouteErrorCode): number {
  switch (code) {
    case "VALIDATION_FAILED":
    case "INPUT_EMPTY":
    case "INPUT_TOO_LONG":
      return 400;
    case "AUTH_REQUIRED":
      return 401;
    case "MODEL_NOT_CONFIGURED":
      return 503;
    case "GENERATION_FAILED":
    case "DATABASE_ERROR":
    default:
      return 500;
  }
}

function errorResponse(code: RouteErrorCode, message: string, retryable?: boolean): Response {
  const error: Record<string, unknown> = { code, message };
  if (retryable !== undefined) error.retryable = retryable;
  return Response.json({ ok: false, error }, { status: httpStatusFor(code) });
}

// 数组条数上限（P2：防已登录用户构造超大 prompt）。
const bodySchema = z.object({
  profileText: z.string(),
  recentPosts: z.array(z.string().max(MAX_ACCOUNT_POST_CHARS)).max(20).default([]),
  performanceNotes: z.array(z.string().max(MAX_ACCOUNT_POST_CHARS)).max(20).optional(),
  platform: z.string().max(64).optional(),
});

/** 总输入字符上限（防超大模型调用）。 */
const MAX_TOTAL_INTAKE_CHARS = 40_000;

export async function POST(request: Request): Promise<Response> {
  // 1) body
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorResponse("VALIDATION_FAILED", "请求体不是合法 JSON");
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return errorResponse("VALIDATION_FAILED", "请求参数不合法");

  // 2) 鉴权（无用户绝不调模型、不落库）
  const auth = await getAuthenticatedContext();
  if (!auth) return errorResponse("AUTH_REQUIRED", "需要登录后才能接入账号");
  const { supabase, user } = auth;

  // 3) 业务校验
  const profileText = parsed.data.profileText.trim();
  const recentPosts = parsed.data.recentPosts.filter((p) => p.trim().length > 0);
  if (profileText.length === 0 && recentPosts.length === 0) {
    return errorResponse("INPUT_EMPTY", "请至少粘贴 profile 或一条近期内容");
  }
  if (profileText.length > MAX_INPUT_CHARS) {
    return errorResponse("INPUT_TOO_LONG", `profile 已超过 ${MAX_INPUT_CHARS} 字`);
  }
  const totalChars = profileText.length + recentPosts.join("").length + (parsed.data.performanceNotes ?? []).join("").length;
  if (totalChars > MAX_TOTAL_INTAKE_CHARS) {
    return errorResponse("INPUT_TOO_LONG", `总输入已超过 ${MAX_TOTAL_INTAKE_CHARS} 字`);
  }

  // 4) 反编造生成（缺 env / 上游错误 / 解析失败均内部降级）
  //    构建本次输入的合法证据 ledger（profile / 帖N / 表现N），强制 evidenceRefs 必须来自它。
  const perfNotes = (parsed.data.performanceNotes ?? []).filter((p) => p.trim().length > 0);
  const validRefs = [
    "profile",
    ...recentPosts.map((_, i) => `帖${i + 1}`),
    ...perfNotes.map((_, i) => `表现${i + 1}`),
  ];
  const result = await generateAccountMemory(
    { profileText, recentPosts, performanceNotes: perfNotes, platform: parsed.data.platform },
    { validRefs },
  );
  if (!result.ok) {
    return errorResponse(result.errorCode ?? "GENERATION_FAILED", result.errorMessage ?? "生成失败", true);
  }

  // 5) 持久化：批量写 account_memory_items（RLS 以登录用户身份写 user_id）
  //    只写通过反编造过滤的 items；dropped 不落库。
  let savedCount = 0;
  if (result.items.length > 0) {
    const rows = result.items.map((it) => ({
      user_id: user.id,
      kind: it.kind,
      body: it.body,
      source: it.source,
      evidence_refs: it.evidenceRefs,
      evidence_count: it.evidenceCount,
      freshness_at: it.freshnessAt,
      status: it.status,
    }));
    const { data, error } = await supabase.from("account_memory_items").insert(rows).select("id");
    if (error || !data) {
      return errorResponse("DATABASE_ERROR", "账号记忆保存失败，请稍后重试", true);
    }
    savedCount = data.length;
  }

  // 6) 成功：返回保留/丢弃计数 + 记忆项（供首屏展示账号大脑）
  return Response.json({
    ok: true,
    data: {
      saved: savedCount,
      dropped: result.dropped.length,
      items: result.items,
    },
  });
}
