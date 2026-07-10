// ForgeNote M1 — /login（Batch B，工具型页面，按 UIUX §4 实现）。
// Server Component：已登录直接跳 /workspace（M2-04）；未登录渲染登录表单。
// 配置缺失不在此拦截——交给 LoginForm 显示明确「未配置」提示，避免白屏。

import { redirect } from "next/navigation";

import { LoginBrandVisual } from "@/components/auth/LoginBrandVisual";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // 已登录访问 /login → 直接进 v3 工作台（M2-04）。
  const user = await getCurrentUser();
  if (user) {
    redirect("/workspace");
  }

  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen bg-bg-app text-text-primary md:grid-cols-2">
      <LoginBrandVisual />
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 md:px-10 lg:px-12">
        <LoginForm initialError={error} />
      </section>
    </main>
  );
}
