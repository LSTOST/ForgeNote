"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FALLBACK_REASON_KEYS, type FallbackReasonKey } from "@/lib/gate0/metrics";

const REASON_LABEL: Record<FallbackReasonKey, string> = {
  quality_not_enough: "质量不够",
  too_slow: "太慢",
  missing_context: "上下文不够",
  platform_fit_unclear: "平台适配不清楚",
  needed_free_chat: "需要自由对话",
  other: "其他",
};

export function Gate0FallbackForm() {
  const [reasonKey, setReasonKey] = useState<FallbackReasonKey>("quality_not_enough");
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function submit() {
    setState("saving");
    try {
      const res = await fetch("/api/gate0/fallback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reasonKey, note: note.trim() || undefined }),
      });
      const json = await res.json();
      if (!json.ok) {
        setState("error");
        return;
      }
      setState("saved");
      setNote("");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-sm font-medium">记录 ChatGPT fallback</div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[180px_1fr_auto]">
        <select
          value={reasonKey}
          onChange={(event) => setReasonKey(event.target.value as FallbackReasonKey)}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
        >
          {FALLBACK_REASON_KEYS.map((key) => (
            <option key={key} value={key}>
              {REASON_LABEL[key]}
            </option>
          ))}
        </select>
        <input
          value={note}
          onChange={(event) => setNote(event.target.value.slice(0, 160))}
          placeholder="一句话原因，可空"
          className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
        />
        <Button onClick={submit} disabled={state === "saving"}>
          {state === "saving" ? "记录中" : "记录"}
        </Button>
      </div>
      {state === "saved" && <p className="mt-2 text-xs text-muted-foreground">已记录。刷新后会进入本周统计。</p>}
      {state === "error" && <p className="mt-2 text-xs text-destructive">记录失败。</p>}
    </div>
  );
}
