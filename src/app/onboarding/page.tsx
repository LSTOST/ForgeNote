import Link from "next/link";
import { Flame } from "lucide-react";

import { OnboardingPrototype } from "@/components/onboarding/OnboardingPrototype";
import { PRODUCT_NAME } from "@/lib/constants";

// 新用户引导态的高保真可点击原型（独立路由，不依赖鉴权 / 不改 forge 主链路）。
export const metadata = {
  title: "新用户引导态原型 · ForgeNote",
  description: "新人第一次只做一件事：开始第一条内容任务，先看我怎么理解，再生成。",
};

export default function OnboardingPage() {
  return (
    <>
      <header className="border-b border-border bg-background">
        <nav className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <span className="flex items-center gap-2 font-semibold">
            <Flame className="size-5 text-primary" aria-hidden />
            <span className="truncate">{PRODUCT_NAME}</span>
          </span>
          <Link
            href="/forge"
            className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            返回工作台
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            原型 · 新用户引导
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            第一次来，只做一件事
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty">
            新人没有资产和历史，所以第一次必须轻：写一句想法，看 ForgeNote
            怎么理解，确认后生成第一条内容。工作台会随你用得越多越满。
          </p>
        </div>

        <OnboardingPrototype />
      </main>
    </>
  );
}
