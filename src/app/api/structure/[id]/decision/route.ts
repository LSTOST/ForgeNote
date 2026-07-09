// ForgeNote M2-07 — PATCH /api/structure/[id]/decision（裁决一个待决策 → 重评稳定性 → 回写）。
// 让右栏"待裁决"可裁：选一个 option → 该决策 user_resolved → 重新评估稳定性 → 更新 structure_documents。
// 边界：必须登录；按 RLS 只能改自己的结构；不信任客户端传结构（只按 id 加载再改）。
// 依据：M2-07 stability、Next.js 16 Route Handlers（context.params 为 Promise）。

import { z } from "zod";

import { logGate0Event } from "@/lib/gate0/events";
import { evaluateStability } from "@/lib/structure/stability";
import type { ModalityKey, PendingDecision, StructureDocument, StructureSlot } from "@/lib/structure/types";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteErrorCode = "VALIDATION_FAILED" | "AUTH_REQUIRED" | "STRUCTURE_NOT_FOUND" | "DECISION_NOT_FOUND" | "INVALID_OPTION" | "DATABASE_ERROR";

function httpStatusFor(code: RouteErrorCode): number {
  switch (code) {
    case "VALIDATION_FAILED":
    case "INVALID_OPTION":
      return 400;
    case "AUTH_REQUIRED":
      return 401;
    case "STRUCTURE_NOT_FOUND":
    case "DECISION_NOT_FOUND":
      return 404;
    default:
      return 500;
  }
}

function errorResponse(code: RouteErrorCode, message: string): Response {
  return Response.json({ ok: false, error: { code, message } }, { status: httpStatusFor(code) });
}

const bodySchema = z.object({ key: z.string().min(1), resolvedValue: z.string().min(1) });

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

  const auth = await getAuthenticatedContext();
  if (!auth) return errorResponse("AUTH_REQUIRED", "需要登录后才能裁决");
  const { supabase, user } = auth;

  // 按 RLS 加载结构
  const { data: row, error: loadErr } = await supabase
    .from("structure_documents")
    .select("id, task_id, vocab_version, prototype_key, modality_stack, slots, pending_decisions, stability_status, structure_hash")
    .eq("id", id)
    .single();
  if (loadErr || !row) return errorResponse("STRUCTURE_NOT_FOUND", "结构不存在或无权访问");

  const structure = rowToStructure(row);
  const target = structure.pendingDecisions.find((d) => d.key === parsed.data.key);
  if (!target) return errorResponse("DECISION_NOT_FOUND", `待决策 ${parsed.data.key} 不存在`);

  // 防假门：resolvedValue 必须是该决策 options 之一（不允许任意文本解锁 stable）。
  //   无 options 的决策不允许自由裁决（避免绕过合法性）。
  if (!target.options || target.options.length === 0) {
    return errorResponse("INVALID_OPTION", "该决策无可选项，不能自由裁决");
  }
  if (!target.options.includes(parsed.data.resolvedValue)) {
    return errorResponse("INVALID_OPTION", `裁决值必须是 ${target.options.join(" / ")} 之一`);
  }

  // 裁决：该决策 user_resolved + resolvedValue
  const updatedDecisions: PendingDecision[] = structure.pendingDecisions.map((d) =>
    d.key === parsed.data.key ? { ...d, status: "user_resolved" as const, resolvedValue: parsed.data.resolvedValue } : d,
  );
  const updatedStructure: StructureDocument = { ...structure, pendingDecisions: updatedDecisions };

  // 重新评估稳定性（服务端为准）
  const stability = evaluateStability(updatedStructure);
  const stabilityStatus = stability.stable ? "stable" : "unstable";

  // 回写 pending_decisions + stability_status + structure_hash
  const { error: updErr } = await supabase
    .from("structure_documents")
    .update({
      pending_decisions: updatedDecisions,
      stability_status: stabilityStatus,
      structure_hash: stability.structureHash ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (updErr) return errorResponse("DATABASE_ERROR", "裁决保存失败，请稍后重试");
  await logGate0Event({
    supabase,
    userId: user.id,
    eventName: "decision_resolved",
    taskId: structure.taskId,
    payload: { structure_id: id, decision_key: parsed.data.key, resolved_value: parsed.data.resolvedValue },
  });

  return Response.json({
    ok: true,
    data: {
      structure: { ...updatedStructure, stabilityStatus, structureHash: stability.structureHash },
      stability: { stable: stability.stable, blockers: stability.blockers, conditions: stability.conditions },
    },
  });
}
