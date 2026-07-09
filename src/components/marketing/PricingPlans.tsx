"use client";

// ForgeNote M2-16 — 定价卡（laper 定价页骨架收敛为两档 + 月/年切换，打磨版）。
// 诚实边界：产品公测期免费、无计费系统；付费档为「正式定价预告」，两档 CTA 都指注册。
// 价格锚：roadmap Gate 1 对标 Hypefury $35/mo、Taplio $49/mo。

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import {
  MKT_BTN_OUTLINE,
  MKT_BTN_PRIMARY,
  SURFACE_CARD,
  SURFACE_RAISED,
} from "./shared";

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
        className={`mx-auto flex w-fit rounded-full border border-border bg-card p-1 ${SURFACE_RAISED}`}
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
            className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200 ${
              yearly === opt.value
                ? "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-9 grid max-w-3xl gap-4 md:grid-cols-2">
        {/* 公测档 */}
        <article className={`flex flex-col rounded-2xl p-7 ${SURFACE_CARD}`}>
          <h2 className="mkt-serif text-[19px] font-semibold">公测期</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            现在注册即用，全部功能
          </p>
          <p className="mt-5">
            <span className="mkt-serif text-[38px] leading-none font-semibold">
              $0
            </span>
            <span className="ml-1.5 text-[13.5px] text-muted-foreground">/ 月</span>
          </p>
          <ul className="mt-6 flex-1 space-y-2.5">
            {BETA_FEATURES.map((feature) => (
              <li key={feature} className="flex gap-2 text-[13.5px] leading-6">
                <Check className="mt-1 size-3.5 shrink-0 text-primary" aria-hidden />
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
        <article
          className={`relative flex flex-col rounded-2xl p-7 ${SURFACE_CARD}`}
        >
          <span
            className={`absolute -top-3 right-6 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold text-muted-foreground ${SURFACE_RAISED}`}
          >
            正式定价 · 即将启用
          </span>
          <h2 className="mkt-serif text-[19px] font-semibold">Creator</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">公测结束后生效</p>
          <p className="mt-5">
            <span className="mkt-serif text-[38px] leading-none font-semibold">
              ${yearly ? 23 : 29}
            </span>
            <span className="ml-1.5 text-[13.5px] text-muted-foreground">
              / 月{yearly ? " · 按年计费" : ""}
            </span>
          </p>
          <ul className="mt-6 flex-1 space-y-2.5">
            {CREATOR_FEATURES.map((feature) => (
              <li key={feature} className="flex gap-2 text-[13.5px] leading-6">
                <Check className="mt-1 size-3.5 shrink-0 text-primary" aria-hidden />
                {feature}
              </li>
            ))}
          </ul>
          <Link href="/login" className={`${MKT_BTN_OUTLINE} mt-7 w-full`}>
            现在注册，享早鸟价
          </Link>
        </article>
      </div>

      <p className="mx-auto mt-9 max-w-xl text-center text-[12px] leading-6 text-muted-foreground/90">
        以上为正式定价预告，公测期间全部功能免费；正式收费前会提前通知，公测期注册用户享早鸟折扣。
      </p>
    </div>
  );
}
