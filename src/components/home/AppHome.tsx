"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  FileText,
  Home,
  Image,
  Layers,
  PenLine,
  Plus,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const QUICK_ACTIONS = [
  { label: "找选题", href: "/radar", icon: Sparkles },
  { label: "内容框架", mode: "submit", icon: Layers },
  { label: "小红书版本", mode: "submit", icon: FileText },
  { label: "X 版本", mode: "submit", icon: PenLine },
  { label: "图片提示词", mode: "submit", icon: Image },
] as const;

const NAV_ITEMS = [
  { label: "账号分析", href: "/account", icon: UserRound },
  { label: "本周可写选题", href: "/radar", icon: Sparkles },
  { label: "常用写法", disabled: true, icon: Archive },
  { label: "搜索", disabled: true, icon: Search },
] as const;

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

  return (
    <div className="flex min-h-dvh bg-[#f7f6f3] text-text-primary">
      <aside className="hidden w-[268px] shrink-0 flex-col border-r border-black/[0.04] bg-[#f1f0ee] px-3 py-4 md:flex">
        <Link
          href="/"
          className="mb-6 flex items-center gap-2 rounded-[10px] px-2 py-1.5 text-[18px] font-semibold tracking-normal text-text-primary"
        >
          <span className="flex size-7 items-center justify-center rounded-[9px] bg-text-primary text-text-inverse">
            <Home className="size-4" aria-hidden />
          </span>
          ForgeNote
        </Link>

        <button
          type="button"
          onClick={resetAndFocus}
          className="mb-3 flex h-11 w-full items-center gap-3 rounded-[10px] bg-black/[0.04] px-3 text-[15px] font-medium text-text-primary transition-colors hover:bg-black/[0.07] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-soft"
        >
          <Plus className="size-5" aria-hidden />
          新写一条
        </button>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            if (!("href" in item)) {
              return (
                <button
                  key={item.label}
                  type="button"
                  disabled
                  className="flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-[15px] font-medium text-text-muted"
                >
                  <Icon className="size-5" aria-hidden />
                  {item.label}
                </button>
              );
            }
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex h-10 items-center gap-3 rounded-[10px] px-3 text-[15px] font-medium text-text-secondary transition-colors hover:bg-black/[0.04] hover:text-text-primary"
              >
                <Icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-10 px-3 text-[13px] font-medium text-text-muted">最近内容</div>
        <div className="mt-3 rounded-[10px] px-3 py-3 text-[13px] leading-5 text-text-muted">
          后续接最近编辑记录。
        </div>

        <div className="mt-auto flex items-center gap-2 border-t border-black/[0.05] px-2 pt-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-text-primary text-[12px] font-semibold text-text-inverse">
            {(userEmail[0] ?? "F").toUpperCase()}
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-text-secondary" title={userEmail}>
            {userEmail || "已登录"}
          </span>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 p-3 md:p-5">
        <section className="relative flex min-h-[calc(100dvh-24px)] w-full flex-col overflow-hidden rounded-[24px] border border-black/[0.04] bg-bg-elevated md:min-h-[calc(100dvh-40px)]">
          <div className="flex items-center px-4 py-4 md:px-7">
            <button
              type="button"
              onClick={resetAndFocus}
              className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-card px-3 py-2 text-sm font-medium text-text-primary shadow-[0_1px_2px_rgba(42,36,29,0.03)] transition-colors hover:bg-brand-soft md:hidden"
            >
              <Plus className="size-4" aria-hidden />
              新写一条
            </button>
          </div>

          <div className="mx-auto flex w-full max-w-[980px] flex-1 flex-col items-center justify-center px-5 pb-[14vh] pt-8">
            <h1 className="text-center text-[34px] leading-tight font-semibold tracking-normal text-text-primary sm:text-[44px]">
              今天想写哪条内容？
            </h1>

            <form onSubmit={handleSubmit} className="mt-10 w-full max-w-[760px]">
              <div className="rounded-[26px] border border-border-subtle bg-bg-elevated p-3 shadow-[0_18px_50px_rgba(42,36,29,0.08),0_1px_2px_rgba(42,36,29,0.05)]">
                <Textarea
                  ref={inputRef}
                  value={idea}
                  onChange={(event) => setIdea(event.target.value)}
                  rows={3}
                  className="min-h-[112px] resize-none border-0 bg-transparent px-3 py-2 text-[16px] leading-7 shadow-none focus-visible:ring-0"
                  placeholder="描述一个想法、选题，或你卡住的地方"
                />
                <div className="flex items-center gap-2 px-1 pt-2">
                  <Button type="button" variant="secondary" size="icon-sm" onClick={resetAndFocus} title="新写一条">
                    <Plus className="size-4" aria-hidden />
                  </Button>
                  <Button
                    type="submit"
                    size="icon-lg"
                    disabled={idea.trim().length === 0}
                    className="ml-auto rounded-full"
                    title="开始生成内容框架"
                  >
                    <PenLine className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-6 flex max-w-[760px] flex-wrap items-center justify-center gap-2">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                if ("href" in action) {
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-border-subtle bg-bg-card px-4 text-[14px] font-medium text-text-secondary transition-colors hover:bg-brand-soft hover:text-text-primary"
                    >
                      <Icon className="size-4" aria-hidden />
                      {action.label}
                    </Link>
                  );
                }
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => startWriting()}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-border-subtle bg-bg-card px-4 text-[14px] font-medium text-text-secondary transition-colors hover:bg-brand-soft hover:text-text-primary"
                  >
                    <Icon className="size-4" aria-hidden />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
