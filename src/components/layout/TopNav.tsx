import Link from "next/link";
import { Flame } from "lucide-react";

import { PRODUCT_NAME } from "@/lib/constants";

// 顶部导航（UIUX §3.1）。M1 只有 Forge 是实页，其余为占位路由。
const NAV_ITEMS = [
  { label: "Forge", href: "/forge" },
  { label: "配方库", href: "/recipes" },
  { label: "偏好", href: "/profile" },
] as const;

export function TopNav() {
  return (
    <header className="border-b bg-background">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/forge" className="flex items-center gap-2 font-semibold">
          <Flame className="size-5 text-primary" aria-hidden />
          <span>{PRODUCT_NAME}</span>
        </Link>
        <ul className="flex items-center gap-1 text-sm text-muted-foreground">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="rounded-md px-3 py-2 transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
