// ForgeNote M2-16 — 官网共享件（品牌标 + 按钮样式常量 + 容器）。
// 骨架借 laper.ai（导航/Hero/功能卡/产品展示/页脚），皮走 v3.17 暖纸白语义令牌。
// 品牌标沿用登录页验收样式：Zap 橙方块 + 衬线字标。

import Link from "next/link";
import { Zap } from "lucide-react";

/** 官网主 CTA（大号，语义令牌 primary = v3.17 动作橙）。 */
export const MKT_BTN_PRIMARY =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[13px] bg-primary px-6 text-[15px] font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-colors hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40";

/** 官网次 CTA（描边）。 */
export const MKT_BTN_OUTLINE =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[13px] border border-border bg-card px-6 text-[15px] font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40";

/** 内容容器：与 laper 一致的居中窄版。 */
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

/** 品牌标：橙方块 Zap + 衬线 ForgeNote（登录页同款视觉）。 */
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
        className={`flex items-center justify-center bg-primary text-primary-foreground shadow-[var(--shadow-card)] ${box}`}
      >
        <Zap className={icon} aria-hidden strokeWidth={2.2} />
      </span>
      <span className={`font-serif font-semibold text-foreground ${word}`}>
        ForgeNote
      </span>
    </Link>
  );
}
