// ForgeNote M2-09 重做 Step 1 — POST /api/content/main（结构 → 平台无关主内容）。
// 流程：校验 → 鉴权 → 按 RLS 加载 structure_documents → 加载主题 + 账号大脑 → 生成主内容。
// 与 /api/render 的区别：产出平台无关的可读主内容（中区展示/编辑），**不做稳定性门控**
// （主内容是用户 refine 的工作稿；稳定后才由平台 renderer 派生，那步才 gate 稳定性）。
// 铁律同 renderer：只读 structure，不改结构/选题；必须登录；不绕过 RLS。

import { z } from "zod";

import { buildAccountBrainSnapshot } from "@/lib/account/brain-snapshot";
import type { AccountMemoryItem, MemoryKind, MemorySource, MemoryStatus } from "@/lib/account/types";
import { buildOutline, generateMainContent } from "@/lib/content/main-content";
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

const bodySchema = z.object({
  structureId: z.string().uuid(),
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
  if (!auth) return errorResponse("AUTH_REQUIRED", "需要登录后才能生成内容");
  const { supabase } = auth;

  // 3) 按 RLS 加载结构（只能读自己的）
  const { data: row, error: loadErr } = await supabase
    .from("structure_documents")
    .select("id, task_id, vocab_version, prototype_key, modality_stack, slots, pending_decisions, stability_status, structure_hash")
    .eq("id", parsed.data.structureId)
    .single();
  if (loadErr || !row) return errorResponse("STRUCTURE_NOT_FOUND", "结构不存在或无权访问");
  const structure = rowToStructure(row);

  // 4) 主题（"写什么"）
  const { data: taskRow } = await supabase.from("content_tasks").select("raw_intent").eq("id", structure.taskId).single();
  const intent = taskRow?.raw_intent ?? "";

  // 5) 账号大脑（"用谁的声音写"）：只读、只取 active、按证据/新鲜度取前 N
  const { data: memoryRows } = await supabase
    .from("account_memory_items")
    .select("kind, body, source, evidence_refs, evidence_count, freshness_at, status")
    .eq("status", "active")
    .order("evidence_count", { ascending: false })
    .order("freshness_at", { ascending: false, nullsFirst: false })
    .limit(ACCOUNT_MEMORY_RENDER_LIMIT);
  const accountBrain = buildAccountBrainSnapshot((memoryRows ?? []).map(rowToMemoryItem));

  // 6) 提纲（确定性、免模型）+ 主内容（模型生成，不 gate 稳定性）
  const outline = buildOutline(structure);
  let mainContent;
  try {
    mainContent = await generateMainContent({ intent, structure, accountBrain, language: parsed.data.language });
  } catch (error) {
    const { ModelNotConfiguredError } = await import("@/lib/ai/openrouter-client");
    if (error instanceof ModelNotConfiguredError) {
      return errorResponse("MODEL_NOT_CONFIGURED", error.message);
    }
    return errorResponse("GENERATION_FAILED", "主内容生成失败，请稍后重试", true);
  }

  return Response.json({ ok: true, data: { outline, mainContent } });
}
