// ForgeNote M2-05 — /first-run 首屏账号接入页（Server Component）。
// 受保护：未登录（或未配置 Supabase）→ 跳 /login（DAL 模式，与 /api/account/intake 的 RLS 纵深防护）。

import { redirect } from "next/navigation";

import { AccountIntake } from "@/components/account/AccountIntake";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FirstRunPage() {
  const auth = await getAuthenticatedContext();
  if (!auth) {
    redirect("/login");
  }
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <AccountIntake />
    </main>
  );
}
