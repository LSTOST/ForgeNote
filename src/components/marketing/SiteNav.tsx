// ForgeNote M2-16 — 官网导航（laper 骨架：logo | 功能/定价/Blog/Docs | 登录 + 主 CTA）。
// Server Component；移动端菜单用 <details>，零客户端 JS。

import Link from "next/link";
import { Menu } from "lucide-react";

import { BrandMark, Container, MKT_BTN_PRIMARY, SURFACE_RAISED } from "./shared";

const NAV_LINKS = [
  { href: "/#features", label: "功能" },
  { href: "/#loop", label: "怎么运作" },
  { href: "/pricing", label: "定价" },
  { href: "/blog", label: "Blog" },
  { href: "/docs", label: "Docs" },
];

const NAV_LINK_CLASS =
  "rounded-md px-3 py-1.5 text-[13.5px] font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-3">
        <BrandMark />

        <nav aria-label="官网导航" className="hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={NAV_LINK_CLASS}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="hidden rounded-md px-3 py-1.5 text-[13.5px] font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 sm:inline-block"
          >
            登录
          </Link>
          <Link href="/login" className={`${MKT_BTN_PRIMARY} h-9 px-4 text-[13.5px]`}>
            免费开始
          </Link>

          {/* 移动端菜单：details/summary，无 JS */}
          <details className="relative md:hidden">
            <summary
              className={`flex size-9 cursor-pointer list-none items-center justify-center rounded-xl border border-border bg-card text-foreground [&::-webkit-details-marker]:hidden ${SURFACE_RAISED}`}
              aria-label="打开菜单"
            >
              <Menu className="size-[18px]" aria-hidden />
            </summary>
            <nav
              aria-label="移动端导航"
              className="absolute right-0 mt-2 flex w-44 flex-col rounded-2xl border border-border bg-card p-1.5 shadow-[0_1px_2px_rgba(90,60,25,0.06),0_18px_44px_-16px_rgba(90,60,25,0.35),inset_0_1px_0_rgba(255,255,255,0.65)]"
            >
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-[9px] px-3 py-2 text-[14px] font-medium text-foreground hover:bg-accent"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                className="rounded-[9px] px-3 py-2 text-[14px] font-medium text-primary hover:bg-accent sm:hidden"
              >
                登录
              </Link>
            </nav>
          </details>
        </div>
      </Container>
    </header>
  );
}
