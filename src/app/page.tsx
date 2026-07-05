// ForgeNote M2-16 — 官网首页（根路由）。骨架借 laper.ai：
// 导航 → Hero（宣言 + 双 CTA）→ 三功能卡 → 产品展示 → 学习闭环 → 收口 CTA → 页脚。
// 皮走 v3.17 暖纸白语义令牌；文案取 v3 定位（roadmap.json direction/finalForm），不写未实现能力。
// 旧行为 redirect("/forge") 由本页替换；登录入口统一 /login。

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Brain, Layers, Radar } from "lucide-react";

import { SiteNav } from "@/components/marketing/SiteNav";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { WorkspacePreview } from "@/components/marketing/WorkspacePreview";
import {
  Container,
  MKT_BTN_OUTLINE,
  MKT_BTN_PRIMARY,
} from "@/components/marketing/shared";

export const metadata: Metadata = {
  title: "ForgeNote — 内容结构生成系统",
  description:
    "不是 AI 帮你写内容。ForgeNote 基于你的账号告诉你：下一条做什么、为什么会成、发在哪儿。",
};

const FEATURES = [
  {
    icon: Brain,
    title: "账号大脑",
    body: "粘贴你的主页和近期帖子，得到 AI 对你账号的判断——可查看、可纠偏，不编造它不知道的事。",
  },
  {
    icon: Radar,
    title: "选题雷达",
    body: "每周一批选题卡，每张都写明依据：为什么是你做、为什么是现在。没有伪热度，没有通用建议。",
  },
  {
    icon: Layers,
    title: "结构生成",
    body: "选题展开成结构而不是一坨字：槽位可改、策略可换，稳定性判定过关，再渲染成小红书、X thread、图片 prompt。",
  },
];

const LOOP_STEPS = [
  { step: "①", title: "账号接入", body: "粘贴 profile 和近期帖子表现，一次就好。" },
  { step: "②", title: "账号大脑", body: "AI 对你账号的判断，可看、可纠偏。" },
  { step: "③", title: "选题推荐", body: "每周一批选题卡，每张带依据。" },
  { step: "④", title: "展开成稿", body: "结构生成 → 多平台渲染 → 复制导出。" },
  { step: "⑤", title: "表现回填", body: "发完把数据带回来，按平台归因。" },
  { step: "⑥", title: "学习可见", body: "账号大脑更新，下周的推荐更懂你。" },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="pt-16 pb-14 sm:pt-24 sm:pb-20">
          <Container className="flex flex-col items-center text-center">
            <p className="rounded-full border border-border bg-card px-3.5 py-1 text-[13px] font-medium text-muted-foreground">
              内容结构生成系统
            </p>
            <h1 className="mt-6 max-w-3xl font-serif text-[34px] leading-[1.22] font-medium sm:text-[52px] sm:leading-[1.18]">
              打开 60 秒，它对你账号的判断，
              <br className="hidden sm:block" />
              比空白 ChatGPT 深一个量级
            </h1>
            <p className="mt-5 max-w-xl text-[15.5px] leading-7 text-muted-foreground sm:text-[17px] sm:leading-8">
              不是「AI 帮你写内容」。ForgeNote 基于你的账号告诉你：下一条做什么、为什么会成、发在哪儿——不是给所有人的通用建议。
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/login" className={MKT_BTN_PRIMARY}>
                免费开始
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/#loop" className={MKT_BTN_OUTLINE}>
                看看怎么运作
              </Link>
            </div>
            <p className="mt-4 text-[12.5px] text-muted-foreground">
              公测期免费 · 注册即用，无需信用卡
            </p>
          </Container>
        </section>

        {/* 三功能卡 */}
        <section id="features" className="scroll-mt-20 pb-16 sm:pb-20">
          <Container>
            <div className="grid gap-4 md:grid-cols-3">
              {FEATURES.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-[18px] border border-border bg-card p-6 shadow-[0_10px_30px_-22px_rgba(80,50,20,0.4)]"
                >
                  <span className="flex size-10 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
                    <feature.icon className="size-5" aria-hidden />
                  </span>
                  <h2 className="mt-4 font-serif text-[19px] font-semibold">
                    {feature.title}
                  </h2>
                  <p className="mt-2 text-[14px] leading-6.5 text-muted-foreground">
                    {feature.body}
                  </p>
                </article>
              ))}
            </div>
          </Container>
        </section>

        {/* 产品展示 */}
        <section className="pb-16 sm:pb-24">
          <Container>
            <div className="mb-8 max-w-2xl">
              <h2 className="font-serif text-[26px] leading-snug font-medium sm:text-[32px]">
                从「该发什么」到「可以发布」，一条流水线
              </h2>
              <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
                选题卡自带依据，展开成可编辑的结构，稳定了才渲染。差异化不在「写得快」，在每张牌背后那行「为什么」。
              </p>
            </div>
            <WorkspacePreview />
          </Container>
        </section>

        {/* 学习闭环 */}
        <section id="loop" className="scroll-mt-20 pb-16 sm:pb-24">
          <Container>
            <div className="mb-8 max-w-2xl">
              <h2 className="font-serif text-[26px] leading-snug font-medium sm:text-[32px]">
                用得越久，判断越准
              </h2>
              <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
                发完带数据回来，账号大脑持续更新。多平台的表现沉在同一个大脑里——这是模板和裸聊给不了的。
              </p>
            </div>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {LOOP_STEPS.map((item) => (
                <li
                  key={item.title}
                  className="rounded-[16px] border border-border bg-card p-5"
                >
                  <p className="flex items-baseline gap-2">
                    <span className="font-serif text-[17px] text-primary">
                      {item.step}
                    </span>
                    <span className="text-[15.5px] font-semibold">{item.title}</span>
                  </p>
                  <p className="mt-1.5 text-[13.5px] leading-6 text-muted-foreground">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
          </Container>
        </section>

        {/* 收口 CTA */}
        <section className="pb-20 sm:pb-24">
          <Container>
            <div className="rounded-[24px] bg-foreground px-6 py-12 text-center text-background sm:px-12 sm:py-16">
              <h2 className="mx-auto max-w-xl font-serif text-[26px] leading-snug font-medium sm:text-[34px]">
                下一条内容，别再从空白开始
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-7 opacity-70">
                接入账号，领这周的选题卡。判断得准不准，60 秒内你自己看。
              </p>
              <Link
                href="/login"
                className={`${MKT_BTN_PRIMARY} mt-7 shadow-[0_4px_20px_rgba(232,99,31,0.4)]`}
              >
                免费开始
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
