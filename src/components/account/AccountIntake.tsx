"use client";

// ForgeNote M2-05 — 首屏账号接入（客户端）。粘贴 profile/近期内容/表现 → 生成账号大脑。
// 调 POST /api/account/intake（反编造 + 持久化）。展示保留的账号记忆（来源标签 + 证据数）。

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AccountMemoryItem, MemoryKind, MemorySource } from "@/lib/account/types";

const KIND_LABEL: Record<MemoryKind, string> = {
  audience: "受众",
  voice: "声音",
  proven_pattern: "已验证规律",
  rule: "创作守则",
  topic: "常用主题",
  visual_pref: "视觉偏好",
};

const SOURCE_LABEL: Record<MemorySource, string> = {
  pasted_post: "来自帖子",
  user_observation: "你的观察",
  curated: "领域动态",
  cross_platform: "跨平台迁移",
  account_match: "账号推断",
};

interface IntakeResponse {
  ok: boolean;
  data?: { saved: number; dropped: number; items: AccountMemoryItem[] };
  error?: { code: string; message: string };
}

function toLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export function AccountIntake() {
  const [profileText, setProfileText] = useState("");
  const [postsText, setPostsText] = useState("");
  const [perfText, setPerfText] = useState("");
  const [platform, setPlatform] = useState("xiaohongshu");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AccountMemoryItem[] | null>(null);
  const [meta, setMeta] = useState<{ saved: number; dropped: number } | null>(null);

  const canSubmit = profileText.trim().length > 0 || toLines(postsText).length > 0;

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileText: profileText.trim(),
          recentPosts: toLines(postsText),
          performanceNotes: toLines(perfText),
          platform: platform.trim() || undefined,
        }),
      });
      const json: IntakeResponse = await res.json();
      if (!json.ok || !json.data) {
        setError(json.error?.message ?? "接入失败，请稍后重试");
        return;
      }
      setItems(json.data.items);
      setMeta({ saved: json.data.saved, dropped: json.data.dropped });
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">接入你的账号</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        粘贴 profile、近期内容和表现，我据此建立你的账号大脑——不编造，每条都要有证据。
      </p>

      <div className="mt-8 space-y-5">
        <Field label="平台">
          <input
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
            placeholder="xiaohongshu / x / …"
          />
        </Field>
        <Field label="Profile（简介 / 定位）">
          <Textarea value={profileText} onChange={(e) => setProfileText(e.target.value)} rows={2} placeholder="独居生活指南｜分享一个人住的实用经验…" />
        </Field>
        <Field label="近期内容（每行一条）">
          <Textarea value={postsText} onChange={(e) => setPostsText(e.target.value)} rows={5} placeholder={"一个人住第1000天：扔掉的5个必买好物\n下班后如何高效充电"} />
        </Field>
        <Field label="表现数据（每行一条，可选）">
          <Textarea value={perfText} onChange={(e) => setPerfText(e.target.value)} rows={3} placeholder={"第1条：收藏 2.1k、赞 856\n第2条：赞 340、评论 92"} />
        </Field>

        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={!canSubmit || loading}>
            {loading ? "分析中…" : "生成账号大脑"}
          </Button>
          {error && <span className="text-sm text-destructive">{error}</span>}
        </div>
      </div>

      {items && (
        <div className="mt-10">
          <div className="mb-3 flex items-baseline gap-3">
            <h2 className="text-lg font-semibold">账号大脑</h2>
            <span className="text-xs text-muted-foreground">
              保留 {meta?.saved} 条{meta && meta.dropped > 0 ? ` · 丢弃 ${meta.dropped} 条无证据项` : ""}
            </span>
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">这次没抽到有证据支撑的记忆——多粘几条内容再试。</p>
          ) : (
            <ul className="space-y-2">
              {items.map((it, i) => (
                <li key={i} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{KIND_LABEL[it.kind]}</span>
                    <span className="text-xs text-muted-foreground">{SOURCE_LABEL[it.source]}</span>
                    <span className="ml-auto text-xs text-muted-foreground">证据 ×{it.evidenceCount}</span>
                  </div>
                  <div className="mt-2 text-sm text-foreground">
                    {Object.entries(it.body).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-muted-foreground">{k}：</span>
                        {typeof v === "string" ? v : JSON.stringify(v)}
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
