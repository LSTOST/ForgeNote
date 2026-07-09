import { z } from "zod";

import { logGate0Event } from "@/lib/gate0/events";
import { buildPerformanceMemoryBody, PERFORMANCE_RANGE_VALUES } from "@/lib/performance/learning";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteErrorCode = "VALIDATION_FAILED" | "AUTH_REQUIRED" | "TASK_NOT_FOUND" | "ARTIFACT_NOT_FOUND" | "DATABASE_ERROR";

function httpStatusFor(code: RouteErrorCode): number {
  switch (code) {
    case "VALIDATION_FAILED":
      return 400;
    case "AUTH_REQUIRED":
      return 401;
    case "TASK_NOT_FOUND":
    case "ARTIFACT_NOT_FOUND":
      return 404;
    default:
      return 500;
  }
}

function errorResponse(code: RouteErrorCode, message: string): Response {
  return Response.json({ ok: false, error: { code, message } }, { status: httpStatusFor(code) });
}

const rangeSchema = z.enum(PERFORMANCE_RANGE_VALUES);
const bodySchema = z
  .object({
    taskId: z.string().uuid().nullish(),
    renderArtifactId: z.string().uuid().nullish(),
    platform: z.string().max(64).nullish(),
    publishedAt: z.string().datetime().nullish(),
    metrics: z
      .object({
        likeRange: rangeSchema.nullish(),
        favoriteRange: rangeSchema.nullish(),
        commentRange: rangeSchema.nullish(),
        followerGainRange: rangeSchema.nullish(),
      })
      .default({}),
    vsMedian: z.string().max(32).nullish(),
    note: z.string().max(500).nullish(),
    learningSignal: z.enum(["validated", "invalidated", "new_signal"]).default("new_signal"),
  })
  .refine((value) => value.taskId || value.renderArtifactId, { message: "taskId or renderArtifactId required" });

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
  if (!auth) return errorResponse("AUTH_REQUIRED", "需要登录后才能回填表现");
  const { supabase, user } = auth;
  const input = parsed.data;

  let taskId = input.taskId ?? null;
  if (taskId) {
    const { data: task, error } = await supabase.from("content_tasks").select("id").eq("id", taskId).eq("user_id", user.id).maybeSingle();
    if (error) return errorResponse("DATABASE_ERROR", "任务校验失败，请稍后重试");
    if (!task) return errorResponse("TASK_NOT_FOUND", "任务不存在或无权访问");
  }

  if (input.renderArtifactId) {
    const { data: artifact, error } = await supabase
      .from("render_artifacts")
      .select("id, task_id")
      .eq("id", input.renderArtifactId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) return errorResponse("DATABASE_ERROR", "产物校验失败，请稍后重试");
    if (!artifact) return errorResponse("ARTIFACT_NOT_FOUND", "产物不存在或无权访问");
    taskId = taskId ?? artifact.task_id;
  }

  const metrics = Object.fromEntries(Object.entries(input.metrics).filter(([, value]) => value !== null && value !== undefined));
  const { data: record, error: recordErr } = await supabase
    .from("performance_records")
    .insert({
      user_id: user.id,
      task_id: taskId,
      render_artifact_id: input.renderArtifactId ?? null,
      platform: input.platform ?? null,
      published_at: input.publishedAt ?? null,
      metrics,
      vs_median: input.vsMedian ?? null,
      note: input.note?.trim() || null,
    })
    .select("id, task_id, published_at")
    .single();
  if (recordErr || !record) return errorResponse("DATABASE_ERROR", "表现记录保存失败，请稍后重试");

  const memoryBody = buildPerformanceMemoryBody({
    taskId,
    platform: input.platform,
    metrics,
    vsMedian: input.vsMedian,
    note: input.note,
    learningSignal: input.learningSignal,
  });

  const { data: memory, error: memoryErr } = await supabase
    .from("account_memory_items")
    .insert({
      user_id: user.id,
      kind: "proven_pattern",
      body: memoryBody,
      source: "user_observation",
      evidence_refs: [`performance:${record.id}`],
      evidence_count: 1,
      freshness_at: new Date().toISOString(),
      status: "active",
    })
    .select("id")
    .single();
  if (memoryErr || !memory) return errorResponse("DATABASE_ERROR", "表现已记录，但账号记忆写回失败");

  if (taskId && input.publishedAt) {
    await supabase.from("content_tasks").update({ status: "published" }).eq("id", taskId).eq("user_id", user.id);
    await logGate0Event({ supabase, userId: user.id, eventName: "published_marked", taskId, payload: { platform: input.platform ?? "" } });
  }
  await logGate0Event({
    supabase,
    userId: user.id,
    eventName: "performance_filled",
    taskId,
    payload: { platform: input.platform ?? "", fields: Object.keys(metrics), learning_signal: input.learningSignal },
  });

  return Response.json({
    ok: true,
    data: {
      performanceRecordId: record.id,
      memoryItemId: memory.id,
      taskId,
      published: record.published_at !== null,
    },
  });
}
