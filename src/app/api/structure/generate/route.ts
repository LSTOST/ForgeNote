// ForgeNote M2-07 — POST /api/structure/generate（想法 → 结构 + 稳定性判定 + 持久化）。
// 流程：校验 → 鉴权 → 建 content_task → 生成结构(registry 校验) → 评估稳定性 → 写 structure_documents → 返回。
// 边界：必须登录（无用户 → AUTH_REQUIRED，不调 OpenRouter、不落库）；不绕过 RLS。
// 依据：/api/account/intake 约定、M2-07 域核心（generate/stability）、migration 0003、Next.js 16 Route Handlers。

import { z } from "zod";

import { MAX_INPUT_CHARS } from "@/lib/constants";
import { generateStructure } from "@/lib/structure/generate";
import { evaluateStability } from "@/lib/structure/stability";
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
  rawIntent: z.string(),
  prototypeKey: z.string().max(64).optional(),
  sourceType: z.enum(["own_idea", "radar", "recipe"]).optional(),
  sourceRefId: z.string().uuid().nullish(),
  title: z.string().max(200).optional(),
});

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

  // 2) 鉴权
  const auth = await getAuthenticatedContext();
  if (!auth) return errorResponse("AUTH_REQUIRED", "需要登录后才能生成");
  const { supabase, user } = auth;

  // 3) 业务校验
  const rawIntent = parsed.data.rawIntent.trim();
  if (rawIntent.length === 0) return errorResponse("INPUT_EMPTY", "想法不能为空");
  if (rawIntent.length > MAX_INPUT_CHARS) return errorResponse("INPUT_TOO_LONG", `想法已超过 ${MAX_INPUT_CHARS} 字`);

  // 4) 先建 content_task（Intent 落库；结构挂在 task 下）
  const { data: task, error: taskErr } = await supabase
    .from("content_tasks")
    .insert({
      user_id: user.id,
      raw_intent: rawIntent,
      prototype_key: parsed.data.prototypeKey ?? null,
      source_type: parsed.data.sourceType ?? "own_idea",
      source_ref_id: parsed.data.sourceRefId ?? null,
      title: parsed.data.title ?? null,
      status: "structuring",
    })
    .select("id")
    .single();
  if (taskErr || !task) return errorResponse("DATABASE_ERROR", "任务创建失败，请稍后重试", true);

  // 5) 生成结构（registry 校验在域核心内；缺 env / 上游错误内部降级）
  const result = await generateStructure({ rawIntent, prototypeKey: parsed.data.prototypeKey, taskId: task.id });
  if (!result.ok || !result.document) {
    // 失败：把 task 标为 failed（+ error），避免留下永久 structuring 僵尸任务（Codex blocker 4）。
    await supabase
      .from("content_tasks")
      .update({ status: "failed", error_code: result.errorCode ?? "GENERATION_FAILED", error_message: result.errorMessage ?? "结构生成失败" })
      .eq("id", task.id)
      .eq("user_id", user.id);
    return errorResponse(result.errorCode ?? "GENERATION_FAILED", result.errorMessage ?? "结构生成失败", true);
  }
  const doc = result.document;

  // 6) 评估稳定性（回填 stability + hash；中区主稿始终可读，不因 unstable 阻塞展示）
  const stability = evaluateStability(doc);
  const stableDoc = { ...doc, stabilityStatus: stability.stable ? ("stable" as const) : ("unstable" as const), structureHash: stability.structureHash };

  // 7) 持久化 structure_documents（RLS）
  const { data: saved, error: docErr } = await supabase
    .from("structure_documents")
    .insert({
      user_id: user.id,
      task_id: task.id,
      vocab_version: stableDoc.vocabVersion,
      prototype_key: stableDoc.prototypeKey,
      modality_stack: stableDoc.modalityStack,
      slots: stableDoc.slots,
      pending_decisions: stableDoc.pendingDecisions,
      stability_status: stableDoc.stabilityStatus,
      structure_hash: stableDoc.structureHash ?? null,
    })
    .select("id")
    .single();
  if (docErr || !saved) {
    await supabase
      .from("content_tasks")
      .update({ status: "failed", error_code: "DATABASE_ERROR", error_message: "结构保存失败" })
      .eq("id", task.id)
      .eq("user_id", user.id);
    return errorResponse("DATABASE_ERROR", "结构保存失败，请稍后重试", true);
  }

  // 成功：task 推进为 ready（有稳定/可编辑的结构）
  await supabase.from("content_tasks").update({ status: "ready" }).eq("id", task.id).eq("user_id", user.id);

  // 8) 成功：返回结构 + 稳定性报告（含 blockers，供右栏"拿不准/待就绪"展示）
  return Response.json({
    ok: true,
    data: {
      taskId: task.id,
      structureId: saved.id,
      structure: { ...stableDoc, id: saved.id },
      stability: { stable: stability.stable, blockers: stability.blockers, conditions: stability.conditions },
      dropped: result.dropped,
    },
  });
}
