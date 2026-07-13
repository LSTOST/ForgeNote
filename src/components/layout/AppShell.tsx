"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, Home, PanelLeft, Plus, Search, UserRound } from "lucide-react";
import { useState } from "react";

import { AccountMenu } from "@/components/account/AccountMenu";
import { Button } from "@/components/ui/button";

export interface ShellTask {
  id: string;
  title: string | null;
  intentPreview: string;
  updatedAt: string;
}

export function AppShell({ children, userEmail, recentTasks }: { children: React.ReactNode; userEmail: string; recentTasks: ShellTask[] }) {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  function newContent() {
    if (pathname === "/workspace") {
      window.dispatchEvent(new CustomEvent("forgenote:new-content"));
      return;
    }
    router.push("/workspace?new=1");
  }

  return (
    <div className="relative flex h-dvh overflow-hidden bg-bg-app text-text-primary">
      {open ? (
        <aside className="flex w-[252px] shrink-0 flex-col border-r border-border-subtle bg-bg-panel">
          <div className="flex items-center gap-2 border-b border-border-subtle p-3">
            <Link href="/workspace" title="回到写作视图" className="inline-flex size-8 items-center justify-center rounded-sm text-text-secondary hover:bg-brand-soft hover:text-text-primary"><Home className="size-4" aria-hidden /></Link>
            <Button variant="ghost" size="icon-sm" title="收起左侧工作区" onClick={() => setOpen(false)}><PanelLeft aria-hidden /></Button>
          </div>
          <div className="flex-1 overflow-auto p-3">
            <Button onClick={newContent} variant="secondary" className="w-full justify-start"><Plus aria-hidden />新写一条</Button>
            <section className="mt-5">
              <h2 className="mb-2 text-xs font-medium text-text-secondary">最近内容</h2>
              {recentTasks.length ? <div className="space-y-1">{recentTasks.slice(0, 8).map((task) => <Link key={task.id} href={`/workspace?taskId=${encodeURIComponent(task.id)}`} className="block rounded-md px-2.5 py-2 text-xs hover:bg-brand-soft"><span className="block truncate font-medium">{task.title?.trim() || task.intentPreview || "未命名内容"}</span><span className="mt-0.5 block text-[11px] text-text-muted">{new Date(task.updatedAt).toLocaleDateString("zh-CN")}</span></Link>)}</div> : <p className="rounded-lg border border-dashed border-border-subtle bg-bg-card px-3 py-4 text-xs leading-5 text-text-secondary">还没有最近内容，写第一条后会出现在这里。</p>}
            </section>
            <nav className="mt-5 space-y-1" aria-label="产品导航">
              <ShellLink href="/radar" active={pathname === "/radar"} icon={Search}>本周可写选题</ShellLink>
              <p className="px-2 pt-4 text-[11px] font-medium text-text-muted">辅助</p>
              <ShellLink href="/gate0" active={pathname === "/gate0"} icon={ClipboardList}>周看板</ShellLink>
              <ShellLink href="/account" active={pathname === "/account"} icon={UserRound}>账号分析</ShellLink>
            </nav>
          </div>
          <div className="border-t border-border-subtle p-2"><AccountMenu userEmail={userEmail} /></div>
        </aside>
      ) : <Button variant="secondary" size="sm" className="fixed left-3 top-3 z-40 shadow-[var(--shadow-popover)]" onClick={() => setOpen(true)}><PanelLeft aria-hidden />展开</Button>}
      <div className="min-w-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}

function ShellLink({ href, active, icon: Icon, children }: { href: string; active: boolean; icon: typeof Home; children: React.ReactNode }) {
  return <Link href={href} aria-current={active ? "page" : undefined} className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] ${active ? "bg-brand-soft font-medium text-text-primary" : "text-text-secondary hover:bg-brand-soft hover:text-text-primary"}`}><Icon className="size-4" aria-hidden />{children}</Link>;
}
