// ForgeNote M2-16 — Blog 骨架页（占位，不伪造文章列表）。导航/页脚在 (marketing)/layout。

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, PenLine } from "lucide-react";

import {
  Container,
  MKT_BTN_PRIMARY,
  SURFACE_CARD,
} from "@/components/marketing/shared";

export const metadata: Metadata = {
  title: "Blog — ForgeNote",
  description: "ForgeNote 创作手记：结构生成系统怎么想、账号大脑如何学习。",
};

export default function BlogPage() {
  return (
    <section className="pt-16 pb-20 sm:pt-20 sm:pb-28">
      <Container className="max-w-2xl">
        <h1 className="mkt-rise mkt-serif text-[26px] leading-normal font-semibold sm:text-[34px]">
          Blog
        </h1>
        <div
          className={`mkt-rise mt-8 rounded-2xl p-8 text-center ${SURFACE_CARD}`}
          style={{ animationDelay: "90ms" }}
        >
          <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-gradient-to-b from-primary/14 to-primary/7 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
            <PenLine className="size-5" aria-hidden strokeWidth={1.8} />
          </span>
          <p className="mkt-serif mt-4 text-[18px] font-semibold">
            创作手记正在路上
          </p>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-7 text-muted-foreground">
            我们会在这里写：结构生成系统是怎么想的、账号大脑如何学习、以及真实创作者的选题复盘。
          </p>
          <Link href="/login" className={`${MKT_BTN_PRIMARY} mt-6`}>
            先去用产品
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </Container>
    </section>
  );
}
