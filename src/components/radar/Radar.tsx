"use client";

// ForgeNote M2-06 — 本周可写选题（客户端）。读账号分析生成选题卡，无伪热度、只用来源标签。
// 「展开做这条」→ 跳 /workspace 预填主题（选题闭环起点）。

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { EvidenceSource, RadarCard } from "@/lib/radar/types";

const SOURCE_LABEL: Record<EvidenceSource, string> = {
  account_match: "账号匹配",
  recent_signal: "近期信号",
  historically_effective: "历史有效",
  low_evidence: "低证据",
};

const PROTO_LABEL: Record<string, string> = {
  experience_recap: "经验复盘",
  knowledge_explainer: "知识解释",
  checklist_guide: "清单指南",
  opinion_argument: "观点表达",
  case_breakdown: "案例拆解",
};

interface RadarResponse {
  ok: boolean;
  data?: { saved: number; dropped: number; cards: RadarCard[] };
  error?: { code: string; message: string };
}

export function Radar() {
  const [cards, setCards] = useState<RadarCard[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/radar/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 5 }),
      });
      const json: RadarResponse = await res.json();
      if (!json.ok || !json.data) {
        setError(json.error?.message ?? "生成失败");
        return;
      }
      setCards(json.data.cards);
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  function trackRadarSelected(card: RadarCard) {
    void fetch("/api/gate0/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName: "radar_card_selected",
        payload: { prototype_key: card.prototypeKey ?? "", source: "radar" },
      }),
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="font-heading text-[22px] font-semibold">本周可写选题</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">根据已确认的账号分析提供候选；已有选题也可直接新写一条。</p>

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={generate} disabled={loading}>
          {loading ? "生成中…" : cards ? "换一批" : "生成本周选题"}
        </Button>
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>

      {cards && (
        <div className="mt-8 space-y-3">
          {cards.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂时没有可用选题，也可以新写一条并粘贴已有选题。</p>
          ) : (
            cards.map((c, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{SOURCE_LABEL[c.evidenceSource]}</span>
                  {c.prototypeKey && <span className="text-xs text-muted-foreground">{PROTO_LABEL[c.prototypeKey] ?? c.prototypeKey}</span>}
                  {c.suggestedPlatform && <span className="text-xs text-muted-foreground">· {c.suggestedPlatform}</span>}
                </div>
                <div className="text-sm font-semibold text-foreground">{c.topic}</div>
                {c.hookExample && <div className="mt-0.5 text-sm italic text-muted-foreground">{c.hookExample}</div>}
                <div className="mt-3">
                  <Link
                    href={`/workspace?idea=${encodeURIComponent(c.topic)}`}
                    onClick={() => trackRadarSelected(c)}
                    className="inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                  >
                    用这条开始创作
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
