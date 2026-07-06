"use client";

// ForgeNote M2-16 — 定价卡（laper 定价页骨架收敛为两档 + 月/年切换）。
// 诚实边界：产品公测期免费、无计费系统；付费档为「正式定价预告」，两档 CTA 都指注册。
// 价格锚：roadmap Gate 1 对标 Hypefury $35/mo、Taplio $49/mo。

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { MKT_BTN_OUTLINE, MKT_BTN_PRIMARY } from "./shared";

const BETA_FEATURES = [
  "账号大脑：接入 + 判断 + 纠偏",
  "每周选题卡，每张带依据",
  "结构生成 + 稳定性判定",
  "渲染：小红书 / X thread / 图片 prompt",
];

const CREATOR_FEATURES = [
  "公测期全部功能",
  "表现回填 → 账号大脑持续学习",
  "结构配方保存与复用",
  "多平台账号记忆在同一个大脑",
];

export function PricingPlans() {
  const [yearly, setYearly] = useState(false);

  return (
    <div>
      {/* 月/年切换 */}
      <div
        role="group"
        aria-label="计费周期"
        className="mx-auto flex w-fit rounded-full border border-border bg-card p-1"
      >
        {[
          { label: "按月", value: false },
          { label: "按年（省 20%）", value: true },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            aria-pressed={yearly === opt.value}
            onClick={() => setYearly(opt.value)}
            className={`rounded-full px-4 py-1.5 text-[13.5px] font-medium transition-colors ${
              yearly === opt.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl gap-4 md:grid-cols-2">
        {/* 公测档 */}
        <article className="flex flex-col rounded-[20px] border border-border bg-card p-7">
          <h2 className="font-serif text-[20px] font-semibold">公测期</h2>
          <p className="mt-1 text-[13.5px] text-muted-foreground">现在注册即用，全部功能</p>
          <p className="mt-5">
            <span className="font-serif text-[40px] leading-none font-medium">$0</span>
            <span className="ml-1.5 text-[14px] text-muted-foreground">/ 月</span>
          </p>
          <ul className="mt-6 flex-1 space-y-2.5">
            {BETA_FEATURES.map((feature) => (
              <li key={feature} className="flex gap-2 text-[14px] leading-6">
                <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
                {feature}
              </li>
            ))}
          </ul>
          <Link href="/login" className={`${MKT_BTN_PRIMARY} mt-7 w-full`}>
            免费开始
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </article>

        {/* 正式定价预告 */}
        <article className="relative flex flex-col rounded-[20px] border border-border bg-card p-7">
          <span className="absolute -top-3 right-6 rounded-full bg-secondary px-3 py-1 text-[11.5px] font-semibold text-muted-foreground">
            正式定价 · 即将启用
          </span>
          <h2 className="font-serif text-[20px] font-semibold">Creator</h2>
          <p className="mt-1 text-[13.5px] text-muted-foreground">公测结束后生效</p>
          <p className="mt-5">
            <span className="font-serif text-[40px] leading-none font-medium">
              ${yearly ? 23 : 29}
            </span>
            <span className="ml-1.5 text-[14px] text-muted-foreground">
              / 月{yearly ? " · 按年计费" : ""}
            </span>
          </p>
          <ul className="mt-6 flex-1 space-y-2.5">
            {CREATOR_FEATURES.map((feature) => (
              <li key={feature} className="flex gap-2 text-[14px] leading-6">
                <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
                {feature}
              </li>
            ))}
          </ul>
          <Link href="/login" className={`${MKT_BTN_OUTLINE} mt-7 w-full`}>
            现在注册，享早鸟价
          </Link>
        </article>
      </div>

      <p className="mx-auto mt-8 max-w-xl text-center text-[12.5px] leading-6 text-muted-foreground">
        以上为正式定价预告，公测期间全部功能免费；正式收费前会提前通知，公测期注册用户享早鸟折扣。
      </p>
    </div>
  );
}
