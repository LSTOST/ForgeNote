// ForgeNote M1 — /login（Batch B，工具型页面，按 UIUX §4 实现）。
// Server Component：已登录直接跳 /first-run；未登录渲染登录表单。
// 配置缺失不在此拦截——交给 LoginForm 显示明确「未配置」提示，避免白屏。

import { redirect } from "next/navigation";

import { LoginBrandVisual } from "@/components/auth/LoginBrandVisual";
import { LoginForm } from "@/components/auth/LoginForm";
import { ForgeLogo } from "@/components/forge/ForgeLogo";
import { DEFAULT_AUTH_REDIRECT_PATH } from "@/lib/auth/redirect";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect(DEFAULT_AUTH_REDIRECT_PATH);
  }

  const { error } = await searchParams;

  return (
    <main className="login-shell flex min-h-svh w-full bg-background text-foreground">
      <LoginBrandVisual />
      <section className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-[380px]">
          <div className="mb-10 lg:hidden">
            <ForgeLogo href="/" />
          </div>
          <LoginForm initialError={error} />
        </div>
      </section>
    </main>
  );
}
