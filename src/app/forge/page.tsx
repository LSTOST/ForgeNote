import { redirect } from "next/navigation";

import { ForgeWorkbench } from "@/components/forge/ForgeWorkbench";
import { TopNav } from "@/components/layout/TopNav";
import { PRODUCT_NAME, SLOGAN } from "@/lib/constants";
import { getCurrentUser } from "@/lib/supabase/server";

// 受保护页面：未登录（或未配置 Supabase）→ 跳 /login。
// 在 Server Component 中贴近数据源做鉴权（Next.js 16 认证指南 DAL 模式），
// 与 /api/forge 的 RLS 共同构成纵深防护，不依赖 proxy 做唯一防线。
export const dynamic = "force-dynamic";

export default async function ForgePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <TopNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <header className="mb-8 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {PRODUCT_NAME}
          </h1>
          <p className="text-muted-foreground">{SLOGAN}</p>
        </header>

        <ForgeWorkbench />
      </main>
    </>
  );
}
