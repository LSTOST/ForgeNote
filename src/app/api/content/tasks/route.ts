// ForgeNote G0S-08 — GET /api/content/tasks（最近内容任务列表，供工作台左栏「最近内容」重开）。
// 流程：鉴权 → 按 RLS 读本人 content_tasks（updated_at 倒序，limit 20）→ 返回轻量摘要。
// 边界：必须登录；不返回全文（raw_intent 截断到 80 字，仅供列表识别）。

import { getAuthenticatedContext } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIST_LIMIT = 20;
const INTENT_PREVIEW_CHARS = 80;

export async function GET(): Promise<Response> {
  const auth = await getAuthenticatedContext();
  if (!auth) {
    return Response.json({ ok: false, error: { code: "AUTH_REQUIRED", message: "需要登录后才能查看任务" } }, { status: 401 });
  }
  const { supabase } = auth;

  const { data, error } = await supabase
    .from("content_tasks")
    .select("id, title, raw_intent, status, prototype_key, source_type, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(LIST_LIMIT);
  if (error) {
    return Response.json({ ok: false, error: { code: "DATABASE_ERROR", message: "任务列表读取失败，请稍后重试", retryable: true } }, { status: 500 });
  }

  const tasks = (data ?? []).map((row) => ({
    id: row.id as string,
    title: (row.title as string | null) ?? null,
    intentPreview: ((row.raw_intent as string) ?? "").slice(0, INTENT_PREVIEW_CHARS),
    status: row.status as string,
    prototypeKey: (row.prototype_key as string | null) ?? null,
    sourceType: row.source_type as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));

  return Response.json({ ok: true, data: { tasks } });
}
