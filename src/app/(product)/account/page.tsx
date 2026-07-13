// ForgeNote IA — /account 账号分析页（Server Component）。
// 受保护：未登录（或未配置 Supabase）→ 跳 /login；账号接入业务逻辑仍由 AccountIntake 调 /api/account/intake。

import { redirect } from "next/navigation";

import { AccountIntake } from "@/components/account/AccountIntake";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const auth = await getAuthenticatedContext();
  if (!auth) {
    redirect("/login");
  }
  return <AccountIntake />;
}
