"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  FileText,
  Image,
  Layers,
  PenLine,
  Plus,
  Search,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/marketing/shared";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS: Array<
  | { label: string; href: string; icon: LucideIcon }
  | { label: string; mode: "submit"; icon: LucideIcon }
> = [
  { label: "找选题", href: "/radar", icon: Sparkles },
  { label: "内容框架", mode: "submit", icon: Layers },
  { label: "小红书版本", mode: "submit", icon: FileText },
  { label: "X 版本", mode: "submit", icon: PenLine },
  { label: "图片提示词", mode: "submit", icon: Image },
];

const NAV_ITEMS: Array<
  | { label: string; href: string; icon: LucideIcon }
  | { label: string; disabled: true; icon: LucideIcon }
> = [
  { label: "账号分析", href: "/account", icon: UserRound },
  { label: "本周可写选题", href: "/radar", icon: Sparkles },
  { label: "常用写法", disabled: true, icon: Archive },
  { label: "搜索", disabled: true, icon: Search },
];

function NavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-text-secondary transition-colors hover:bg-sidebar-accent/60 hover:text-text-primary"
    >
      <Icon className="size-[18px]" strokeWidth={1.9} aria-hidden />
      {label}
    </Link>
  );
}

export function AppHome({ userEmail = "" }: { userEmail?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [idea, setIdea] = useState("");

  function startWriting(nextIdea = idea) {
    const trimmed = nextIdea.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    router.push(`/workspace?idea=${encodeURIComponent(trimmed)}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startWriting();
  }

  function resetAndFocus() {
    setIdea("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  const initial = (userEmail[0] ?? "F").toUpperCase();

  return (
    <div className="flex min-h-svh w-full bg-sidebar text-text-primary">
      <aside className="hidden h-svh w-[260px] shrink-0 flex-col px-3 py-5 lg:flex">
        <div className="px-2 pb-6">
          <BrandMark size="sm" />
        </div>

        <button
          type="button"
          onClick={resetAndFocus}
          className="mb-1 flex items-center gap-3 rounded-lg bg-sidebar-accent px-3 py-2.5 text-[15px] font-medium text-sidebar-accent-foreground transition-colors hover:bg-sidebar-accent/80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-soft"
        >
          <Plus className="size-[18px]" strokeWidth={1.9} aria-hidden />
          新写一条
        </button>

        <nav className="mt-1 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            if ("disabled" in item) {
              return (
                <button
                  key={item.label}
                  type="button"
                  disabled
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-text-muted"
                >
                  <Icon className="size-[18px]" strokeWidth={1.9} aria-hidden />
                  {item.label}
                </button>
              );
            }
            return (
              <NavLink key={item.label} href={item.href} label={item.label} icon={item.icon} />
            );
          })}
        </nav>

        <div className="mt-8 flex min-h-0 flex-1 flex-col">
          <p className="px-3 pb-2 text-xs font-medium tracking-wide text-text-muted">
            最近内容
          </p>
          <p className="px-3 text-sm leading-5 text-text-muted">后续接最近编辑记录。</p>
        </div>

        <div className="mt-4 flex items-center gap-3 border-t border-sidebar-border px-2 pt-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-text-inverse">
            {initial}
          </span>
          <span
            className="min-w-0 truncate text-sm text-text-secondary"
            title={userEmail}
          >
            {userEmail || "已登录"}
          </span>
        </div>
      </aside>

      <div className="flex min-h-svh min-w-0 flex-1 flex-col bg-bg-app p-3">
        <div className="flex flex-1 flex-col overflow-y-auto rounded-3xl border border-border-subtle/60 bg-bg-card shadow-[var(--shadow-card)]">
          <div className="flex items-center px-4 py-4 lg:hidden">
            <button
              type="button"
              onClick={resetAndFocus}
              className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-card px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-brand-soft"
            >
              <Plus className="size-4" aria-hidden />
              新写一条
            </button>
          </div>

          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
            <h1 className="text-center text-4xl font-semibold tracking-tight text-balance text-text-primary sm:text-[44px]">
              今天想写哪条内容？
            </h1>

            <form onSubmit={handleSubmit} className="mt-10 w-full">
              <div className="rounded-2xl border border-border-subtle bg-bg-card shadow-[var(--shadow-card)]">
                <label htmlFor="app-home-idea" className="sr-only">
                  内容想法输入框
                </label>
                <Textarea
                  ref={inputRef}
                  id="app-home-idea"
                  value={idea}
                  onChange={(event) => setIdea(event.target.value)}
                  rows={4}
                  className="min-h-[120px] resize-none rounded-t-2xl border-0 bg-transparent px-5 pt-5 text-[15px] leading-relaxed shadow-none focus-visible:ring-0"
                  placeholder="描述一个想法、选题，或你卡住的地方"
                />
                <div className="flex items-center justify-between px-3 pb-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={resetAndFocus}
                    title="新写一条"
                    className="rounded-lg"
                  >
                    <Plus className="size-[18px]" aria-hidden />
                  </Button>
                  <Button
                    type="submit"
                    size="icon-lg"
                    disabled={idea.trim().length === 0}
                    className="rounded-full"
                    title="开始生成内容框架"
                  >
                    <PenLine className="size-[18px]" aria-hidden />
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                const chipClass = cn(
                  "inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-card px-4 py-2 text-sm text-text-secondary transition-colors",
                  "hover:border-brand/40 hover:bg-brand-soft hover:text-text-primary",
                );

                if ("href" in action) {
                  return (
                    <Link key={action.label} href={action.href} className={chipClass}>
                      <Icon className="size-4" strokeWidth={1.9} aria-hidden />
                      {action.label}
                    </Link>
                  );
                }

                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => startWriting()}
                    className={chipClass}
                  >
                    <Icon className="size-4" strokeWidth={1.9} aria-hidden />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
