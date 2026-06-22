"use client";

import { useState } from "react";
import { BarChart3, Check, CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";

const c = copy.performance;

interface PerformancePanelProps {
  sessionId: string;
}

// 表现区间枚举（DATA-SCHEMA §2.6）。空选项 = 未填。
const RANGES = ["0", "1-10", "11-50", "51-100", "101-500", "500+", "unknown"];

const METRICS = [
  { key: "likeRange", label: c.like },
  { key: "favoriteRange", label: c.favorite },
  { key: "commentRange", label: c.comment },
  { key: "followerGainRange", label: c.follower },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];
type SaveState = "idle" | "loading" | "saving" | "saved" | "error";

// F-16 表现回填 lite（I-12）。最小入口：折叠在结果区下方；展开后拉取已填值，可手动回填区间 + 发布时间 + 一句话复盘。
// M1 仅手动回填，不算 perf_score、不自动抓取。
export function PerformancePanel({ sessionId }: PerformancePanelProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  const [publishedAt, setPublishedAt] = useState("");
  const [note, setNote] = useState("");
  const [ranges, setRanges] = useState<Record<MetricKey, string>>({
    likeRange: "",
    favoriteRange: "",
    commentRange: "",
    followerGainRange: "",
  });

  // 首次展开时拉取已填表现，便于确认/预填（GET /api/sessions/:id）。
  async function expand() {
    setOpen(true);
    if (state !== "idle") return;
    setState("loading");
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const json = await res.json().catch(() => null);
      const p = json?.ok ? json.data?.performance : null;
      if (p) {
        setRanges({
          likeRange: p.likeRange ?? "",
          favoriteRange: p.favoriteRange ?? "",
          commentRange: p.commentRange ?? "",
          followerGainRange: p.followerGainRange ?? "",
        });
        setNote(p.performanceNote ?? "");
        if (p.publishedAt) {
          // ISO → datetime-local（截到分钟，本地时区）。
          const dt = new Date(p.publishedAt);
          if (!Number.isNaN(dt.getTime())) {
            const tzOffset = dt.getTimezoneOffset() * 60000;
            setPublishedAt(new Date(dt.getTime() - tzOffset).toISOString().slice(0, 16));
          }
        }
      }
      setState("idle");
    } catch {
      // 拉取失败不阻断回填，可直接填写保存。
      setState("idle");
    }
  }

  const hasAny =
    publishedAt.trim().length > 0 ||
    note.trim().length > 0 ||
    METRICS.some((m) => ranges[m.key].length > 0);

  async function save() {
    if (!hasAny) return;
    setState("saving");
    setError(null);

    // 只提交有值的字段（与 API「至少一项」一致）；区间为空则不发。
    const payload: Record<string, unknown> = {};
    for (const m of METRICS) {
      if (ranges[m.key]) payload[m.key] = ranges[m.key];
    }
    if (note.trim()) payload.performanceNote = note.trim();
    if (publishedAt.trim()) {
      const dt = new Date(publishedAt);
      if (!Number.isNaN(dt.getTime())) payload.publishedAt = dt.toISOString();
    }

    try {
      const res = await fetch(`/api/sessions/${sessionId}/performance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (json?.ok) {
        setState("saved");
      } else {
        setError(json?.error?.message ?? c.failed);
        setState("error");
      }
    } catch {
      setError(copy.common.networkError);
      setState("error");
    }
  }

  if (!open) {
    return (
      <div className="border-t pt-4">
        <Button type="button" variant="ghost" size="sm" onClick={expand}>
          <BarChart3 className="size-3.5" aria-hidden />
          {c.expand}
        </Button>
      </div>
    );
  }

  return (
    <section className="space-y-3 border-t pt-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="size-4 text-muted-foreground" aria-hidden />
        <h3 className="text-sm font-semibold tracking-tight">{c.title}</h3>
        <span className="text-xs text-muted-foreground">{c.subtitle}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {METRICS.map((m) => (
          <label key={m.key} className="space-y-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">
              {m.label}
              {c.rangeSuffix}
            </span>
            <select
              value={ranges[m.key]}
              onChange={(e) =>
                setRanges((prev) => ({ ...prev, [m.key]: e.target.value }))
              }
              disabled={state === "saving"}
              className="h-9 w-full appearance-none rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">{c.unfilled}</option>
              {RANGES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted-foreground">{c.publishedAt}</span>
        <input
          type="datetime-local"
          value={publishedAt}
          onChange={(e) => setPublishedAt(e.target.value)}
          disabled={state === "saving"}
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted-foreground">{c.note}</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={c.notePlaceholder}
          rows={2}
          maxLength={500}
          disabled={state === "saving"}
          className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="sm"
          onClick={save}
          disabled={!hasAny || state === "saving"}
        >
          {state === "saving" ? c.saving : c.save}
        </Button>
        {state === "saved" && (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
            <Check className="size-4" aria-hidden />
            {c.saved}
          </span>
        )}
        {state === "error" && error && (
          <span className="inline-flex items-center gap-1 text-sm text-destructive">
            <CircleAlert className="size-4" aria-hidden />
            {error}
          </span>
        )}
      </div>
    </section>
  );
}
