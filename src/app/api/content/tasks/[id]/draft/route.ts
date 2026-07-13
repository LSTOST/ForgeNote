// ForgeNote G0S-08 — PUT /api/content/tasks/:id/draft（保存用户编辑的主内容草稿）。
// 前提：主内容已生成（main_content_documents 行存在，由 /api/content/main 建立）。
// 流程：校验 → 鉴权 → 验 task 归属（RLS）→ 更新 draft_sections → 触碰 task.updated_at（列表排序）。
// 边界：不改生成稿 content 本身；表未迁移（0005 未 apply）返回 MAIN_CONTENT_NOT_FOUND。

import { z } from "zod";

import { getAuthenticatedContext } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteErrorCode = "VALIDATION_FAILED" | "AUTH_REQUIRED" | "TASK_NOT_FOUND" | "MAIN_CONTENT_NOT_FOUND" | "DATABASE_ERROR";

function httpStatusFor(code: RouteErrorCode): number {
  switch (code) {
    case "VALIDATION_FAILED":
      return 400;
    case "AUTH_REQUIRED":
      return 401;
    case "TASK_NOT_FOUND":
    case "MAIN_CONTENT_NOT_FOUND":
      return 404;
    default:
      return 500;
  }
}

function errorResponse(code: RouteErrorCode, message: string, retryable?: boolean): Response {
  const error: Record<string, unknown> = { code, message };
  if (retryable !== undefined) error.retryable = retryable;
  return Response.json({ ok: false, error }, { status: httpStatusFor(code) });
}

// 与 /api/content/derive 的 sections 限制保持一致（role 64 / heading 200 / text 8000）。
const bodySchema = z.object({
  draftSections: z
    .array(z.object({ role: z.string().max(64), heading: z.string().max(200), text: z.string().max(8000) }))
    .min(1)
    .max(40),
  outputLocale: z.string().max(32).nullish(),
});

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorResponse("VALIDATION_FAILED", "请求体不是合法 JSON");
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return errorResponse("VALIDATION_FAILED", "请求参数不合法");

  const auth = await getAuthenticatedContext();
  if (!auth) return errorResponse("AUTH_REQUIRED", "需要登录后才能保存草稿");
  const { supabase, user } = auth;

  // 验 task 归属（RLS：读不到 = 非本人/不存在）
  const { data: task, error: taskErr } = await supabase.from("content_tasks").select("id, status").eq("id", id).single();
  if (taskErr || !task) return errorResponse("TASK_NOT_FOUND", "任务不存在或无权访问");

  // 更新草稿（行不存在 = 主内容尚未生成，或 0005 未迁移）
  const update: Record<string, unknown> = { draft_sections: parsed.data.draftSections };
  if (parsed.data.outputLocale !== undefined) update.output_locale = parsed.data.outputLocale;
  const { data: updated, error: updateErr } = await supabase
    .from("main_content_documents")
    .update(update)
    .eq("task_id", id)
    .select("id")
    .maybeSingle();
  if (updateErr) return errorResponse("DATABASE_ERROR", "草稿保存失败，请稍后重试", true);
  if (!updated) return errorResponse("MAIN_CONTENT_NOT_FOUND", "主内容尚未生成或尚未持久化，无法保存草稿");

  // 触碰 task.updated_at（set_updated_at 触发器在 update 时刷新），让「最近内容」排序反映编辑
  await supabase.from("content_tasks").update({ status: task.status }).eq("id", id).eq("user_id", user.id);

  return Response.json({ ok: true, data: { savedAt: new Date().toISOString() } });
}
