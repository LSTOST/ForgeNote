// ForgeNote M2-16 — Blog 骨架页（占位，不伪造文章列表）。

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, PenLine } from "lucide-react";

import { SiteNav } from "@/components/marketing/SiteNav";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Container, MKT_BTN_PRIMARY } from "@/components/marketing/shared";

export const metadata: Metadata = {
  title: "Blog — ForgeNote",
  description: "ForgeNote 创作手记：内容框架怎么形成、账号分析如何学习。",
};

export default function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteNav />
      <main className="flex-1">
        <section className="pt-16 pb-20 sm:pt-20">
          <Container className="max-w-2xl">
            <h1 className="font-serif text-[30px] leading-snug font-medium sm:text-[40px]">
              Blog
            </h1>
            <div className="mt-8 rounded-[18px] border border-border bg-card p-8 text-center">
              <span className="mx-auto flex size-11 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
                <PenLine className="size-5" aria-hidden />
              </span>
              <p className="mt-4 font-serif text-[19px] font-semibold">创作手记正在路上</p>
              <p className="mx-auto mt-2 max-w-md text-[14px] leading-7 text-muted-foreground">
                我们会在这里写：内容框架怎么形成、账号分析如何学习、以及真实创作者的选题复盘。
              </p>
              <Link href="/login" className={`${MKT_BTN_PRIMARY} mt-6`}>
                先去用产品
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </Container>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
