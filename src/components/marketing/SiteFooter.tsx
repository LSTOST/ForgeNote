// ForgeNote M2-16 — 官网页脚（laper 骨架收敛版：品牌列 + 产品/资源列 + 版权行）。

import Link from "next/link";

import { BrandMark, Container } from "./shared";

const FOOTER_COLS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "产品",
    links: [
      { href: "/#features", label: "功能" },
      { href: "/#loop", label: "怎么运作" },
      { href: "/pricing", label: "定价" },
      { href: "/login", label: "登录" },
    ],
  },
  {
    title: "资源",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/docs", label: "Docs" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/60">
      <Container className="py-12">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-[300px]">
            <BrandMark size="sm" />
            <p className="mt-3 text-[13.5px] leading-6 text-muted-foreground">
              内容结构生成系统。告诉你下一条做什么、为什么会成、发在哪儿——基于你的账号。
            </p>
          </div>
          <div className="flex gap-16">
            {FOOTER_COLS.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <p className="text-[13px] font-semibold text-foreground">{col.title}</p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <p className="mt-10 border-t border-border pt-6 text-[12.5px] text-muted-foreground">
          © 2026 ForgeNote · 把账号分析，变成下一条内容的判断依据
        </p>
      </Container>
    </footer>
  );
}
