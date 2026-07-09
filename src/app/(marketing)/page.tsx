// ForgeNote M2-16 — 官网首页（laper 骨架 + v3.17 暖纸白 + 质感/密度/动效打磨版）。
// 打磨原则（源码对照 laper 得出）：字号克制、表面有内高光层次、演示区是真界面密度、
// 动效全部尊重 reduced-motion。导航/页脚在 (marketing)/layout.tsx。

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Brain, Layers, Radar } from "lucide-react";

import { WorkspacePreview } from "@/components/marketing/WorkspacePreview";
import { Reveal } from "@/components/marketing/Reveal";
import {
  Container,
  MKT_BTN_OUTLINE,
  MKT_BTN_PRIMARY,
  SURFACE_CARD,
  SURFACE_CARD_HOVER,
  SURFACE_RAISED,
} from "@/components/marketing/shared";

export const metadata: Metadata = {
  title: "ForgeNote — 内容结构生成系统",
  description:
    "不是 AI 帮你写内容。ForgeNote 基于你的账号告诉你：下一条做什么、为什么会成、发在哪儿。",
};

const FEATURES = [
  {
    no: "01",
    icon: Brain,
    title: "账号大脑",
    body: "粘贴你的主页和近期帖子，得到 AI 对你账号的判断——可查看、可纠偏，不编造它不知道的事。",
  },
  {
    no: "02",
    icon: Radar,
    title: "选题雷达",
    body: "每周一批选题卡，每张都写明依据：为什么是你做、为什么是现在。没有伪热度，没有通用建议。",
  },
  {
    no: "03",
    icon: Layers,
    title: "结构生成",
    body: "选题展开成结构而不是一坨字：槽位可改、策略可换，稳定性判定过关，再渲染成小红书、X thread、图片 prompt。",
  },
];

const LOOP_STEPS = [
  { no: "01", title: "账号接入", body: "粘贴 profile 和近期帖子表现，一次就好。" },
  { no: "02", title: "账号大脑", body: "AI 对你账号的判断，可看、可纠偏。" },
  { no: "03", title: "选题推荐", body: "每周一批选题卡，每张带依据。" },
  { no: "04", title: "展开成稿", body: "结构生成 → 多平台渲染 → 复制导出。" },
  { no: "05", title: "表现回填", body: "发完把数据带回来，按平台归因。" },
  { no: "06", title: "学习可见", body: "账号大脑更新，下周的推荐更懂你。" },
];

/** 区块小标：橙色序号 + 分隔线 + 静音标签（laper 式克制导语）。 */
function Kicker({ no, label }: { no: string; label: string }) {
  return (
    <p className="flex items-center gap-2.5 text-[12.5px] font-medium tracking-[0.12em] text-muted-foreground">
      <span className="mkt-serif text-[13px] font-semibold tracking-normal text-primary">
        {no}
      </span>
      <span aria-hidden className="h-px w-6 bg-border" />
      {label}
    </p>
  );
}

export default function HomePage() {
  return (
    <>
      {/* Hero —— 纸面舞台：横向纸纹 + 中央暖光洗白 + 左右融边，入场 stagger */}
      <section className="relative overflow-hidden pt-16 pb-16 sm:pt-24 sm:pb-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(180deg,transparent_0,transparent_31px,rgba(90,60,25,0.055)_31px,rgba(90,60,25,0.055)_32px)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_62%_55%_at_50%_40%,#F4F1E9_35%,rgba(244,241,233,0)_78%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--background)_0%,transparent_20%,transparent_80%,var(--background)_100%)]"
        />
        <Container className="relative z-10 flex flex-col items-center text-center">
          <p
            className={`mkt-rise rounded-full border border-border bg-card px-3.5 py-1 text-[12.5px] font-medium tracking-[0.04em] text-muted-foreground ${SURFACE_RAISED}`}
          >
            内容结构生成系统
          </p>
          <h1
            className="mkt-rise mkt-serif mt-7 max-w-2xl text-[28px] leading-[1.4] font-semibold tracking-[0.01em] sm:text-[40px] sm:leading-[1.35]"
            style={{ animationDelay: "90ms" }}
          >
            打开 60 秒，它对你账号的判断，
            <br className="hidden sm:block" />
            比空白 ChatGPT{" "}
            <span className="relative inline-block whitespace-nowrap">
              深一个量级
              <svg
                aria-hidden
                className="absolute -bottom-1 left-0 h-[9px] w-full sm:-bottom-1.5"
                viewBox="0 0 300 12"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M5 8.5C58 4.5 116 10 168 6.5 210 3.9 262 5.5 295 7.5"
                  stroke="var(--primary)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  pathLength={320}
                  className="mkt-draw"
                />
              </svg>
            </span>
          </h1>
          <p
            className="mkt-rise mt-6 max-w-xl text-[15px] leading-7 text-muted-foreground sm:text-[16px] sm:leading-8"
            style={{ animationDelay: "180ms" }}
          >
            不是「AI 帮你写内容」。ForgeNote 基于你的账号告诉你：下一条做什么、为什么会成、发在哪儿——不是给所有人的通用建议。
          </p>
          <div
            className="mkt-rise mt-9 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "270ms" }}
          >
            <Link href="/login" className={MKT_BTN_PRIMARY}>
              免费开始
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/#loop" className={MKT_BTN_OUTLINE}>
              看看怎么运作
            </Link>
          </div>
          <p
            className="mkt-rise mt-5 text-[12.5px] text-muted-foreground/80"
            style={{ animationDelay: "360ms" }}
          >
            公测期免费 · 注册即用，无需信用卡
          </p>
        </Container>
      </section>

      {/* 三功能卡 */}
      <section id="features" className="scroll-mt-20 pb-20 sm:pb-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <Reveal key={feature.no} delay={i * 90}>
                <article
                  className={`mkt-lift h-full rounded-2xl p-6 ${SURFACE_CARD} ${SURFACE_CARD_HOVER}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-b from-primary/14 to-primary/7 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
                      <feature.icon className="size-5" aria-hidden strokeWidth={1.8} />
                    </span>
                    <span className="mkt-serif text-[13px] font-semibold text-border">
                      {feature.no}
                    </span>
                  </div>
                  <h2 className="mt-5 text-[16px] font-semibold">{feature.title}</h2>
                  <p className="mt-2 text-[13.5px] leading-[1.75] text-muted-foreground">
                    {feature.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* 产品展示 —— 缩微真界面 */}
      <section className="pb-20 sm:pb-28">
        <Container>
          <Reveal>
            <div className="mb-10 max-w-2xl">
              <Kicker no="Ⅰ" label="从选题到发布" />
              <h2 className="mkt-serif mt-4 text-[24px] leading-normal font-semibold sm:text-[30px]">
                从「该发什么」到「可以发布」，一条流水线
              </h2>
              <p className="mt-3 text-[14.5px] leading-7 text-muted-foreground">
                选题卡自带依据，展开成可编辑的结构，稳定了才渲染。差异化不在「写得快」，在每张牌背后那行「为什么」。
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <WorkspacePreview />
          </Reveal>
        </Container>
      </section>

      {/* 学习闭环 */}
      <section id="loop" className="scroll-mt-20 pb-20 sm:pb-28">
        <Container>
          <Reveal>
            <div className="mb-10 max-w-2xl">
              <Kicker no="Ⅱ" label="学习闭环" />
              <h2 className="mkt-serif mt-4 text-[24px] leading-normal font-semibold sm:text-[30px]">
                用得越久，判断越准
              </h2>
              <p className="mt-3 text-[14.5px] leading-7 text-muted-foreground">
                发完带数据回来，账号大脑持续更新。多平台的表现沉在同一个大脑里——这是模板和裸聊给不了的。
              </p>
            </div>
          </Reveal>
          <ol className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {LOOP_STEPS.map((item, i) => (
              <Reveal key={item.no} delay={(i % 3) * 90}>
                <li
                  className={`mkt-lift h-full list-none rounded-2xl p-5 ${SURFACE_CARD} ${SURFACE_CARD_HOVER}`}
                >
                  <p className="flex items-baseline gap-2.5">
                    <span className="mkt-serif text-[15px] font-semibold text-primary">
                      {item.no}
                    </span>
                    <span className="text-[15px] font-semibold">{item.title}</span>
                  </p>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                    {item.body}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      {/* 收口 CTA —— 暖墨面板 + 底部橙色余晖 */}
      <section className="pb-20 sm:pb-28">
        <Container>
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl bg-foreground px-6 py-14 text-center text-background ring-1 ring-white/10 ring-inset sm:px-12 sm:py-18">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_65%_at_50%_100%,rgba(232,99,31,0.22),transparent_70%)]"
              />
              <div className="relative">
                <h2 className="mkt-serif mx-auto max-w-xl text-[24px] leading-normal font-semibold sm:text-[32px]">
                  下一条内容，别再从空白开始
                </h2>
                <p className="mx-auto mt-3 max-w-md text-[14px] leading-7 opacity-65">
                  接入账号，领这周的选题卡。判断得准不准，60 秒内你自己看。
                </p>
                <Link
                  href="/login"
                  className={`${MKT_BTN_PRIMARY} mt-8 shadow-[0_4px_24px_rgba(232,99,31,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]`}
                >
                  免费开始
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
