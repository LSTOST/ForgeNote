// ForgeNote M2-08 — POST /api/render（stable 结构 → 平台产物 + 持久化）。
// 流程：校验 → 鉴权 → 按 RLS 加载 structure_documents → 稳定性/兼容性门控 → renderer → 写 render_artifacts。
// 边界：只渲染已落库的 stable 结构（不信任客户端传结构，防偷改）；必须登录；不绕过 RLS。
// 依据：/api/structure/generate 约定、M2-03 契约、M2-08 renderers、migration 0003。

import { z } from "zod";

import { getRenderer } from "@/lib/render/renderers";
import type { RendererId } from "@/lib/render/contract";
import { buildAccountBrainSnapshot } from "@/lib/account/brain-snapshot";
import type { AccountMemoryItem, MemoryKind, MemorySource, MemoryStatus } from "@/lib/account/types";
import type { ModalityKey, PendingDecision, StructureDocument, StructureSlot } from "@/lib/structure/types";
import { evaluateStability } from "@/lib/structure/stability";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteErrorCode =
  | "VALIDATION_FAILED"
  | "AUTH_REQUIRED"
  | "STRUCTURE_NOT_FOUND"
  | "STRUCTURE_UNSTABLE"
  | "RENDERER_INCOMPATIBLE"
  | "MODEL_NOT_CONFIGURED"
  | "GENERATION_FAILED"
  | "DATABASE_ERROR";

function httpStatusFor(code: RouteErrorCode): number {
  switch (code) {
    case "VALIDATION_FAILED":
      return 400;
    case "AUTH_REQUIRED":
      return 401;
    case "STRUCTURE_NOT_FOUND":
      return 404;
    case "STRUCTURE_UNSTABLE":
    case "RENDERER_INCOMPATIBLE":
      return 409;
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

const RENDERER_IDS = ["xiaohongshu", "x_thread", "image_prompt"] as const satisfies readonly RendererId[];

const bodySchema = z.object({
  structureId: z.string().uuid(),
  rendererId: z.enum(RENDERER_IDS),
  language: z.string().max(32).optional(),
  lengthHint: z.string().max(64).optional(),
});

/** 加载账号记忆的条数上限（按证据/新鲜度取前 N；防 prompt 过大，快照再逐类限量）。 */
const ACCOUNT_MEMORY_RENDER_LIMIT = 40;

/** account_memory_items 行（snake_case）→ AccountMemoryItem（camelCase）。 */
function rowToMemoryItem(row: {
  kind: string;
  body: unknown;
  source: string;
  evidence_refs: unknown;
  evidence_count: number | null;
  freshness_at: string | null;
  status: string;
}): AccountMemoryItem {
  return {
    kind: row.kind as MemoryKind,
    body: (row.body as Record<string, unknown>) ?? {},
    source: row.source as MemorySource,
    evidenceRefs: (row.evidence_refs as string[]) ?? [],
    evidenceCount: row.evidence_count ?? 0,
    freshnessAt: row.freshness_at ?? "",
    status: row.status as MemoryStatus,
  };
}

/** DB 行（snake_case jsonb）→ StructureDocument（camelCase）。 */
function rowToStructure(row: {
  id: string;
  task_id: string;
  vocab_version: string;
  prototype_key: string;
  modality_stack: unknown;
  slots: unknown;
  pending_decisions: unknown;
  stability_status: string;
  structure_hash: string | null;
}): StructureDocument {
  return {
    id: row.id,
    taskId: row.task_id,
    vocabVersion: row.vocab_version,
    prototypeKey: row.prototype_key,
    modalityStack: (row.modality_stack as ModalityKey[]) ?? ["narrative"],
    slots: (row.slots as StructureSlot[]) ?? [],
    pendingDecisions: (row.pending_decisions as PendingDecision[]) ?? [],
    stabilityStatus: row.stability_status === "stable" ? "stable" : "unstable",
    structureHash: row.structure_hash ?? undefined,
  };
}

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
  if (!auth) return errorResponse("AUTH_REQUIRED", "需要登录后才能渲染");
  const { supabase, user } = auth;

  // 3) 按 RLS 加载结构（只能读自己的；读不到 = 不存在或非本人）
  const { data: row, error: loadErr } = await supabase
    .from("structure_documents")
    .select("id, task_id, vocab_version, prototype_key, modality_stack, slots, pending_decisions, stability_status, structure_hash")
    .eq("id", parsed.data.structureId)
    .single();
  if (loadErr || !row) return errorResponse("STRUCTURE_NOT_FOUND", "结构不存在或无权访问");

  const structure = rowToStructure(row);
  const rendererId = parsed.data.rendererId;

  // 加载主题（"写什么"）：renderer 需要主题才能产出具体内容而非通用套话。
  const { data: taskRow } = await supabase.from("content_tasks").select("raw_intent").eq("id", structure.taskId).single();
  const intent = taskRow?.raw_intent ?? "";

  // 加载账号大脑（"用谁的声音写"）：Owner 已存的账号记忆，只读地贴合声音/受众/规则。
  //   按 RLS 只读自己的（user_id = auth.uid() 隐含）；只取 active，按证据/新鲜度取前 N，防 prompt 过大。
  //   铁律（Codex §4）：renderer 只能用它调格式/语气/长度/禁用词/标签习惯，绝不反向改结构、选题或回写账号大脑。
  const { data: memoryRows } = await supabase
    .from("account_memory_items")
    .select("kind, body, source, evidence_refs, evidence_count, freshness_at, status")
    .eq("status", "active")
    .order("evidence_count", { ascending: false })
    .order("freshness_at", { ascending: false, nullsFirst: false })
    .limit(ACCOUNT_MEMORY_RENDER_LIMIT);
  const accountBrain = buildAccountBrainSnapshot((memoryRows ?? []).map(rowToMemoryItem));

  // 4) 稳定性门控：只渲染 stable 结构（以服务端重新评估为准，不信任落库标记被篡改）
  const stability = evaluateStability(structure, { targetRendererId: rendererId });
  if (!stability.stable) {
    return errorResponse("STRUCTURE_UNSTABLE", `结构未稳定，暂不能渲染：${stability.blockers.join("；")}`);
  }

  // 5) renderer 兼容性
  const renderer = getRenderer(rendererId);
  if (!renderer.supports(structure)) {
    return errorResponse("RENDERER_INCOMPATIBLE", `${rendererId} 不支持当前结构的模态`);
  }

  // 6) 渲染（accountBrain 只读传入，贴账号声音；缺 env / 上游错误内部由 fill 抛出）
  let artifact;
  try {
    artifact = await renderer.render({
      intent,
      structure,
      accountBrain,
      target: { rendererId, language: parsed.data.language, lengthHint: parsed.data.lengthHint },
      constraints: [],
    });
  } catch (error) {
    // 区分配置缺失与生成失败（P2：不要把缺 env 误报成渲染失败）。
    const { ModelNotConfiguredError } = await import("@/lib/ai/openrouter-client");
    if (error instanceof ModelNotConfiguredError) {
      return errorResponse("MODEL_NOT_CONFIGURED", error.message);
    }
    return errorResponse("GENERATION_FAILED", "渲染失败，请稍后重试", true);
  }

  // 7) 持久化 render_artifacts（RLS）
  const { data: saved, error: saveErr } = await supabase
    .from("render_artifacts")
    .insert({
      user_id: user.id,
      task_id: structure.taskId,
      structure_id: structure.id,
      renderer_id: artifact.rendererId,
      renderer_version: artifact.rendererVersion,
      source_structure_hash: artifact.sourceStructureHash,
      format: artifact.format,
      output: artifact.output,
      warnings: artifact.warnings,
    })
    .select("id")
    .single();
  if (saveErr || !saved) return errorResponse("DATABASE_ERROR", "渲染结果保存失败，请稍后重试", true);

  // 8) 成功
  return Response.json({ ok: true, data: { artifactId: saved.id, artifact } });
}
