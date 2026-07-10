// ForgeNote M2-07 — PATCH /api/structure/[id]/slot（设置/修改一个 slot 的 strategy → 重评稳定性 → 回写）。
// 让右栏结构骨架可编辑：填待定义的 slot、或改已定策略。strategy 必须过 registry 校验（属于该 slot）。
// 边界：必须登录；按 RLS 只能改自己的结构；不信任客户端传结构（按 id 加载再改）。
// 依据：/api/structure/[id]/decision 约定、M2-07 registry/stability、migration 0003、Next.js 16 Route Handlers。

import { z } from "zod";

import { logGate0Event } from "@/lib/gate0/events";
import { resolveToken } from "@/lib/structure/registry";
import { evaluateStability } from "@/lib/structure/stability";
import type { ModalityKey, PendingDecision, StructureDocument, StructureSlot } from "@/lib/structure/types";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteErrorCode =
  | "VALIDATION_FAILED"
  | "AUTH_REQUIRED"
  | "STRUCTURE_NOT_FOUND"
  | "SLOT_NOT_FOUND"
  | "INVALID_STRATEGY"
  | "DATABASE_ERROR";

function httpStatusFor(code: RouteErrorCode): number {
  switch (code) {
    case "VALIDATION_FAILED":
    case "INVALID_STRATEGY":
      return 400;
    case "AUTH_REQUIRED":
      return 401;
    case "STRUCTURE_NOT_FOUND":
    case "SLOT_NOT_FOUND":
      return 404;
    default:
      return 500;
  }
}

function errorResponse(code: RouteErrorCode, message: string): Response {
  return Response.json({ ok: false, error: { code, message } }, { status: httpStatusFor(code) });
}

const bodySchema = z.object({ slotKey: z.string().min(1), strategyKey: z.string().min(1) });

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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorResponse("VALIDATION_FAILED", "请求体不是合法 JSON");
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return errorResponse("VALIDATION_FAILED", "请求参数不合法");
  if (!z.string().uuid().safeParse(id).success) return errorResponse("VALIDATION_FAILED", "结构 id 不合法");

  // strategy 必须是合法 strategy 且能挂在该 slot 下（防越级/近义漂移）
  const stratRes = resolveToken(parsed.data.strategyKey, { expectedKind: "strategy", parent: parsed.data.slotKey });
  if (!stratRes.known) return errorResponse("INVALID_STRATEGY", `策略 ${parsed.data.strategyKey} 不适用于 slot ${parsed.data.slotKey}`);
  const strategyKey = stratRes.token.key;

  const auth = await getAuthenticatedContext();
  if (!auth) return errorResponse("AUTH_REQUIRED", "需要登录后才能编辑结构");
  const { supabase, user } = auth;

  const { data: row, error: loadErr } = await supabase
    .from("structure_documents")
    .select("id, task_id, vocab_version, prototype_key, modality_stack, slots, pending_decisions, stability_status, structure_hash")
    .eq("id", id)
    .single();
  if (loadErr || !row) return errorResponse("STRUCTURE_NOT_FOUND", "结构不存在或无权访问");

  const structure = rowToStructure(row);
  if (!structure.slots.some((s) => s.key === parsed.data.slotKey)) {
    return errorResponse("SLOT_NOT_FOUND", `slot ${parsed.data.slotKey} 不在结构中`);
  }

  const updatedSlots: StructureSlot[] = structure.slots.map((s) => (s.key === parsed.data.slotKey ? { ...s, strategyKey } : s));
  const updatedStructure: StructureDocument = { ...structure, slots: updatedSlots };

  const stability = evaluateStability(updatedStructure);
  const stabilityStatus = stability.stable ? "stable" : "unstable";

  const { error: updErr } = await supabase
    .from("structure_documents")
    .update({ slots: updatedSlots, stability_status: stabilityStatus, structure_hash: stability.structureHash ?? null })
    .eq("id", id)
    .eq("user_id", user.id);
  if (updErr) return errorResponse("DATABASE_ERROR", "结构保存失败，请稍后重试");
  await logGate0Event({
    supabase,
    userId: user.id,
    eventName: "structure_slot_edited",
    taskId: structure.taskId,
    payload: { structure_id: id, slot_key: parsed.data.slotKey, strategy_key: strategyKey },
  });

  return Response.json({
    ok: true,
    data: {
      structure: { ...updatedStructure, stabilityStatus, structureHash: stability.structureHash },
      stability: { stable: stability.stable, blockers: stability.blockers, conditions: stability.conditions },
    },
  });
}
