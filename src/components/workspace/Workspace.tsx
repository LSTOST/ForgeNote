"use client";

// ForgeNote M2-09 — 四区工作台（concept.html 落地，v3.17 暖纸白令牌）。
// 顶栏 / 左栏(导航+账号) / 中栏(内容方向+编辑区可读卡+助手胶囊) / 右栏(结构控制骨架+待裁决) / 底栏(渲染层)。
// 真实流程沿用 M2-07/08：想法 → /api/structure/generate → 编辑槽位/裁决 → /api/render。
// 诚实边界：中区展示「结构为可读卡片」（后端暂不产平台无关成稿散文）；未接线区块（雷达/助手/配方）
// 给最小占位或诚实禁用，不伪造数据。段落卡 ↔ 右栏骨架按 slotKey 双向高亮联动。

import { useState } from "react";
import Link from "next/link";
import { Home, PanelLeft, Plus, Sparkles, LogOut, Radar, X } from "lucide-react";

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

const RENDERERS: { id: RendererId; label: string; glyph: string; needsVisual?: boolean }[] = [
  { id: "xiaohongshu", label: "小红书", glyph: "书" },
  { id: "x_thread", label: "X", glyph: "𝕏" },
  { id: "image_prompt", label: "图片 Prompt", glyph: "▦", needsVisual: true },
];

// I-16 输出语言 / 表达偏好预设（value 即传给 /api/render 的 language；自由文本，非枚举）。
const OUTPUT_LOCALES: { value: string; label: string }[] = [
  { value: "zh-Hans", label: "中文" },
  { value: "English", label: "English" },
  { value: "English for Instagram carousel", label: "English · Instagram" },
  { value: "English for LinkedIn carousel", label: "English · LinkedIn" },
];

export function Workspace({ initialIdea = "", userEmail = "" }: { initialIdea?: string; userEmail?: string }) {
  const [idea, setIdea] = useState(initialIdea);
  const [gen, setGen] = useState<GenData | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const [renderOut, setRenderOut] = useState<{ platform: string; units: RenderUnitOut[] } | null>(null);
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
  const [assistOpen, setAssistOpen] = useState(false);

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
      setGen({ ...gen, structure: json.data.structure, stability: json.data.stability });
    } catch {
      setGenError("网络错误，请稍后重试");
    } finally {
      setDecidingKey(null);
    }
  }

  // 生成主内容（平台无关可读内容）：结构 → /api/content/main → 中区可编辑舞台。
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
        setMainError(json.error?.message ?? "生成主内容失败");
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

  async function render(rendererId: RendererId, label: string) {
    if (!gen) return;
    setRenderLoading(rendererId);
    setRenderError(null);
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structureId: gen.structureId, rendererId, language: outputLocale.trim() || undefined }),
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

  const structure = gen?.structure;
  const outline = structure ? buildOutline(structure) : null;
  const stable = gen?.stability.stable ?? false;
  const hasVisual = structure?.modalityStack.includes("visual") ?? false;
  const title = idea.trim() ? idea.trim().slice(0, 40) : "新内容";
  const doneSlots = structure ? structure.slots.filter((s) => s.strategyKey).length : 0;
  const totalSlots = structure?.slots.length ?? 0;

  return (
    <div className="relative flex h-dvh flex-col bg-background text-foreground">
      {/* ── 顶栏 ── */}
      <header className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <Link href="/" title="返回首页" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
          <Home className="size-4" aria-hidden />
        </Link>
        <button onClick={() => setLeftOpen((v) => !v)} title="收起 / 展开左栏" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
          <PanelLeft className="size-4" aria-hidden />
        </button>
        <div className="ml-1 text-[13px] text-muted-foreground">
          {gen ? <>新内容 · <b className="font-medium text-foreground">{title}</b></> : "新内容"}
        </div>
      </header>

      {/* ── 三栏 ── */}
      <div className="flex min-h-0 flex-1">
        {/* 左栏 */}
        {leftOpen && (
          <nav className="flex w-[252px] shrink-0 flex-col border-r border-border">
            <div className="flex-1 space-y-5 overflow-auto p-3">
              <button
                onClick={newContent}
                className="flex w-full items-center gap-2 rounded-[10px] border border-border bg-card px-3.5 py-2.5 text-sm font-medium hover:bg-muted"
              >
                <Plus className="size-4" aria-hidden /> 新建内容
                <kbd className="ml-auto rounded border border-border px-1.5 text-[11px] text-muted-foreground">⌘N</kbd>
              </button>

              <div>
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">当前任务</div>
                {gen ? (
                  <div className="rounded-xl border border-border bg-card p-3">
                    <h4 className="font-heading text-sm leading-snug">{title}</h4>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {getLabel(structure!.prototypeKey, "zh-Hans")}
                      </span>
                      {structure!.modalityStack.map((m) => (
                        <span key={m} className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">
                          {getLabel(m, "zh-Hans")}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2.5 flex justify-between text-[11px] text-muted-foreground">
                      <span>进度 {doneSlots}/{totalSlots}</span>
                      <span>{stable ? "结构稳定" : "编辑中"}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-primary" style={{ width: totalSlots ? `${(doneSlots / totalSlots) * 100}%` : "0%" }} />
                    </div>
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
                    还没有内容。在中间输入一个想法开始。
                  </p>
                )}
              </div>

              <div>
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">选题雷达</div>
                <Link href="/radar" className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Radar className="size-4" aria-hidden /> 去选题雷达找灵感 →
                </Link>
              </div>
            </div>

            {/* 账号页脚 */}
            <div className="flex items-center gap-2.5 border-t border-border px-3 py-2.5">
              <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-[11px] font-medium text-background">
                {(userEmail[0] ?? "D").toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground" title={userEmail}>
                {userEmail || "已登录"}
              </span>
              <form action="/auth/signout" method="post">
                <button type="submit" title="退出登录" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
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
              /* 冷启动：从想法开始 */
              <div className="mx-auto max-w-2xl pt-10">
                <h1 className="font-heading text-2xl font-medium">把一个模糊想法，变成可以直接开始做的内容方案</h1>
                <p className="mt-2 text-sm text-muted-foreground">丢一个想法进来 → 生成结构 → 右栏调整 → 底栏渲染成平台内容。</p>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  rows={4}
                  placeholder="上线前一晚，我把做了三周的功能砍掉了……"
                  className="mt-5 w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                />
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={generate}
                    disabled={idea.trim().length === 0 || genLoading}
                    className="rounded-[10px] bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {genLoading ? "生成结构中…" : "生成结构"}
                  </button>
                  {genError && <span className="text-sm text-destructive">{genError}</span>}
                </div>
              </div>
            ) : (
              /* 有结构：中区=可读内容（提纲 → 可编辑主内容）。结构在幕后（右栏）。 */
              <div className="mx-auto max-w-2xl">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="text-[13px] font-medium">内容方向</span>
                  <span className="rounded-md bg-accent px-2.5 py-1 text-xs text-foreground">{outline!.direction}</span>
                </div>

                {!mainContent ? (
                  /* Stage A：人类可读的内容方向 + 提纲（确定性、免模型） */
                  <>
                    <div className="mb-1 text-[13px] font-medium">内容提纲</div>
                    <p className="mb-4 text-xs text-muted-foreground">这是这条内容的可读提纲。方向 OK 就生成主内容，之后直接在这里编辑。</p>
                    <ol className="space-y-2">
                      {outline!.points.map((p, i) => (
                        <li
                          key={p.slotKey}
                          onMouseEnter={() => setHoverSlot(p.slotKey)}
                          onMouseLeave={() => setHoverSlot(null)}
                          className={`flex gap-3 rounded-xl border p-3.5 transition-colors ${hoverSlot === p.slotKey ? "border-primary/50 bg-accent" : "border-border bg-card"}`}
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[12px] font-semibold text-primary">{i + 1}</span>
                          <div className="min-w-0">
                            <div className="font-heading text-[14px]">{p.label}</div>
                            {p.strategyLabel && <div className="mt-0.5 text-xs text-muted-foreground">{p.strategyLabel}</div>}
                          </div>
                        </li>
                      ))}
                    </ol>
                    <div className="mt-5 flex items-center gap-3">
                      <button
                        onClick={genMain}
                        disabled={mainLoading}
                        className="rounded-[10px] bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        {mainLoading ? "生成主内容中…" : "✦ 生成主内容"}
                      </button>
                      {mainError && <span className="text-sm text-destructive">{mainError}</span>}
                    </div>
                  </>
                ) : (
                  /* Stage B：可编辑的主内容（正文 / 卡片 / 脚本）。 */
                  <>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-[13px] font-medium">
                        {mainContent.form === "cards" ? "内容卡片" : mainContent.form === "script" ? "脚本" : "正文"}
                        <span className="ml-2 font-normal text-xs text-muted-foreground">可直接编辑</span>
                      </span>
                      <button onClick={genMain} disabled={mainLoading} className="ml-auto text-xs text-muted-foreground hover:text-foreground disabled:opacity-50">
                        {mainLoading ? "重生成中…" : "↻ 重新生成"}
                      </button>
                    </div>
                    {mainError && <p className="mb-2 text-sm text-destructive">{mainError}</p>}
                    <div className="space-y-4">
                      {mainContent.sections.map((s, i) => (
                        <div
                          key={i}
                          onMouseEnter={() => setHoverSlot(s.role)}
                          onMouseLeave={() => setHoverSlot(null)}
                          className={`rounded-xl border p-4 transition-colors ${hoverSlot === s.role ? "border-primary/50 bg-accent" : "border-border bg-card"}`}
                        >
                          <input
                            value={draftSections[i]?.heading ?? s.heading}
                            onChange={(e) => setDraftSections((prev) => prev.map((d, di) => (di === i ? { ...d, heading: e.target.value } : d)))}
                            className="w-full bg-transparent font-heading text-[15px] font-medium outline-none"
                          />
                          <textarea
                            value={draftSections[i]?.text ?? s.text}
                            onChange={(e) => setDraftSections((prev) => prev.map((d, di) => (di === i ? { ...d, text: e.target.value } : d)))}
                            rows={Math.max(2, Math.ceil((draftSections[i]?.text ?? s.text).length / 34))}
                            placeholder="（这一段还没有内容，可自己写）"
                            className="mt-1.5 w-full resize-none bg-transparent text-sm leading-relaxed text-foreground outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 助手胶囊（诚实占位：入口在场，尚未接后端） */}
          {gen && !assistOpen && (
            <button
              onClick={() => setAssistOpen(true)}
              className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[13px] font-medium shadow-sm hover:bg-muted"
            >
              <Sparkles className="size-4 text-primary" aria-hidden /> 助手
            </button>
          )}
          {gen && assistOpen && (
            <div className="absolute bottom-4 left-1/2 w-[min(480px,90%)] -translate-x-1/2 rounded-2xl border border-border bg-card shadow-md">
              <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-[13px] font-medium">
                <Sparkles className="size-4 text-primary" aria-hidden /> ForgeNote 助手
                <button onClick={() => setAssistOpen(false)} className="ml-auto text-muted-foreground hover:text-foreground">
                  <X className="size-4" aria-hidden />
                </button>
              </div>
              <div className="px-4 py-4 text-[13px] text-muted-foreground">
                对话式助手即将接入。当前可用：右栏调整结构骨架与裁决、底栏渲染到平台。
              </div>
            </div>
          )}
        </main>

        {/* 右栏 · 结构控制 */}
        {gen && (
          <aside className="flex w-[296px] shrink-0 flex-col overflow-auto border-l border-border p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              内容设置
              <span className={`ml-auto rounded-md px-2 py-0.5 text-[11px] font-medium ${stable ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                {stable ? "结构稳定" : "编辑中"}
              </span>
            </div>

            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">内容原型</div>
            <div className="mb-4 rounded-[10px] border border-border bg-card px-3 py-2 text-[12.5px]">
              <span className="text-foreground">{getLabel(structure!.prototypeKey, "zh-Hans")}</span>
              <span className="ml-1.5 text-muted-foreground">· {structure!.modalityStack.map((m) => getLabel(m, "zh-Hans")).join(" + ")}</span>
            </div>

            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">结构顺序</div>
            <div className="space-y-1.5">
              {structure!.slots.map((s: StructureSlot, i) => {
                const opts = strategiesForSlot(s.key);
                const open = editingSlot === s.key;
                const hl = hoverSlot === s.key;
                return (
                  <div key={i}>
                    <button
                      onMouseEnter={() => setHoverSlot(s.key)}
                      onMouseLeave={() => setHoverSlot(null)}
                      onClick={() => setEditingSlot(open ? null : s.key)}
                      className={`flex w-full items-center gap-2 rounded-[10px] border px-3 py-2 text-left text-[12.5px] transition-colors ${hl || open ? "border-primary/50 bg-accent" : "border-border bg-card hover:bg-muted"}`}
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded bg-secondary text-[10px] text-muted-foreground">{i + 1}</span>
                      <span className="text-foreground">{getLabel(s.key, "zh-Hans")}</span>
                      <span className="ml-auto truncate text-muted-foreground">
                        {s.strategyKey ? getLabel(s.strategyKey, "zh-Hans") : <span className="text-primary">待定义</span>}
                      </span>
                      <span className="text-muted-foreground">›</span>
                    </button>
                    {open && opts.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5 pl-3">
                        {opts.map((opt) => (
                          <button
                            key={opt.key}
                            disabled={busySlot !== null}
                            onClick={() => setSlotStrategy(s.key, opt.key)}
                            className={`rounded-md border px-2 py-0.5 text-[11px] disabled:opacity-50 ${opt.key === s.strategyKey ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:bg-muted"}`}
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

            {!stable && gen.stability.blockers.length > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">未就绪：{gen.stability.blockers.join("；")}</p>
            )}

            {structure!.pendingDecisions.length > 0 && (
              <>
                <div className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  待裁决（{structure!.pendingDecisions.filter((d) => d.status !== "user_resolved" && d.status !== "accepted_default").length}）
                </div>
                <div className="space-y-2">
                  {structure!.pendingDecisions.map((d: PendingDecision, i) => {
                    const resolved = d.status === "user_resolved" || d.status === "accepted_default";
                    return (
                      <div key={i} className="rounded-lg border border-border bg-card px-3 py-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={resolved ? "text-muted-foreground" : "text-primary"}>{resolved ? "✓" : "?"}</span>
                          <span className="text-foreground">{d.key}</span>
                        </div>
                        {resolved ? (
                          <span className="mt-1 block text-muted-foreground">已选：{d.resolvedValue}</span>
                        ) : (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {(d.options ?? []).map((opt) => (
                              <button
                                key={opt}
                                disabled={decidingKey !== null}
                                onClick={() => resolveDecision(d.key, opt)}
                                className="rounded-md border border-border bg-background px-2 py-0.5 hover:bg-muted disabled:opacity-50"
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

            <div className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">输出语言 · 表达偏好（可选）</div>
            <div className="flex flex-wrap gap-1.5">
              {OUTPUT_LOCALES.map((loc) => (
                <button
                  key={loc.value}
                  onClick={() => setOutputLocale(outputLocale === loc.value ? "" : loc.value)}
                  className={`rounded-md border px-2 py-0.5 text-[11px] ${outputLocale === loc.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}
                >
                  {loc.label}
                </button>
              ))}
            </div>
            <input
              value={outputLocale}
              onChange={(e) => setOutputLocale(e.target.value.slice(0, 32))}
              placeholder="也可自定义，如 English for X thread"
              className="mt-2 w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12px] outline-none focus:border-primary"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">留空 = 按结构默认。点底栏「生成内容」时生效。</p>

            <div className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">账号记忆</div>
            {brain && (brain.audience || brain.voice || brain.memoryCount > 0) ? (
              <div className="space-y-1.5 rounded-[10px] border border-border bg-card px-3 py-2.5 text-[12px]">
                {brain.audience && (
                  <div><span className="text-muted-foreground">受众 </span><span className="text-foreground">{brain.audience}</span></div>
                )}
                {brain.voice && (
                  <div><span className="text-muted-foreground">声音 </span><span className="text-foreground">{brain.voice}</span></div>
                )}
                <div className="text-[11px] text-muted-foreground">引用了 {brain.memoryCount} 条账号记忆</div>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                生成主内容后显示本条用到的账号声音。还没接入账号？去 <Link href="/first-run" className="text-primary hover:underline">账号接入</Link>。
              </p>
            )}
          </aside>
        )}
      </div>

      {/* ── 底栏 · 渲染层 ── */}
      {gen && (
        <div className="flex items-center gap-3 border-t border-border px-5 py-3">
          <button disabled title="M2 结构 → 配方接线待收口" className="rounded-[10px] border border-border bg-card px-3.5 py-1.5 text-[13px] text-muted-foreground opacity-50">
            ☆ 保存为配方
          </button>
          <span className="text-xs text-muted-foreground">生成到（选中=主输出）</span>
          <div className="flex items-center gap-2">
            {RENDERERS.map((r) => {
              const off = r.needsVisual && !hasVisual;
              const on = target === r.id;
              return (
                <button
                  key={r.id}
                  disabled={off}
                  onClick={() => setTarget(r.id)}
                  title={off ? "需视觉结构" : undefined}
                  className={`flex items-center gap-1.5 rounded-[9px] border px-3 py-1.5 text-[12.5px] ${on ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-foreground hover:bg-muted"} disabled:opacity-40`}
                >
                  <span className="flex size-3.5 items-center justify-center rounded bg-foreground text-[9px] font-bold text-background">{r.glyph}</span>
                  {r.label}
                </button>
              );
            })}
          </div>
          <div className="ml-auto flex items-center gap-3">
            {renderError && <span className="text-sm text-destructive">{renderError}</span>}
            {!stable && <span className="text-xs text-muted-foreground">结构稳定后可渲染</span>}
            <button
              onClick={() => render(target, RENDERERS.find((r) => r.id === target)!.label)}
              disabled={!stable || renderLoading !== null}
              className="rounded-[10px] bg-primary px-5 py-2 text-[13.5px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {renderLoading ? "生成中…" : "✦ 生成内容"}
            </button>
          </div>
        </div>
      )}

      {/* 渲染产物覆盖层 */}
      {renderOut && (
        <div className="absolute inset-0 z-20 flex items-end justify-center bg-foreground/20 p-6" onClick={() => setRenderOut(null)}>
          <div className="max-h-[70vh] w-full max-w-2xl overflow-auto rounded-2xl border border-border bg-card p-5 shadow-md" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <span className="font-heading text-sm font-medium">渲染 · {renderOut.platform}</span>
              <button onClick={() => setRenderOut(null)} className="ml-auto text-muted-foreground hover:text-foreground">
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <div className="space-y-3">
              {renderOut.units.map((u, i) => (
                <div key={i}>
                  <div className="mb-0.5 text-xs text-muted-foreground">{u.role}</div>
                  <div className="whitespace-pre-line text-sm text-foreground">
                    {u.text || <em className="text-muted-foreground">（空）</em>}
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
