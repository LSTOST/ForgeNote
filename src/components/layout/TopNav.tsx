import Link from "next/link";
import { Flame, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import { PRODUCT_NAME } from "@/lib/constants";
import { getCurrentUser } from "@/lib/supabase/server";

// 顶部导航（UIUX §3.1）。文案经 I-17 copy 资源（默认 zh-Hans，行为不变）。
const NAV_ITEMS = [
  { label: copy.nav.profile, href: "/profile" },
] as const;

// Server Component：渲染当前用户 email + 退出入口（Batch B）。getCurrentUser 经 React cache
// 与受保护页面共享同一次查询，未登录时返回 null（此时通常已在页面层被重定向到 /login）。
export async function TopNav() {
  const user = await getCurrentUser();

  return (
    <header className="border-b bg-background">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/workspace" className="flex items-center gap-2 font-semibold">
          <Flame className="size-5 text-primary" aria-hidden />
          <span>{PRODUCT_NAME}</span>
        </Link>

        <div className="flex items-center gap-2">
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

          {user && (
            <div className="flex items-center gap-2 border-l pl-2">
              {user.email && (
                <span
                  className="hidden max-w-[12rem] truncate text-sm text-muted-foreground sm:inline"
                  title={user.email}
                >
                  {user.email}
                </span>
              )}
              {/* 原生表单 POST 到 /auth/signout：无需客户端 JS，清 cookie 后回 /login。 */}
              <form action="/auth/signout" method="post">
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  title={copy.nav.signOutTitle}
                >
                  <LogOut className="size-4" aria-hidden />
                  {copy.nav.signOut}
                </Button>
              </form>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
