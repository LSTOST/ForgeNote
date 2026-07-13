// ForgeNote M2-09 — /workspace 四区工作台页（Server Component）。
// 受保护：未登录 → 跳 /login（DAL 纵深防护，与路由 RLS 双层）。

import { redirect } from "next/navigation";

import { Workspace, type TaskSummary } from "@/components/workspace/Workspace";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ idea?: string | string[]; taskId?: string | string[] }>;
}) {
  const auth = await getAuthenticatedContext();
  if (!auth) {
    redirect("/login");
  }
  const params = await searchParams;
  // 从选题卡进入工作台时，通过 /workspace?idea=<主题> 预填想法输入。
  const ideaParam = params.idea;
  const initialIdea = (Array.isArray(ideaParam) ? ideaParam[0] : ideaParam)?.slice(0, 2000) ?? "";
  // 从首页「最近内容」进入时，通过 /workspace?taskId=<id> 自动打开该任务。
  const taskIdParam = params.taskId;
  const initialTaskId = (Array.isArray(taskIdParam) ? taskIdParam[0] : taskIdParam) ?? "";

  // G0S-08：左栏「最近内容」初始列表在服务端取（RLS 隔离），客户端仅在用户动作后刷新。
  const { data: taskRows } = await auth.supabase
    .from("content_tasks")
    .select("id, title, raw_intent, status, updated_at")
    .order("updated_at", { ascending: false })
    .limit(20);
  const initialTasks: TaskSummary[] = (taskRows ?? []).map((row) => ({
    id: row.id as string,
    title: (row.title as string | null) ?? null,
    intentPreview: ((row.raw_intent as string) ?? "").slice(0, 80),
    status: row.status as string,
    updatedAt: row.updated_at as string,
  }));

  return (
    <Workspace
      initialIdea={initialIdea}
      userEmail={auth.user.email ?? ""}
      initialTasks={initialTasks}
      initialTaskId={initialTaskId}
      embedded
    />
  );
}
