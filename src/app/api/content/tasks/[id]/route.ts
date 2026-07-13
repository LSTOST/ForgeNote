// ForgeNote G0S-08 — GET /api/content/tasks/:id（单任务完整状态，供工作台重开恢复）。
// 返回：task 摘要 + 最新结构（含重算的稳定性报告）+ 主内容（生成稿 + 用户草稿）+ 平台版本归档。
// 边界：必须登录；RLS 隔离（读不到 = 非本人/不存在）；主内容表未迁移时优雅降级为 null。

import { evaluateStability } from "@/lib/structure/stability";
import type { ModalityKey, PendingDecision, StructureDocument, StructureSlot } from "@/lib/structure/types";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;

  const auth = await getAuthenticatedContext();
  if (!auth) {
    return Response.json({ ok: false, error: { code: "AUTH_REQUIRED", message: "需要登录后才能查看任务" } }, { status: 401 });
  }
  const { supabase } = auth;

  // 1) task（RLS：读不到 = 非本人/不存在）
  const { data: task, error: taskErr } = await supabase
    .from("content_tasks")
    .select("id, title, raw_intent, status, prototype_key, source_type, error_code, error_message, created_at, updated_at")
    .eq("id", id)
    .single();
  if (taskErr || !task) {
    return Response.json({ ok: false, error: { code: "TASK_NOT_FOUND", message: "任务不存在或无权访问" } }, { status: 404 });
  }

  // 2) 最新结构 + 重算稳定性（stability blockers/conditions 不落库，恢复时重算）
  const { data: structureRow } = await supabase
    .from("structure_documents")
    .select("id, task_id, vocab_version, prototype_key, modality_stack, slots, pending_decisions, stability_status, structure_hash")
    .eq("task_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const structure = structureRow ? rowToStructure(structureRow) : null;
  const stabilityReport = structure ? evaluateStability(structure) : null;

  // 3) 主内容（生成稿 + 用户草稿）。表未迁移（0005 未 apply）时降级为 null，不阻塞恢复。
  let mainContent: unknown = null;
  let draftSections: unknown = null;
  let outputLocale: string | null = null;
  const { data: mcRow, error: mcErr } = await supabase
    .from("main_content_documents")
    .select("content, draft_sections, output_locale")
    .eq("task_id", id)
    .maybeSingle();
  if (!mcErr && mcRow) {
    mainContent = mcRow.content ?? null;
    draftSections = mcRow.draft_sections ?? null;
    outputLocale = (mcRow.output_locale as string | null) ?? null;
  }

  // 4) 平台版本归档（最近 20 条）
  const { data: artifactRows } = await supabase
    .from("render_artifacts")
    .select("id, renderer_id, format, output, warnings, created_at")
    .eq("task_id", id)
    .order("created_at", { ascending: false })
    .limit(20);
  const artifacts = (artifactRows ?? []).map((row) => ({
    id: row.id as string,
    rendererId: row.renderer_id as string,
    format: row.format as string,
    units: ((row.output as { units?: { role: string; text: string }[] } | null)?.units ?? []) as { role: string; text: string }[],
    warnings: (row.warnings as string[]) ?? [],
    createdAt: row.created_at as string,
  }));

  return Response.json({
    ok: true,
    data: {
      task: {
        id: task.id,
        title: task.title ?? null,
        rawIntent: task.raw_intent,
        status: task.status,
        prototypeKey: task.prototype_key ?? null,
        sourceType: task.source_type,
        errorCode: task.error_code ?? null,
        errorMessage: task.error_message ?? null,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      },
      structure,
      stability: stabilityReport
        ? { stable: stabilityReport.stable, blockers: stabilityReport.blockers, conditions: stabilityReport.conditions }
        : null,
      mainContent,
      draftSections,
      outputLocale,
      artifacts,
    },
  });
}
