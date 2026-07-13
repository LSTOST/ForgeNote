"use client";

// ForgeNote G0S-12 — 单工作台外壳账号菜单：账号分析 / 退出登录。
// 范围内项 only（依据 DECISIONS + AGENTS 边界）：不含个人偏好、积分、升级或其他越界项。

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, UserRound, type LucideIcon } from "lucide-react";

const MENU_ITEMS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "账号分析", href: "/account", icon: UserRound },
];

export function AccountMenu({
  userEmail = "",
  variant = "sidebar",
}: {
  userEmail?: string;
  /** sidebar：左栏页脚整块触发；compact：紧凑头像触发（备用）。 */
  variant?: "sidebar" | "compact";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initial = (userEmail[0] ?? "F").toUpperCase();
  const name = userEmail.split("@")[0] || "已登录";

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="账号"
        className={
          variant === "sidebar"
            ? "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-brand-soft"
            : "flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-brand-soft"
        }
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-text-inverse">
          {initial}
        </span>
        {variant === "sidebar" && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-text-primary">{name}</span>
            <span className="block truncate text-[11px] text-text-secondary" title={userEmail}>
              {userEmail || "已登录"}
            </span>
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-30 mb-2 w-64 overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-bg-card shadow-[var(--shadow-popover)]"
        >
          <div className="flex items-center gap-2.5 border-b border-border-subtle px-3 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-text-inverse">
              {initial}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-text-primary">{name}</div>
              <div className="truncate text-[12px] text-text-secondary" title={userEmail}>
                {userEmail || "已登录"}
              </div>
            </div>
          </div>

          <div className="py-1.5">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-[13px] text-text-primary transition-colors hover:bg-brand-soft"
                >
                  <Icon className="size-4 text-text-secondary" strokeWidth={1.9} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-border-subtle py-1.5">
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-[13px] text-danger transition-colors hover:bg-danger-soft"
              >
                <LogOut className="size-4" strokeWidth={1.9} aria-hidden />
                退出登录
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
