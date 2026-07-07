// ForgeNote M2-16 — Docs 骨架页（占位，列出将上线的主题，不放空链接）。导航/页脚在 (marketing)/layout。

import type { Metadata } from "next";

import { Container, SURFACE_CARD } from "@/components/marketing/shared";

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
    <section className="pt-16 pb-20 sm:pt-20 sm:pb-28">
      <Container className="max-w-2xl">
        <h1 className="mkt-rise mkt-serif text-[26px] leading-normal font-semibold sm:text-[34px]">
          Docs
        </h1>
        <p
          className="mkt-rise mt-3 text-[14.5px] leading-7 text-muted-foreground"
          style={{ animationDelay: "90ms" }}
        >
          使用文档正在整理，以下主题会陆续上线。
        </p>
        <ul
          className="mkt-rise mt-8 space-y-3"
          style={{ animationDelay: "180ms" }}
        >
          {UPCOMING_TOPICS.map((topic) => (
            <li key={topic.title} className={`rounded-2xl p-5 ${SURFACE_CARD}`}>
              <p className="flex items-center gap-2.5">
                <span className="text-[15px] font-semibold">{topic.title}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  即将上线
                </span>
              </p>
              <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">
                {topic.body}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
