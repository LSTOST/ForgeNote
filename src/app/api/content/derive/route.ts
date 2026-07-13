// ForgeNote M2-09 Step 4 — POST /api/content/derive（主内容 → 平台版）。
// Owner 定稿：主内容稳定后才派生。输入 = 用户编辑过的主内容 sections + 目标平台。
// 流程：校验 → 鉴权 → 用 structureId 按 RLS 验归属 + 载账号大脑 → deriveToPlatform → 返回。
// 与结构直渲不同：这里从主内容文本派生，带上用户编辑。

import { z } from "zod";

import { buildAccountBrainSnapshot } from "@/lib/account/brain-snapshot";
import type { AccountMemoryItem, MemoryKind, MemorySource, MemoryStatus } from "@/lib/account/types";
import { deriveToPlatform } from "@/lib/content/derive";
import { logGate0Event } from "@/lib/gate0/events";
import { structureHash, type RendererId } from "@/lib/render/contract";
import type { ModalityKey, PendingDecision, StructureDocument, StructureSlot } from "@/lib/structure/types";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteErrorCode =
  | "VALIDATION_FAILED"
  | "AUTH_REQUIRED"
  | "STRUCTURE_NOT_FOUND"
  | "MODEL_NOT_CONFIGURED"
  | "GENERATION_FAILED";

function httpStatusFor(code: RouteErrorCode): number {
  switch (code) {
    case "VALIDATION_FAILED":
      return 400;
    case "AUTH_REQUIRED":
      return 401;
    case "STRUCTURE_NOT_FOUND":
      return 404;
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
  sections: z
    .array(z.object({ role: z.string().max(64), heading: z.string().max(200), text: z.string().max(8000) }))
    .min(1)
    .max(40),
  language: z.string().max(32).optional(),
});

const ACCOUNT_MEMORY_RENDER_LIMIT = 40;

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

export async function POST(request: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorResponse("VALIDATION_FAILED", "请求体不是合法 JSON");
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return errorResponse("VALIDATION_FAILED", "请求参数不合法");

  const auth = await getAuthenticatedContext();
  if (!auth) return errorResponse("AUTH_REQUIRED", "需要登录后才能派生");
  const { supabase, user } = auth;

  // 用 structureId 按 RLS 验归属（读不到 = 非本人/不存在）；取全字段供归档时算结构指纹
  const { data: row, error: loadErr } = await supabase
    .from("structure_documents")
    .select("id, task_id, vocab_version, prototype_key, modality_stack, slots, pending_decisions, stability_status, structure_hash")
    .eq("id", parsed.data.structureId)
    .single();
  if (loadErr || !row) return errorResponse("STRUCTURE_NOT_FOUND", "结构不存在或无权访问");
  const structureDoc: StructureDocument = {
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

  // 账号大脑（只读，贴声音）
  const { data: memoryRows } = await supabase
    .from("account_memory_items")
    .select("kind, body, source, evidence_refs, evidence_count, freshness_at, status")
    .eq("status", "active")
    .order("evidence_count", { ascending: false })
    .order("freshness_at", { ascending: false, nullsFirst: false })
    .limit(ACCOUNT_MEMORY_RENDER_LIMIT);
  const accountBrain = buildAccountBrainSnapshot((memoryRows ?? []).map(rowToMemoryItem));

  let artifact;
  try {
    artifact = await deriveToPlatform({
      sections: parsed.data.sections,
      rendererId: parsed.data.rendererId,
      accountBrain,
      language: parsed.data.language,
    });
  } catch (error) {
    const { ModelNotConfiguredError } = await import("@/lib/ai/openrouter-client");
    if (error instanceof ModelNotConfiguredError) {
      return errorResponse("MODEL_NOT_CONFIGURED", error.message);
    }
    return errorResponse("GENERATION_FAILED", "派生失败，请稍后重试", true);
  }
  // 归档产物（G0S-08：render_artifacts 自 0003 建表后首次真正写入）。
  // 失败不阻塞返回——产物仍可复制，但带 persisted=false 供 UI 提示。
  // source_structure_hash：结构 stable 时用落库 hash，否则现算指纹（列 not null，且保留派生溯源）。
  const { data: savedArtifact, error: persistErr } = await supabase
    .from("render_artifacts")
    .insert({
      user_id: user.id,
      task_id: structureDoc.taskId,
      structure_id: structureDoc.id,
      renderer_id: artifact.rendererId,
      renderer_version: artifact.version,
      source_structure_hash: structureDoc.structureHash ?? structureHash(structureDoc),
      format: artifact.format,
      output: { units: artifact.units },
      warnings: artifact.warnings,
    })
    .select("id, created_at")
    .single();

  await logGate0Event({
    supabase,
    userId: user.id,
    eventName: "renderer_generated",
    taskId: structureDoc.taskId,
    payload: { structure_id: parsed.data.structureId, renderer_id: parsed.data.rendererId, format: artifact.format },
  });

  return Response.json({
    ok: true,
    data: {
      artifact,
      artifactId: savedArtifact?.id ?? null,
      artifactCreatedAt: savedArtifact?.created_at ?? null,
      persisted: !persistErr,
    },
  });
}
