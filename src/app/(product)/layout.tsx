import { redirect } from "next/navigation";

import { AppShell, type ShellTask } from "@/components/layout/AppShell";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProductLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthenticatedContext();
  if (!auth) redirect("/login");

  const { data } = await auth.supabase
    .from("content_tasks")
    .select("id, title, raw_intent, updated_at")
    .order("updated_at", { ascending: false })
    .limit(8);
  const recentTasks: ShellTask[] = (data ?? []).map((row) => ({
    id: row.id as string,
    title: (row.title as string | null) ?? null,
    intentPreview: ((row.raw_intent as string) ?? "").slice(0, 80),
    updatedAt: row.updated_at as string,
  }));

  return <AppShell userEmail={auth.user.email ?? ""} recentTasks={recentTasks}>{children}</AppShell>;
}
