// ForgeNote M2-16 — 官网路由组 layout：统一导航/页脚 + 注入官网标题衬线字体。
// 思源宋体只在 (marketing) 树内生效（--font-mkt-serif），不增加产品内页面的字体开销。

import { Noto_Serif_SC } from "next/font/google";

import { SiteNav } from "@/components/marketing/SiteNav";
import { SiteFooter } from "@/components/marketing/SiteFooter";

const mktSerif = Noto_Serif_SC({
  weight: ["500", "600"],
  subsets: ["latin"],
  preload: false,
  display: "swap",
  variable: "--font-mkt-serif",
});

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${mktSerif.variable} flex min-h-screen flex-col bg-background text-foreground`}
    >
      <SiteNav />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
