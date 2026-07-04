// ForgeNote M2-08 — POST /api/render（stable 结构 → 平台产物 + 持久化）。
// 流程：校验 → 鉴权 → 按 RLS 加载 structure_documents → 稳定性/兼容性门控 → renderer → 写 render_artifacts。
// 边界：只渲染已落库的 stable 结构（不信任客户端传结构，防偷改）；必须登录；不绕过 RLS。
// 依据：/api/structure/generate 约定、M2-03 契约、M2-08 renderers、migration 0003。

import { z } from "zod";

import { getRenderer } from "@/lib/render/renderers";
import type { RendererId } from "@/lib/render/contract";
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

  // 6) 渲染（accountBrain 暂传空切片；缺 env / 上游错误内部由 fill 抛出）
  let artifact;
  try {
    artifact = await renderer.render({
      structure,
      accountBrain: {},
      target: { rendererId, language: parsed.data.language, lengthHint: parsed.data.lengthHint },
      constraints: [],
    });
  } catch {
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
