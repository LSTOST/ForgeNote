// ForgeNote M2-16 — Docs 骨架页（占位，列出将上线的主题，不放空链接）。

import type { Metadata } from "next";

import { SiteNav } from "@/components/marketing/SiteNav";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Container } from "@/components/marketing/shared";

export const metadata: Metadata = {
  title: "Docs — ForgeNote",
  description: "ForgeNote 使用文档：快速上手、账号接入、选题雷达、结构生成。",
};

const UPCOMING_TOPICS = [
  { title: "快速上手", body: "从注册到拿到第一批选题卡，60 秒路径。" },
  { title: "账号接入", body: "该粘贴什么、账号大脑怎么纠偏。" },
  { title: "选题雷达与结构生成", body: "依据从哪来、槽位与稳定性判定怎么用。" },
];

export default function DocsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteNav />
      <main className="flex-1">
        <section className="pt-16 pb-20 sm:pt-20">
          <Container className="max-w-2xl">
            <h1 className="font-serif text-[30px] leading-snug font-medium sm:text-[40px]">
              Docs
            </h1>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              使用文档正在整理，以下主题会陆续上线。
            </p>
            <ul className="mt-8 space-y-3">
              {UPCOMING_TOPICS.map((topic) => (
                <li
                  key={topic.title}
                  className="rounded-[16px] border border-border bg-card p-5"
                >
                  <p className="flex items-center gap-2.5">
                    <span className="text-[15.5px] font-semibold">{topic.title}</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[11.5px] font-medium text-muted-foreground">
                      即将上线
                    </span>
                  </p>
                  <p className="mt-1.5 text-[13.5px] leading-6 text-muted-foreground">
                    {topic.body}
                  </p>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
