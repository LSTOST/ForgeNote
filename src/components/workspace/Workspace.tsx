"use client";

// ForgeNote M2-09 — 四区工作台。只调整 UI 表达，保留原有生成流程和状态流。

import { useState } from "react";
import Link from "next/link";
import { Clipboard, Clock, Home, LogOut, PanelLeft, Plus, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { getLabel, strategiesForSlot } from "@/lib/structure/registry";
import { buildOutline } from "@/lib/content/outline";
import type { MainContent } from "@/lib/content/main-content";
import type { RendererId } from "@/lib/render/contract";
import type { PendingDecision, StructureDocument, StructureSlot } from "@/lib/structure/types";

interface StabilityCondition {
  id: number;
  name: string;
  ok: boolean;
  detail?: string;
}
interface GenData {
  taskId: string;
  structureId: string;
  structure: StructureDocument;
  stability: { stable: boolean; blockers: string[]; conditions: StabilityCondition[] };
}
interface GenResponse {
  ok: boolean;
  data?: GenData;
  error?: { code: string; message: string };
}
interface DeriveUnit {
  role: string;
  text: string;
}
interface DeriveResponse {
  ok: boolean;
  data?: { artifact: { rendererId: string; format: string; units: DeriveUnit[]; warnings: string[] } };
  error?: { code: string; message: string };
}

const RENDERERS: { id: RendererId; label: string; glyph: string; needsVisual?: boolean }[] = [
  { id: "xiaohongshu", label: "小红书", glyph: "书" },
  { id: "x_thread", label: "X", glyph: "𝕏" },
  { id: "image_prompt", label: "图片 Prompt", glyph: "▦", needsVisual: true },
];

// I-16 输出语言 / 表达偏好预设（value 即传给 /api/content/main 的 language；自由文本，非枚举）。
const OUTPUT_LOCALES: { value: string; label: string }[] = [
  { value: "zh-Hans", label: "中文" },
  { value: "English", label: "English" },
  { value: "English for Instagram carousel", label: "English · Instagram" },
  { value: "English for LinkedIn carousel", label: "English · LinkedIn" },
];

const ROLE_LABEL: Record<string, string> = {
  hook: "钩子",
  context: "背景",
  evidence: "依据",
  insight: "洞察",
  resolution: "收束",
  layout: "版式",
  visual_hierarchy: "画面重点",
  cover: "封面",
  card: "卡片",
  summary: "总结",
  layout_note: "版式说明",
};

function displayDecisionLabel(key: string): string {
  if (key === "context.granularity") return "内容详细程度";
  return getLabel(key, "zh-Hans");
}

function displayRole(role: string): string {
  return ROLE_LABEL[role] ?? getLabel(role, "zh-Hans");
}

function platformActionLabel(rendererId: RendererId): string {
  if (rendererId === "xiaohongshu") return "生成小红书版本";
  if (rendererId === "x_thread") return "生成 X 版本";
  return "生成图片提示词";
}

function platformProgressLabel(rendererId: RendererId): string {
  if (rendererId === "xiaohongshu") return "正在生成小红书版本…";
  if (rendererId === "x_thread") return "正在生成 X 版本…";
  return "正在生成图片提示词…";
}

function frameExample(label: string, strategyLabel: string | null, direction: string): string {
  return `${label}这一段会用「${strategyLabel ?? "默认写法"}」推进 ${direction}。`;
}

function frameReason(label: string, strategyLabel: string | null): string {
  return strategyLabel
    ? `先明确${label}的表达方式，正文生成时更容易保持顺序和重点。`
    : `这一段还可以继续调整，确认后正文会更稳。`;
}

function displayBrainSummary(value: string): string {
  return value
    .replace(/\bcares_about\s*[:：]/g, "关注：")
    .replace(/\bpain_points\s*[:：]/g, "常见困扰：")
    .replace(/\bproven_patterns\s*[:：]/g, "有效写法：");
}

export function Workspace({ initialIdea = "", userEmail = "" }: { initialIdea?: string; userEmail?: string }) {
  const [idea, setIdea] = useState(initialIdea);
  const [gen, setGen] = useState<GenData | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const [renderOut, setRenderOut] = useState<{ platform: string; rendererId: RendererId; taskId: string; units: DeriveUnit[] } | null>(null);
  const [renderLoading, setRenderLoading] = useState<RendererId | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [target, setTarget] = useState<RendererId>("xiaohongshu");
  const [outputLocale, setOutputLocale] = useState("");

  // 主内容（平台无关可读内容，中区舞台）：mainContent = 生成结果；draft = 用户可编辑副本。
  const [mainContent, setMainContent] = useState<MainContent | null>(null);
  const [draftSections, setDraftSections] = useState<{ heading: string; text: string }[]>([]);
  const [mainLoading, setMainLoading] = useState(false);
  const [mainError, setMainError] = useState<string | null>(null);
  const [brain, setBrain] = useState<{ audience: string | null; voice: string | null; memoryCount: number } | null>(null);

  const [decidingKey, setDecidingKey] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [busySlot, setBusySlot] = useState<string | null>(null);

  const [leftOpen, setLeftOpen] = useState(true);
  const [hoverSlot, setHoverSlot] = useState<string | null>(null);

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
        setGenError(json.error?.message ?? "确认失败");
        return;
      }
      setGen({ ...gen, structure: json.data.structure, stability: json.data.stability });
    } catch {
      setGenError("网络错误，请稍后重试");
    } finally {
      setDecidingKey(null);
    }
  }

  async function genMain() {
    if (!gen) return;
    setMainLoading(true);
    setMainError(null);
    try {
      const res = await fetch("/api/content/main", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structureId: gen.structureId, language: outputLocale.trim() || undefined }),
      });
      const json = await res.json();
      if (!json.ok || !json.data) {
        setMainError(json.error?.message ?? "生成正文失败");
        return;
      }
      const mc: MainContent = json.data.mainContent;
      setMainContent(mc);
      setDraftSections(mc.sections.map((s) => ({ heading: s.heading, text: s.text })));
      if (json.data.accountBrain) setBrain(json.data.accountBrain);
    } catch {
      setMainError("网络错误，请稍后重试");
    } finally {
      setMainLoading(false);
    }
  }

  async function generate() {
    setGenLoading(true);
    setGenError(null);
    setRenderOut(null);
    setMainContent(null);
    setDraftSections([]);
    setMainError(null);
    setBrain(null);
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

  async function deriveMain(rendererId: RendererId, label: string) {
    if (!gen || !mainContent) return;
    setRenderLoading(rendererId);
    setRenderError(null);
    try {
      const sections = mainContent.sections.map((s, i) => ({
        role: s.role,
        heading: draftSections[i]?.heading ?? s.heading,
        text: draftSections[i]?.text ?? s.text,
      }));
      const res = await fetch("/api/content/derive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structureId: gen.structureId, rendererId, sections, language: outputLocale.trim() || undefined }),
      });
      const json: DeriveResponse = await res.json();
      if (!json.ok || !json.data) {
        setRenderError(json.error?.message ?? "生成平台版本失败");
        setRenderOut(null);
        return;
      }
      setRenderOut({ platform: label, rendererId, taskId: gen.taskId, units: json.data.artifact.units });
    } catch {
      setRenderError("网络错误，请稍后重试");
    } finally {
      setRenderLoading(null);
    }
  }

  function newContent() {
    setGen(null);
    setIdea("");
    setRenderOut(null);
    setGenError(null);
    setRenderError(null);
    setEditingSlot(null);
    setMainContent(null);
    setDraftSections([]);
    setMainError(null);
    setBrain(null);
  }

  async function copyRenderOut() {
    if (!renderOut) return;
    const text = renderOut.units.map((u) => `${u.role}\n${u.text}`).join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    void fetch("/api/gate0/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName: "render_artifact_copied",
        taskId: renderOut.taskId,
        payload: { renderer_id: renderOut.rendererId, counts: { units: renderOut.units.length } },
      }),
    });
  }

  const structure = gen?.structure;
  const outline = structure ? buildOutline(structure) : null;
  const stable = gen?.stability.stable ?? false;
  const hasVisual = structure?.modalityStack.includes("visual") ?? false;
  const title = idea.trim() ? idea.trim().slice(0, 40) : "新内容";
  const doneSlots = structure ? structure.slots.filter((s) => s.strategyKey).length : 0;
  const totalSlots = structure?.slots.length ?? 0;

  return (
    <div className="relative flex h-dvh flex-col bg-bg-app text-text-primary">
      {/* ── 顶栏 ── */}
      <header className="flex items-center gap-2 border-b border-border-subtle bg-bg-panel px-4 py-2.5">
        <Link href="/first-run" title="回到首页" className="rounded-md p-1.5 text-text-secondary hover:bg-brand-soft hover:text-text-primary">
          <Home className="size-4" aria-hidden />
        </Link>
        <button onClick={() => setLeftOpen((v) => !v)} title="收起 / 展开左栏" className="rounded-md p-1.5 text-text-secondary hover:bg-brand-soft hover:text-text-primary">
          <PanelLeft className="size-4" aria-hidden />
        </button>
        <div className="ml-1 text-[13px] text-text-secondary">
          {gen ? <>当前内容 · <b className="font-medium text-text-primary">{title}</b></> : "新写一条"}
        </div>
      </header>

      {/* ── 三栏 ── */}
      <div className="flex min-h-0 flex-1">
        {/* 左栏 */}
        {leftOpen && (
          <nav className="flex w-[252px] shrink-0 flex-col border-r border-border-subtle bg-bg-panel">
            <div className="flex-1 space-y-5 overflow-auto p-3">
              <button
                onClick={newContent}
                className="flex w-full items-center gap-2 rounded-[10px] border border-border-subtle bg-bg-card px-3.5 py-2.5 text-sm font-semibold text-text-primary shadow-[var(--shadow-card)] hover:bg-brand-soft"
              >
                <Plus className="size-4 text-brand" aria-hidden /> 新写一条
                <kbd className="ml-auto rounded border border-border-subtle px-1.5 text-[11px] text-text-muted">⌘N</kbd>
              </button>

              <div>
                <div className="mb-2 text-xs font-medium text-text-secondary">当前账号</div>
                <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-bg-card p-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-full bg-text-primary text-[11px] font-medium text-text-inverse">
                      {(userEmail[0] ?? "F").toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-text-primary" title={userEmail}>
                        {userEmail || "已登录"}
                      </div>
                      <Link href="/account" className="text-[11px] text-brand hover:underline">
                        补充账号资料
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-medium text-text-secondary">当前内容</div>
                {gen ? (
                  <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-bg-card p-3 shadow-[var(--shadow-card)]">
                    <h4 className="text-sm leading-snug font-semibold text-text-primary">{title}</h4>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge>
                        {getLabel(structure!.prototypeKey, "zh-Hans")}
                      </Badge>
                      {structure!.modalityStack.map((m) => (
                        <Badge key={m}>
                          {getLabel(m, "zh-Hans")}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-2.5 flex justify-between text-[11px] text-text-secondary">
                      <span>进度 {doneSlots}/{totalSlots}</span>
                      <span>{stable ? "内容框架已确认" : "还可以调整"}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg-panel">
                      <div className="h-full bg-brand" style={{ width: totalSlots ? `${(doneSlots / totalSlots) * 100}%` : "0%" }} />
                    </div>
                  </div>
                ) : (
                  <p className="rounded-[var(--radius-lg)] border border-dashed border-border-subtle bg-bg-card px-3 py-4 text-xs leading-5 text-text-secondary">
                    还没有内容。在中间输入一个想法开始。
                  </p>
                )}
              </div>

              <div>
                <div className="mb-2 text-xs font-medium text-text-secondary">本周可写选题</div>
                <Link href="/radar" className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] text-text-secondary hover:bg-brand-soft hover:text-text-primary">
                  <Search className="size-4" aria-hidden /> 找下条选题 →
                </Link>
                <Link href="/gate0" className="mt-1 flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] text-text-secondary hover:bg-brand-soft hover:text-text-primary">
                  <Clipboard className="size-4" aria-hidden /> Gate 0 周看板 →
                </Link>
              </div>

              <div>
                <div className="mb-2 text-xs font-medium text-text-secondary">最近内容</div>
                <div className="rounded-[var(--radius-lg)] border border-dashed border-border-subtle bg-bg-card px-3 py-4 text-xs leading-5 text-text-secondary">
                  <Clock className="mb-2 size-4 text-text-muted" aria-hidden />
                  本轮先保留入口，后续接最近编辑记录。
                </div>
              </div>
            </div>

            {/* 账号页脚 */}
            <div className="flex items-center gap-2.5 border-t border-border-subtle px-3 py-2.5">
              <span className="flex size-7 items-center justify-center rounded-full bg-text-primary text-[11px] font-medium text-text-inverse">
                {(userEmail[0] ?? "D").toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-[12px] text-text-secondary" title={userEmail}>
                {userEmail || "已登录"}
              </span>
              <form action="/auth/signout" method="post">
                <button type="submit" title="退出登录" className="rounded-md p-1.5 text-text-secondary hover:bg-brand-soft hover:text-text-primary">
                  <LogOut className="size-4" aria-hidden />
                </button>
              </form>
            </div>
          </nav>
        )}

        {/* 中栏 */}
        <main className="relative flex min-w-0 flex-1 flex-col overflow-auto">
          <div className="flex-1 px-6 py-5">
            {!gen ? (
              /* Stage 0：工作台冷启动，保持完整工作形态。 */
              <div className="mx-auto max-w-[760px] pt-6">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <span className="text-[13px] font-medium text-text-primary">内容方向</span>
                  <Badge>等待输入</Badge>
                </div>
                <div className="mb-1 text-[18px] font-semibold text-text-primary">内容想法</div>
                <p className="mb-4 text-sm leading-6 text-text-secondary">
                  先写下这条内容的想法、选题，或卡住的地方。
                </p>
                <Textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  rows={4}
                  placeholder="例如：上线前一晚，我把做了三周的功能砍掉了……"
                  className="mt-6 min-h-[140px] resize-none text-[15px] leading-7"
                />
                <p className="mt-3 rounded-[var(--radius-md)] border border-border-subtle bg-bg-panel px-3 py-2 text-[12.5px] leading-5 text-text-secondary">
                  还没有账号分析也可以先生成内容框架；补充账号资料后，结果会更准。
                  <Link href="/account" className="ml-1 font-medium text-brand hover:underline">去分析账号</Link>
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <Button
                    onClick={generate}
                    disabled={idea.trim().length === 0 || genLoading}
                  >
                    {genLoading ? "生成内容框架中…" : "生成内容框架"}
                  </Button>
                  {genError && <span className="text-sm text-danger">{genError}</span>}
                </div>
              </div>
            ) : (
              /* 有内容框架：中区=可读内容（框架 → 可编辑正文）。 */
              <div className="mx-auto max-w-[760px]">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <span className="text-[13px] font-medium text-text-primary">内容方向</span>
                  <Badge variant="active">{outline!.direction}</Badge>
                </div>

                {!mainContent ? (
                  /* Stage A：人类可读的内容框架。 */
                  <>
                    <div className="mb-1 text-[18px] font-semibold text-text-primary">内容框架</div>
                    <p className="mb-4 text-sm leading-6 text-text-secondary">这是这条内容的写作顺序。确认后，系统会生成可编辑正文。</p>
                    <ol className="space-y-3">
                      {outline!.points.map((p, i) => (
                        <li
                          key={p.slotKey}
                          onMouseEnter={() => setHoverSlot(p.slotKey)}
                          onMouseLeave={() => setHoverSlot(null)}
                          className={`rounded-[var(--radius-lg)] border p-4 shadow-[var(--shadow-card)] transition-colors ${hoverSlot === p.slotKey ? "border-brand bg-brand-soft" : "border-border-subtle bg-bg-card"}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-brand-soft text-[12px] font-semibold text-brand">{i + 1}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-[15px] font-semibold text-text-primary">{p.label}</div>
                                <Badge>{p.strategyLabel ?? "默认写法"}</Badge>
                              </div>
                              <p className="mt-3 text-[14px] leading-7 text-text-primary">
                                {frameExample(p.label, p.strategyLabel, outline!.direction)}
                              </p>
                              <p className="mt-3 text-[12.5px] leading-6 text-text-secondary">
                                <span className="font-medium text-text-primary">为什么这样写：</span>
                                {frameReason(p.label, p.strategyLabel)}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                    <div className="mt-5 flex items-center gap-3">
                      <Button
                        onClick={genMain}
                        disabled={mainLoading}
                      >
                        {mainLoading ? "生成正文中…" : "生成正文"}
                      </Button>
                      {mainError && <span className="text-sm text-danger">{mainError}</span>}
                    </div>
                  </>
                ) : (
                  /* Stage B：可编辑正文。 */
                  <>
                    <div className="mb-4 flex items-start gap-3">
                      <div>
                        <div className="text-[18px] font-semibold text-text-primary">
                          {mainContent.form === "cards" ? "内容卡片" : mainContent.form === "script" ? "脚本" : "正文"}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-text-secondary">
                          你可以直接修改正文。平台版本会基于你修改后的内容生成。
                        </p>
                      </div>
                      <button onClick={genMain} disabled={mainLoading} className="ml-auto text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-50">
                        {mainLoading ? "重生成中…" : "↻ 重新生成"}
                      </button>
                    </div>
                    {mainError && <p className="mb-2 text-sm text-danger">{mainError}</p>}
                    <div className="space-y-4">
                      {mainContent.sections.map((s, i) => (
                        <div
                          key={i}
                          onMouseEnter={() => setHoverSlot(s.role)}
                          onMouseLeave={() => setHoverSlot(null)}
                          className={`rounded-[var(--radius-lg)] border p-4 shadow-[var(--shadow-card)] transition-colors ${hoverSlot === s.role ? "border-brand bg-brand-soft" : "border-border-subtle bg-bg-card"}`}
                        >
                          <div className="mb-2 text-[11px] font-medium text-text-secondary">来自：{displayRole(s.role)}</div>
                          <input
                            value={draftSections[i]?.heading ?? s.heading}
                            onChange={(e) => setDraftSections((prev) => prev.map((d, di) => (di === i ? { ...d, heading: e.target.value } : d)))}
                            className="w-full bg-transparent text-[16px] font-semibold text-text-primary outline-none"
                          />
                          <textarea
                            value={draftSections[i]?.text ?? s.text}
                            onChange={(e) => setDraftSections((prev) => prev.map((d, di) => (di === i ? { ...d, text: e.target.value } : d)))}
                            rows={Math.max(2, Math.ceil((draftSections[i]?.text ?? s.text).length / 34))}
                            placeholder="（这一段还没有内容，可自己写）"
                            className="mt-2 w-full resize-none bg-transparent text-sm leading-7 text-text-primary outline-none placeholder:text-text-muted"
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </main>

        {/* 右栏 · 结构控制 */}
        <aside className="flex w-[296px] shrink-0 flex-col overflow-auto border-l border-border-subtle bg-bg-panel p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
            内容设置
            <Badge className="ml-auto" variant={gen ? (stable ? "success" : "warning") : "warning"}>
              {gen ? (stable ? "内容框架已确认" : "还差一步") : "等待想法"}
            </Badge>
          </div>

          <div className="mb-1.5 text-xs font-medium text-text-secondary">当前状态</div>
          <div className="mb-4 rounded-[10px] border border-border-subtle bg-bg-card px-3 py-2 text-[12.5px] leading-5 text-text-secondary">
            {gen
              ? stable
                ? "可以继续生成正文和平台版本。"
                : "还有内容环节需要确认或补充。"
              : "还没有内容框架。先在中区输入想法。"}
          </div>

          <div className="mb-1.5 text-xs font-medium text-text-secondary">内容类型</div>
          <div className="mb-4 rounded-[10px] border border-border-subtle bg-bg-card px-3 py-2 text-[12.5px]">
            {structure ? (
              <>
                <span className="text-text-primary">{getLabel(structure.prototypeKey, "zh-Hans")}</span>
                <span className="ml-1.5 text-text-secondary">· {structure.modalityStack.map((m) => getLabel(m, "zh-Hans")).join(" + ")}</span>
              </>
            ) : (
              <span className="text-text-secondary">生成内容框架后显示</span>
            )}
          </div>

          <div className="mb-2 text-xs font-medium text-text-secondary">写作顺序</div>
          {structure ? (
            <div className="space-y-1.5">
              {structure.slots.map((s: StructureSlot, i) => {
                const opts = strategiesForSlot(s.key);
                const open = editingSlot === s.key;
                const hl = hoverSlot === s.key;
                return (
                  <div key={i}>
                    <button
                      onMouseEnter={() => setHoverSlot(s.key)}
                      onMouseLeave={() => setHoverSlot(null)}
                      onClick={() => setEditingSlot(open ? null : s.key)}
                      className={`flex w-full items-center gap-2 rounded-[10px] border px-3 py-2 text-left text-[12.5px] transition-colors ${hl || open ? "border-brand bg-brand-soft" : "border-border-subtle bg-bg-card hover:bg-brand-soft"}`}
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded bg-bg-panel text-[10px] text-text-secondary">{i + 1}</span>
                      <span className="text-text-primary">{getLabel(s.key, "zh-Hans")}</span>
                      <span className="ml-auto truncate text-text-secondary">
                        {s.strategyKey ? getLabel(s.strategyKey, "zh-Hans") : <span className="text-brand">待补充</span>}
                      </span>
                      <span className="text-text-muted">›</span>
                    </button>
                    {open && opts.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5 pl-3">
                        {opts.map((opt) => (
                          <button
                            key={opt.key}
                            disabled={busySlot !== null}
                            onClick={() => setSlotStrategy(s.key, opt.key)}
                            className={`rounded-md border px-2 py-0.5 text-[11px] disabled:opacity-50 ${opt.key === s.strategyKey ? "border-brand bg-brand-soft text-brand" : "border-border-subtle bg-bg-card hover:bg-brand-soft"}`}
                          >
                            {busySlot === s.key ? "…" : getLabel(opt.key, "zh-Hans")}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1.5">
              {["钩子", "背景", "依据", "洞察", "收束"].map((label, i) => (
                <div
                  key={label}
                  className="flex w-full items-center gap-2 rounded-[10px] border border-dashed border-border-subtle bg-bg-card px-3 py-2 text-[12.5px] text-text-muted"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded bg-bg-panel text-[10px]">{i + 1}</span>
                  <span>{label}</span>
                  <span className="ml-auto">待生成</span>
                </div>
              ))}
            </div>
          )}

            {gen && !stable && gen.stability.blockers.length > 0 && (
              <p className="mt-3 rounded-[10px] bg-warning-soft px-3 py-2 text-xs leading-5 text-warning">还需要确认 {gen.stability.blockers.length} 项。</p>
            )}

            {structure && structure.pendingDecisions.length > 0 && (
              <>
                <div className="mb-2 mt-5 text-xs font-medium text-text-secondary">
                  待确认（{structure.pendingDecisions.filter((d) => d.status !== "user_resolved" && d.status !== "accepted_default").length}）
                </div>
                <div className="space-y-2">
                  {structure.pendingDecisions.map((d: PendingDecision, i) => {
                    const resolved = d.status === "user_resolved" || d.status === "accepted_default";
                    return (
                      <div key={i} className="rounded-lg border border-border-subtle bg-bg-card px-3 py-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={resolved ? "text-text-muted" : "text-brand"}>{resolved ? "✓" : "?"}</span>
                          <span className="text-text-primary">{displayDecisionLabel(d.key)}</span>
                        </div>
                        {resolved ? (
                          <span className="mt-1 block text-text-secondary">已选：{d.resolvedValue}</span>
                        ) : (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {(d.options ?? []).map((opt) => (
                              <button
                                key={opt}
                                disabled={decidingKey !== null}
                                onClick={() => resolveDecision(d.key, opt)}
                                className="rounded-md border border-border-subtle bg-bg-card px-2 py-0.5 hover:bg-brand-soft disabled:opacity-50"
                              >
                                {decidingKey === d.key ? "…" : opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="mb-2 mt-5 text-xs font-medium text-text-secondary">输出语言</div>
            <div className="flex flex-wrap gap-1.5">
              {OUTPUT_LOCALES.map((loc) => (
                <button
                  key={loc.value}
                  onClick={() => setOutputLocale(outputLocale === loc.value ? "" : loc.value)}
                  className={`rounded-md border px-2 py-0.5 text-[11px] ${outputLocale === loc.value ? "border-brand bg-brand-soft text-brand" : "border-border-subtle bg-bg-card text-text-secondary hover:bg-brand-soft"}`}
                >
                  {loc.label}
                </button>
              ))}
            </div>
            <input
              value={outputLocale}
              onChange={(e) => setOutputLocale(e.target.value.slice(0, 32))}
              placeholder="也可自定义，如 English for X thread"
              className="mt-2 w-full rounded-lg border border-border-strong bg-bg-card px-2.5 py-1.5 text-[12px] outline-none focus:border-brand focus:ring-3 focus:ring-brand-soft"
            />
            <p className="mt-1 text-[11px] text-text-secondary">留空 = 按默认语言。点底栏按钮时生效。</p>

            <div className="mb-2 mt-5 text-xs font-medium text-text-secondary">账号分析摘要</div>
            {brain && (brain.audience || brain.voice || brain.memoryCount > 0) ? (
              <div className="space-y-1.5 rounded-[10px] border border-border-subtle bg-bg-card px-3 py-2.5 text-[12px]">
                {brain.audience && (
                  <div><span className="text-text-secondary">受众 </span><span className="text-text-primary">{displayBrainSummary(brain.audience)}</span></div>
                )}
                {brain.voice && (
                  <div><span className="text-text-secondary">语气 </span><span className="text-text-primary">{displayBrainSummary(brain.voice)}</span></div>
                )}
                <div className="text-[11px] text-text-secondary">引用了 {brain.memoryCount} 条账号资料</div>
              </div>
            ) : (
              <p className="text-[11px] leading-5 text-text-secondary">
                生成正文后显示本条用到的账号语气。还没分析账号？去 <Link href="/account" className="text-brand hover:underline">分析账号</Link>。
              </p>
            )}
        </aside>
      </div>

      {/* ── 底栏 · 平台版本 ── */}
      <Panel variant="bottom" className="flex items-center gap-3">
        <Button disabled variant="secondary" size="sm" title={mainContent ? "保存这套写法待接线" : "保存内容框架待接线"}>
          {mainContent ? "保存这套写法" : "保存内容框架"}
        </Button>
        <span className="text-xs text-text-secondary">平台版本</span>
        <div className="flex items-center gap-2">
          {RENDERERS.map((r) => {
            const off = r.needsVisual && !hasVisual;
            const on = target === r.id;
            return (
              <button
                key={r.id}
                disabled={off}
                onClick={() => setTarget(r.id)}
                title={off ? "需要图片提示词表达形式" : undefined}
                className={`flex items-center gap-1.5 rounded-[9px] border px-3 py-1.5 text-[12.5px] ${on ? "border-brand bg-brand-soft text-text-primary" : "border-border-subtle bg-bg-card text-text-primary hover:bg-brand-soft"} disabled:opacity-40`}
              >
                <span className="flex size-3.5 items-center justify-center rounded bg-text-primary text-[9px] font-bold text-text-inverse">{r.glyph}</span>
                {r.label}
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-3">
          {genError && !gen && <span className="text-sm text-danger">{genError}</span>}
          {renderError && <span className="text-sm text-danger">{renderError}</span>}
          {!mainContent && gen && <span className="text-xs text-text-secondary">先生成正文，再生成平台版本</span>}
          {!gen ? (
            <Button
              onClick={generate}
              disabled={idea.trim().length === 0 || genLoading}
              size="sm"
            >
              {genLoading ? "生成内容框架中…" : "生成内容框架"}
            </Button>
          ) : mainContent ? (
            <Button
              onClick={() => deriveMain(target, RENDERERS.find((r) => r.id === target)!.label)}
              disabled={renderLoading !== null}
              size="sm"
            >
              {renderLoading ? platformProgressLabel(renderLoading) : platformActionLabel(target)}
            </Button>
          ) : (
            <Button onClick={genMain} disabled={mainLoading} size="sm">
              {mainLoading ? "生成正文中…" : "生成正文"}
            </Button>
          )}
        </div>
      </Panel>

      {renderOut && (
        <div className="absolute inset-0 z-20 flex items-end justify-center bg-text-primary/20 p-6" onClick={() => setRenderOut(null)}>
          <div className="max-h-[70vh] w-full max-w-2xl overflow-auto rounded-[var(--radius-xl)] border border-border-subtle bg-bg-card p-5 shadow-[var(--shadow-popover)]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-semibold text-text-primary">平台版本 · {renderOut.platform}</span>
              <button onClick={copyRenderOut} className="ml-auto rounded-md p-1.5 text-text-secondary hover:bg-brand-soft hover:text-text-primary" title="复制结果">
                <Clipboard className="size-4" aria-hidden />
              </button>
              <button onClick={() => setRenderOut(null)} className="text-text-secondary hover:text-text-primary">
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <div className="space-y-3">
              {renderOut.units.map((u, i) => (
                <div key={i}>
                  <div className="mb-0.5 text-xs text-text-secondary">{displayRole(u.role)}</div>
                  <div className="whitespace-pre-line text-sm leading-7 text-text-primary">
                    {u.text || <em className="text-text-muted">（空）</em>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
