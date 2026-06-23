import Link from "next/link";
import { Flame } from "lucide-react";

import { AssumptionPrototype } from "@/components/prototype/AssumptionPrototype";
import { PRODUCT_NAME } from "@/lib/constants";

// 「假设条」重做的高保真 UI 原型（独立路由，不依赖鉴权 / 不改 forge 主链路）。
export const metadata = {
  title: "假设条重做原型 · ForgeNote",
  description: "把假设前移到生成前：先确认「我对这次内容的理解」，再生成内容包。",
};

export default function PrototypePage() {
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
            原型 · 假设前移
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            先确认理解，再生成内容
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty">
            把假设从结果里前移到生成前：输入想法后，先让 ForgeNote
            说说它对这次内容的理解，你确认或纠偏，再开始生成。
          </p>
        </div>

        <AssumptionPrototype />
      </main>
    </>
  );
}
