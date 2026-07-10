// ForgeNote IA — /first-run 登录后 App Home（Server Component）。
// 受保护：未登录（或未配置 Supabase）→ 跳 /login。

import { redirect } from "next/navigation";

import { AppHome } from "@/components/home/AppHome";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FirstRunPage() {
  const auth = await getAuthenticatedContext();
  if (!auth) {
    redirect("/login");
  }
  return <AppHome userEmail={auth.user.email ?? ""} />;
}
