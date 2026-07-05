// ForgeNote M2-06 — POST /api/radar/generate（读账号大脑 → 生成本周选题卡 → 持久化）。
// 流程：鉴权 → 加载 account_memory_items(RLS) → 构建账号摘要 → 反编造生成雷达卡 → 写 radar_cards。
// 边界：必须登录；无用户不调模型/不落库；无伪热度（来源标签）；依据按 ledger 校验。
// 依据：/api/account/intake 约定、M2-06 域核心(radar/generate)、migration 0003/0004、Next.js 16 Route Handlers。

import { z } from "zod";

import { generateRadarCards } from "@/lib/radar/generate";
import type { RadarInput } from "@/lib/radar/types";
import { MAX_ACCOUNT_POST_CHARS } from "@/lib/constants";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteErrorCode = "VALIDATION_FAILED" | "AUTH_REQUIRED" | "MODEL_NOT_CONFIGURED" | "GENERATION_FAILED" | "DATABASE_ERROR";

function httpStatusFor(code: RouteErrorCode): number {
  switch (code) {
    case "VALIDATION_FAILED":
      return 400;
    case "AUTH_REQUIRED":
      return 401;
    case "MODEL_NOT_CONFIGURED":
      return 503;
    default:
      return 500;
  }
}

function errorResponse(code: RouteErrorCode, message: string, retryable?: boolean): Response {
  const error: Record<string, unknown> = { code, message };
  if (retryable !== undefined) error.retryable = retryable;
  return Response.json({ ok: false, error }, { status: httpStatusFor(code) });
}

const bodySchema = z.object({
  recentObservations: z.array(z.string().max(MAX_ACCOUNT_POST_CHARS)).max(20).optional(),
  count: z.number().int().min(1).max(8).optional(),
});

/** 把记忆 body 压成一句短文本（供 prompt / 摘要用；不外泄结构复杂度）。 */
function summarizeBody(body: Record<string, unknown>): string {
  return Object.values(body)
    .filter((v) => typeof v === "string")
    .join("、")
    .slice(0, 120);
}

export async function POST(request: Request): Promise<Response> {
  // 1) body（可空：无 body 也能只凭账号大脑出卡）
  let bodyRaw: unknown = {};
  try {
    const text = await request.text();
    if (text) bodyRaw = JSON.parse(text);
  } catch {
    return errorResponse("VALIDATION_FAILED", "请求体不是合法 JSON");
  }
  const parsed = bodySchema.safeParse(bodyRaw);
  if (!parsed.success) return errorResponse("VALIDATION_FAILED", "请求参数不合法");

  // 2) 鉴权
  const auth = await getAuthenticatedContext();
  if (!auth) return errorResponse("AUTH_REQUIRED", "需要登录后才能生成选题");
  const { supabase, user } = auth;

  // 3) 加载账号大脑（RLS 只读自己的 active）
  const { data: rows } = await supabase
    .from("account_memory_items")
    .select("kind, body, evidence_count")
    .eq("status", "active")
    .order("evidence_count", { ascending: false })
    .limit(40);
  const items = (rows ?? []) as { kind: string; body: Record<string, unknown>; evidence_count: number | null }[];

  const pick = (kind: string) => items.filter((r) => r.kind === kind).map((r) => summarizeBody(r.body)).filter(Boolean);
  const provenPatterns = pick("proven_pattern");
  const topics = pick("topic");
  const accountSummary: RadarInput["accountSummary"] = {
    audience: pick("audience")[0],
    voice: pick("voice")[0],
    provenPatterns,
    topics,
  };
  const recentObservations = (parsed.data.recentObservations ?? []).filter((o) => o.trim().length > 0);

  // 依据 ledger：account + 规律N + 观察N（强制 evidenceRefs 来自它，防伪造）
  const validRefs = [
    "account",
    ...provenPatterns.map((_, i) => `规律${i + 1}`),
    ...recentObservations.map((_, i) => `观察${i + 1}`),
  ];

  // 4) 反编造生成（无伪热度；缺 env / 上游错误内部降级）
  const count = parsed.data.count ?? 5;
  const result = await generateRadarCards({ accountSummary, recentObservations, count }, { validRefs });
  if (!result.ok) {
    return errorResponse(result.errorCode ?? "GENERATION_FAILED", result.errorMessage ?? "选题生成失败", true);
  }

  // 5) 持久化 radar_cards（RLS）；week_of = 本周一
  const weekOf = mondayOf(new Date());
  let saved = 0;
  if (result.cards.length > 0) {
    const insertRows = result.cards.map((c) => ({
      user_id: user.id,
      week_of: weekOf,
      topic: c.topic,
      prototype_key: c.prototypeKey ?? null,
      hook_example: c.hookExample ?? null,
      suggested_platform: c.suggestedPlatform ?? null,
      evidence_source: c.evidenceSource,
      evidence_refs: c.evidenceRefs,
      status: c.status,
    }));
    const { data, error } = await supabase.from("radar_cards").insert(insertRows).select("id");
    if (error || !data) return errorResponse("DATABASE_ERROR", "选题保存失败，请稍后重试", true);
    saved = data.length;
  }

  return Response.json({ ok: true, data: { saved, dropped: result.dropped.length, cards: result.cards } });
}

/** 本周一（yyyy-mm-dd）。 */
function mondayOf(d: Date): string {
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon.toISOString().slice(0, 10);
}
