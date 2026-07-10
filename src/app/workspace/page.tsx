// ForgeNote M2-09 — /workspace 四区工作台页（Server Component）。
// 受保护：未登录 → 跳 /login（DAL 纵深防护，与路由 RLS 双层）。

import { redirect } from "next/navigation";

import { Workspace } from "@/components/workspace/Workspace";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ idea?: string | string[] }>;
}) {
  const auth = await getAuthenticatedContext();
  if (!auth) {
    redirect("/login");
  }
  // 从选题卡进入工作台时，通过 /workspace?idea=<主题> 预填想法输入。
  const ideaParam = (await searchParams).idea;
  const initialIdea = (Array.isArray(ideaParam) ? ideaParam[0] : ideaParam)?.slice(0, 2000) ?? "";
  return <Workspace initialIdea={initialIdea} userEmail={auth.user.email ?? ""} />;
}
