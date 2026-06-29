// ForgeNote M1 — /login（Batch B，工具型页面，按 UIUX §4 实现）。
// Server Component：已登录直接跳 /forge；未登录渲染登录表单。
// 配置缺失不在此拦截——交给 LoginForm 显示明确「未配置」提示，避免白屏。

import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // 已登录访问 /login → 直接进工作台（UIUX §4.2）。
  const user = await getCurrentUser();
  if (user) {
    redirect("/forge");
  }

  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-[#F5EFE6] bg-[radial-gradient(rgba(120,90,50,0.045)_1px,transparent_1px)] [background-size:5px_5px] px-5 py-8 text-[#33291F] sm:px-6 sm:py-12">
      <LoginForm initialError={error} />
    </main>
  );
}
