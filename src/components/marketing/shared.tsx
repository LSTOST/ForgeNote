// ForgeNote M2-16 — 官网共享件：表面质感体系 + 按钮 + 容器 + 品牌标。
// 表面体系（对齐 laper 的做法，色温换成暖棕）：环境影 + 1px 白色内嵌高光模拟实体表面，
// 三档强度 raised（按钮/胶囊）/ card（卡片）/ window（产品演示窗口）。
// 圆角两档：rounded-xl（小件）/ rounded-2xl（卡片与窗口），胶囊用 full。

import Link from "next/link";
import { Zap } from "lucide-react";

/** 一档：小件（按钮/胶囊/输入）——微环境影 + 顶部内高光。 */
export const SURFACE_RAISED =
  "shadow-[0_1px_2px_rgba(90,60,25,0.08),inset_0_1px_0_rgba(255,255,255,0.7)]";

/** 二档：卡片——发丝边 + 近影 + 远柔影 + 内高光。 */
export const SURFACE_CARD =
  "border border-border bg-card shadow-[0_1px_2px_rgba(90,60,25,0.05),0_16px_40px_-20px_rgba(90,60,25,0.25),inset_0_1px_0_rgba(255,255,255,0.65)]";

/** 三档：产品演示窗口——发丝 ring + 深柔投影（laper 的 0_25px_50px 同款思路）。 */
export const SURFACE_WINDOW =
  "shadow-[0_0_0_1px_var(--border),0_30px_60px_-18px_rgba(90,60,25,0.3),0_1px_2px_rgba(90,60,25,0.06)]";

/** hover 抬升卡片的加深阴影（配 .mkt-lift 使用）。 */
export const SURFACE_CARD_HOVER =
  "hover:shadow-[0_1px_2px_rgba(90,60,25,0.05),0_24px_48px_-20px_rgba(90,60,25,0.32),inset_0_1px_0_rgba(255,255,255,0.65)]";

/** 官网主 CTA：动作橙 + 内高光 + 光泽扫过 + 轻抬升。 */
export const MKT_BTN_PRIMARY =
  "mkt-shine inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-[15px] font-semibold text-primary-foreground shadow-[0_1px_2px_rgba(90,60,25,0.2),0_8px_20px_-8px_rgba(232,99,31,0.55),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all duration-300 hover:-translate-y-px hover:bg-primary/90 hover:shadow-[0_2px_4px_rgba(90,60,25,0.2),0_12px_28px_-8px_rgba(232,99,31,0.6),inset_0_1px_0_rgba(255,255,255,0.25)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40";

/** 官网次 CTA：暖白实体面。 */
export const MKT_BTN_OUTLINE = `inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 text-[15px] font-medium text-foreground transition-all duration-300 hover:-translate-y-px hover:bg-[#FFFEFB] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 ${SURFACE_RAISED}`;

/** 内容容器。 */
export function Container({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}

/** 品牌标：橙方块 Zap + 衬线 ForgeNote（登录页同款视觉 + 内高光）。 */
export function BrandMark({ size = "md" }: { size?: "md" | "sm" }) {
  const box = size === "md" ? "size-[34px] rounded-[10px]" : "size-[28px] rounded-[9px]";
  const icon = size === "md" ? "size-[17px]" : "size-[15px]";
  const word = size === "md" ? "text-[19px]" : "text-[17px]";
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      <span
        className={`flex items-center justify-center bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(150,70,30,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] ${box}`}
      >
        <Zap className={icon} aria-hidden strokeWidth={2.2} />
      </span>
      <span className={`mkt-serif font-semibold text-foreground ${word}`}>
        ForgeNote
      </span>
    </Link>
  );
}
