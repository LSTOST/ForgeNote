"use client";

// ForgeNote M2-07/08 — 工作台垂直切片（客户端）。
// 想法 → POST /api/structure/generate（结构 + 稳定性）→ 选平台 → POST /api/render → 展示产物。
// 中区以人类语言标签展示结构（registry getLabel，可读，不是 token 列表）；渲染产物在下方面板。
// 注：这是功能垂直切片；完整四区工作台（concept.html）为后续 M2-09。

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getLabel, strategiesForSlot } from "@/lib/structure/registry";
import type { RendererId } from "@/lib/render/contract";
import type { PendingDecision, StructureDocument, StructureSlot } from "@/lib/structure/types";

interface StabilityCondition {
  id: number;
  name: string;
  ok: boolean;
  detail?: string;
}
interface GenResponse {
  ok: boolean;
  data?: {
    taskId: string;
    structureId: string;
    structure: StructureDocument;
    stability: { stable: boolean; blockers: string[]; conditions: StabilityCondition[] };
  };
  error?: { code: string; message: string };
}
interface RenderUnitOut {
  role: string;
  slotKeys: string[];
  text: string;
}
interface RenderResponse {
  ok: boolean;
  data?: { artifactId: string; artifact: { format: string; output: { units: RenderUnitOut[] }; warnings: string[] } };
  error?: { code: string; message: string };
}

const RENDERERS: { id: RendererId; label: string; needsVisual?: boolean }[] = [
  { id: "xiaohongshu", label: "小红书" },
  { id: "x_thread", label: "X" },
  { id: "image_prompt", label: "图片 Prompt", needsVisual: true },
];

export function Workspace({ initialIdea = "" }: { initialIdea?: string }) {
  const [idea, setIdea] = useState(initialIdea);
  const [gen, setGen] = useState<GenResponse["data"] | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const [renderOut, setRenderOut] = useState<{ platform: string; units: RenderUnitOut[] } | null>(null);
  const [renderLoading, setRenderLoading] = useState<RendererId | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  const [decidingKey, setDecidingKey] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [busySlot, setBusySlot] = useState<string | null>(null);

  // 设置/修改一个 slot 的策略 → 重评稳定性 → 更新本地状态。
  async function setSlotStrategy(slotKey: string, strategyKey: string) {
    if (!gen) return;
    setBusySlot(slotKey);
    setGenError(null);
    try {
      const res = await fetch(`/api/structure/${gen.structureId}/slot`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotKey, strategyKey }),
      });
      const json: GenResponse = await res.json();
      if (!json.ok || !json.data) {
        setGenError(json.error?.message ?? "编辑失败");
        return;
      }
      setGen({ ...gen, structure: json.data.structure, stability: json.data.stability });
      setEditingSlot(null);
    } catch {
      setGenError("网络错误，请稍后重试");
    } finally {
      setBusySlot(null);
    }
  }

  // 裁决一个待决策 → 重评稳定性 → 更新本地状态（解锁渲染）。
  async function resolveDecision(key: string, value: string) {
    if (!gen) return;
    setDecidingKey(key);
    setGenError(null);
    try {
      const res = await fetch(`/api/structure/${gen.structureId}/decision`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, resolvedValue: value }),
      });
      const json: GenResponse = await res.json();
      if (!json.ok || !json.data) {
        setGenError(json.error?.message ?? "裁决失败");
        return;
      }
      // data.structure 缺 taskId/structureId（PATCH 只回结构+稳定性）→ 合并保留原 id
      setGen({ ...gen, structure: json.data.structure, stability: json.data.stability });
    } catch {
      setGenError("网络错误，请稍后重试");
    } finally {
      setDecidingKey(null);
    }
  }

  async function generate() {
    setGenLoading(true);
    setGenError(null);
    setRenderOut(null);
    try {
      const res = await fetch("/api/structure/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawIntent: idea.trim() }),
      });
      const json: GenResponse = await res.json();
      if (!json.ok || !json.data) {
        setGenError(json.error?.message ?? "生成失败");
        setGen(null);
        return;
      }
      setGen(json.data);
    } catch {
      setGenError("网络错误，请稍后重试");
    } finally {
      setGenLoading(false);
    }
  }

  async function render(rendererId: RendererId, label: string) {
    if (!gen) return;
    setRenderLoading(rendererId);
    setRenderError(null);
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structureId: gen.structureId, rendererId }),
      });
      const json: RenderResponse = await res.json();
      if (!json.ok || !json.data) {
        setRenderError(json.error?.message ?? "渲染失败");
        setRenderOut(null);
        return;
      }
      setRenderOut({ platform: label, units: json.data.artifact.output.units });
    } catch {
      setRenderError("网络错误，请稍后重试");
    } finally {
      setRenderLoading(null);
    }
  }

  const structure = gen?.structure;
  const hasVisual = structure?.modalityStack.includes("visual") ?? false;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">工作台</h1>
      <p className="mt-1 text-sm text-muted-foreground">丢一个想法 → 生成结构 → 渲染成平台内容。</p>

      {/* 想法输入 */}
      <div className="mt-6 space-y-3">
        <Textarea value={idea} onChange={(e) => setIdea(e.target.value)} rows={2} placeholder="上线前一晚，我把做了三周的功能砍掉了……" />
        <div className="flex items-center gap-3">
          <Button onClick={generate} disabled={idea.trim().length === 0 || genLoading}>
            {genLoading ? "生成结构中…" : "生成结构"}
          </Button>
          {genError && <span className="text-sm text-destructive">{genError}</span>}
        </div>
      </div>

      {/* 结构（人类语言标签，可读） */}
      {structure && (
        <div className="mt-8 rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-baseline gap-3">
            <h2 className="text-base font-semibold">{getLabel(structure.prototypeKey, "zh-Hans")}</h2>
            <span className="text-xs text-muted-foreground">
              {structure.modalityStack.map((m) => getLabel(m, "zh-Hans")).join(" + ")}
            </span>
            <StabilityBadge stable={gen!.stability.stable} />
          </div>
          <ul className="space-y-1.5">
            {structure.slots.map((s: StructureSlot, i) => {
              const opts = strategiesForSlot(s.key);
              const open = editingSlot === s.key;
              return (
                <li key={i} className="text-sm">
                  <div className="flex items-baseline gap-3">
                    <span className="w-14 shrink-0 text-muted-foreground">{getLabel(s.key, "zh-Hans")}</span>
                    <button
                      onClick={() => setEditingSlot(open ? null : s.key)}
                      className="text-left hover:underline"
                      title="点击修改策略"
                    >
                      {s.strategyKey ? getLabel(s.strategyKey, "zh-Hans") : <em className="text-primary not-italic">待定义 · 点击选择</em>}
                    </button>
                  </div>
                  {open && opts.length > 0 && (
                    <div className="ml-[68px] mt-1.5 flex flex-wrap gap-1.5">
                      {opts.map((opt) => (
                        <button
                          key={opt.key}
                          disabled={busySlot !== null}
                          onClick={() => setSlotStrategy(s.key, opt.key)}
                          className={`rounded-md border px-2 py-0.5 text-xs disabled:opacity-50 ${opt.key === s.strategyKey ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:bg-muted"}`}
                        >
                          {busySlot === s.key ? "…" : getLabel(opt.key, "zh-Hans")}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {!gen!.stability.stable && gen!.stability.blockers.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">未就绪：{gen!.stability.blockers.join("；")}</p>
          )}
          {structure.pendingDecisions.length > 0 && (
            <div className="mt-3 border-t border-border pt-3">
              <div className="mb-2 text-xs font-medium text-muted-foreground">待裁决</div>
              <div className="space-y-2">
                {structure.pendingDecisions.map((d: PendingDecision, i) => {
                  const resolved = d.status === "user_resolved" || d.status === "accepted_default";
                  return (
                    <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={resolved ? "text-muted-foreground" : "text-primary"}>{resolved ? "✓" : "?"}</span>
                      <span className="text-foreground">{d.key}</span>
                      {resolved ? (
                        <span className="text-muted-foreground">已选：{d.resolvedValue}</span>
                      ) : (
                        (d.options ?? []).map((opt) => (
                          <button
                            key={opt}
                            disabled={decidingKey !== null}
                            onClick={() => resolveDecision(d.key, opt)}
                            className="rounded-md border border-border bg-background px-2 py-0.5 hover:bg-muted disabled:opacity-50"
                          >
                            {decidingKey === d.key ? "…" : opt}
                          </button>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 渲染层：生成到平台 */}
      {structure && (
        <div className="mt-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">生成到</div>
          <div className="flex flex-wrap gap-2">
            {RENDERERS.map((r) => {
              const disabled = (r.needsVisual && !hasVisual) || !gen!.stability.stable || renderLoading !== null;
              return (
                <Button key={r.id} variant="secondary" disabled={disabled} onClick={() => render(r.id, r.label)}>
                  {renderLoading === r.id ? `${r.label}…` : r.label}
                </Button>
              );
            })}
          </div>
          {!gen!.stability.stable && <p className="mt-2 text-xs text-muted-foreground">结构未稳定，稳定后可渲染。</p>}
          {renderError && <p className="mt-2 text-sm text-destructive">{renderError}</p>}
        </div>
      )}

      {/* 渲染产物 */}
      {renderOut && (
        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <div className="mb-3 text-sm font-semibold">渲染 · {renderOut.platform}</div>
          <div className="space-y-3">
            {renderOut.units.map((u, i) => (
              <div key={i}>
                <div className="mb-0.5 text-xs text-muted-foreground">{u.role}</div>
                <div className="whitespace-pre-line text-sm text-foreground">{u.text || <em className="text-muted-foreground">（空）</em>}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StabilityBadge({ stable }: { stable: boolean }) {
  return stable ? (
    <span className="ml-auto rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">结构稳定</span>
  ) : (
    <span className="ml-auto rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">未就绪</span>
  );
}
