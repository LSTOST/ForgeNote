"use client";

// ForgeNote M2-09 — 四区工作台。G0S-08 加入持久化：最近内容可重开、草稿自动保存、平台版本可归档回看。

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Clipboard, Home, PanelLeft, Plus, Search, X } from "lucide-react";

import { AccountMenu } from "@/components/account/AccountMenu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  data?: {
    artifact: { rendererId: string; format: string; units: DeriveUnit[]; warnings: string[] };
    artifactId?: string | null;
    artifactCreatedAt?: string | null;
    persisted?: boolean;
  };
  error?: { code: string; message: string };
}
export interface TaskSummary {
  id: string;
  title: string | null;
  intentPreview: string;
  status: string;
  updatedAt: string;
}
interface ArtifactRecord {
  id: string | null;
  rendererId: string;
  platform: string;
  units: DeriveUnit[];
  createdAt: string;
}
/** GET /api/content/tasks/:id 的 data 形状（重开 / URL 自动打开共用）。 */
interface TaskDetail {
  task: { id: string; rawIntent: string; errorMessage: string | null };
  structure: StructureDocument | null;
  stability: GenData["stability"] | null;
  mainContent: MainContent | null;
  draftSections: { heading: string; text: string }[] | null;
  artifacts: { id: string | null; rendererId: string; units: DeriveUnit[]; createdAt: string }[] | null;
}

const TASK_STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  structuring: "生成中",
  ready: "进行中",
  published: "已发布",
  archived: "已归档",
  failed: "失败",
};

function formatTaskTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return d.toDateString() === now.toDateString() ? `${hh}:${mm}` : `${d.getMonth() + 1}/${d.getDate()}`;
}

// G0S-09：卡片提示词从主内容文本派生，不需要 visual 模态，不再门禁。
// 选小红书时自动双出（文案 + 卡片提示词），卡片提示词也可单独生成。
const RENDERERS: { id: RendererId; label: string; glyph: string }[] = [
  { id: "xiaohongshu", label: "小红书", glyph: "书" },
  { id: "x_thread", label: "X", glyph: "𝕏" },
  { id: "image_prompt", label: "卡片提示词", glyph: "▦" },
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
  title: "发布标题",
  body: "正文",
  tweet: "推文",
  image: "卡片图提示词",
  unit: "内容",
};

function displayDecisionLabel(key: string): string {
  if (key === "context.granularity") return "内容详细程度";
  return getLabel(key, "zh-Hans");
}

function displayRole(role: string): string {
  return ROLE_LABEL[role] ?? getLabel(role, "zh-Hans");
}

function platformActionLabel(rendererId: RendererId): string {
  if (rendererId === "xiaohongshu") return "生成小红书版本（文案+卡片提示词）";
  if (rendererId === "x_thread") return "生成 X 版本";
  return "生成卡片提示词";
}

function platformProgressLabel(rendererId: RendererId): string {
  if (rendererId === "xiaohongshu") return "正在生成小红书文案…";
  if (rendererId === "x_thread") return "正在生成 X 版本…";
  return "正在生成卡片提示词…";
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

export function Workspace({
  initialIdea = "",
  userEmail = "",
  initialTasks = [],
  initialTaskId = "",
  embedded = false,
}: {
  initialIdea?: string;
  userEmail?: string;
  initialTasks?: TaskSummary[];
  initialTaskId?: string;
  embedded?: boolean;
}) {
  const [idea, setIdea] = useState(initialIdea);
  const [gen, setGen] = useState<GenData | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const [renderOut, setRenderOut] = useState<{ platform: string; rendererId: RendererId; taskId: string; units: DeriveUnit[] } | null>(null);
  const [renderLoading, setRenderLoading] = useState<RendererId | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [target, setTarget] = useState<RendererId>("xiaohongshu");

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

  // G0S-08 持久化：最近内容列表（初始由 Server Component 提供）、重开、草稿自动保存、平台版本归档。
  const [recentTasks, setRecentTasks] = useState<TaskSummary[]>(initialTasks);
  const [openingTaskId, setOpeningTaskId] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<ArtifactRecord[]>([]);
  const [draftSaveState, setDraftSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [persistWarning, setPersistWarning] = useState<string | null>(null);
  const draftSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 仅在用户动作（生成/新建）后刷新列表；初始数据来自服务端，避免 effect 内 setState。
  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/content/tasks");
      const json = await res.json();
      if (json.ok && json.data) setRecentTasks(json.data.tasks as TaskSummary[]);
    } catch {
      // 列表加载失败不打断创作，保留旧列表
    }
  }, []);

  useEffect(() => {
    return () => {
      if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
    };
  }, []);

  function cancelDraftSave() {
    if (draftSaveTimer.current) {
      clearTimeout(draftSaveTimer.current);
      draftSaveTimer.current = null;
    }
  }

  /** 草稿自动保存（1.2s 防抖）。role 从生成稿 sections 溯源补齐。 */
  function scheduleDraftSave(nextDrafts: { heading: string; text: string }[]) {
    if (!gen || !mainContent) return;
    const taskId = gen.taskId;
    const sections = mainContent.sections.map((s, i) => ({
      role: s.role,
      heading: nextDrafts[i]?.heading ?? s.heading,
      text: nextDrafts[i]?.text ?? s.text,
    }));
    setDraftSaveState("saving");
    cancelDraftSave();
    draftSaveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/content/tasks/${taskId}/draft`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draftSections: sections }),
        });
        const json = await res.json();
        setDraftSaveState(json.ok ? "saved" : "error");
      } catch {
        setDraftSaveState("error");
      }
    }, 1200);
  }

  /** 把任务详情载入各区状态（纯 setState，供重开与从 URL 自动打开共用）。 */
  const applyTaskData = useCallback((d: TaskDetail) => {
    setIdea(d.task.rawIntent ?? "");
    setGenError(d.task.errorMessage ?? null);
    setGen(
      d.structure && d.stability
        ? { taskId: d.task.id, structureId: d.structure.id, structure: d.structure, stability: d.stability }
        : null,
    );
    const mc = d.mainContent ?? null;
    setMainContent(mc);
    setDraftSections(
      d.draftSections
        ? d.draftSections.map((s) => ({ heading: s.heading, text: s.text }))
        : mc
          ? mc.sections.map((s) => ({ heading: s.heading, text: s.text }))
          : [],
    );
    setArtifacts(
      (d.artifacts ?? []).map((a) => ({
        id: a.id,
        rendererId: a.rendererId,
        platform: RENDERERS.find((r) => r.id === a.rendererId)?.label ?? a.rendererId,
        units: a.units,
        createdAt: a.createdAt,
      })),
    );
    setRenderOut(null);
    setRenderError(null);
    setMainError(null);
    setBrain(null);
    setDraftSaveState("idle");
    setPersistWarning(null);
  }, []);

  /** 重开历史任务（左栏点击）：恢复想法、结构、正文草稿、平台版本归档。 */
  async function openTask(taskId: string) {
    if (openingTaskId) return;
    setOpeningTaskId(taskId);
    setOpenError(null);
    cancelDraftSave();
    try {
      const res = await fetch(`/api/content/tasks/${taskId}`);
      const json = await res.json();
      if (!json.ok || !json.data) {
        setOpenError(json.error?.message ?? "任务读取失败");
        return;
      }
      applyTaskData(json.data as TaskDetail);
    } catch {
      setOpenError("网络错误，请稍后重试");
    } finally {
      setOpeningTaskId(null);
    }
  }

  // 从 /workspace?taskId=… 进入（如首页「最近内容」）时自动打开该任务。
  // setState 只发生在 await 之后的异步回调里，不在 effect 同步体内。
  useEffect(() => {
    if (!initialTaskId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/content/tasks/${initialTaskId}`);
        const json = await res.json();
        if (cancelled || !json.ok || !json.data) return;
        applyTaskData(json.data as TaskDetail);
      } catch {
        // 自动打开失败时静默：用户仍可从左栏手动打开
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialTaskId, applyTaskData]);

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
    cancelDraftSave();
    setDraftSaveState("idle");
    try {
      const res = await fetch("/api/content/main", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structureId: gen.structureId }),
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
      setPersistWarning(json.data.persisted === false ? "本条未持久化（数据库迁移 0005 未应用），刷新后会丢失" : null);
      void loadTasks();
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
    setArtifacts([]);
    setOpenError(null);
    cancelDraftSave();
    setDraftSaveState("idle");
    setPersistWarning(null);
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
      void loadTasks();
    } catch {
      setGenError("网络错误，请稍后重试");
    } finally {
      setGenLoading(false);
    }
  }

  /** 单次派生：成功返回归档记录并写入 artifacts；失败写 renderError 返回 null。 */
  async function deriveOnce(rendererId: RendererId, label: string): Promise<ArtifactRecord | null> {
    if (!gen || !mainContent) return null;
    const sections = mainContent.sections.map((s, i) => ({
      role: s.role,
      heading: draftSections[i]?.heading ?? s.heading,
      text: draftSections[i]?.text ?? s.text,
    }));
    const res = await fetch("/api/content/derive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ structureId: gen.structureId, rendererId, sections }),
    });
    const json: DeriveResponse = await res.json();
    if (!json.ok || !json.data) {
      setRenderError(json.error?.message ? `${label}：${json.error.message}` : `${label}生成失败`);
      return null;
    }
    const record: ArtifactRecord = {
      id: json.data.artifactId ?? null,
      rendererId,
      platform: label,
      units: json.data.artifact.units,
      createdAt: json.data.artifactCreatedAt ?? new Date().toISOString(),
    };
    setArtifacts((prev) => [record, ...prev]);
    if (json.data.persisted === false) {
      setPersistWarning("平台版本未持久化（render_artifacts 写入失败），关闭后无法找回");
    }
    return record;
  }

  /** 派生入口（G0S-09）：小红书一键双出（文案 + 卡片提示词）；其余平台单出。 */
  async function deriveMain(rendererId: RendererId, label: string) {
    if (!gen || !mainContent) return;
    setRenderLoading(rendererId);
    setRenderError(null);
    try {
      const first = await deriveOnce(rendererId, label);
      if (first) {
        setRenderOut({ platform: first.platform, rendererId, taskId: gen.taskId, units: first.units });
      } else {
        setRenderOut(null);
      }
      if (rendererId === "xiaohongshu" && first) {
        setRenderLoading("image_prompt");
        await deriveOnce("image_prompt", "卡片提示词");
      }
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
    setArtifacts([]);
    setOpenError(null);
    cancelDraftSave();
    setDraftSaveState("idle");
    setPersistWarning(null);
  }

  // 外壳（AppShell）的「新写一条」在 /workspace 视图上派发 forgenote:new-content 事件；
  // embedded 时 Workspace 自身左栏隐藏，靠监听此事件复位到空状态（否则外壳按钮会是死按钮）。
  // latest-ref 模式：effect 内更新 ref（不在 render 期间写），挂载一次订阅，避免依赖抖动。
  const newContentRef = useRef(newContent);
  useEffect(() => {
    newContentRef.current = newContent;
  });
  useEffect(() => {
    const handler = () => newContentRef.current();
    window.addEventListener("forgenote:new-content", handler);
    return () => window.removeEventListener("forgenote:new-content", handler);
  }, []);

  async function copyRenderOut() {
    if (!renderOut) return;
    // 复制为平台可直接粘贴的纯文本：只取正文，不带内部 role key（G0S-08 / 差距清单 A3）。
    const text = renderOut.units
      .map((u) => u.text.trim())
      .filter(Boolean)
      .join("\n\n");
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
  const pendingCount = structure
    ? structure.pendingDecisions.filter((d) => d.status !== "user_resolved" && d.status !== "accepted_default").length
    : 0;

  return (
    <div className={`relative flex flex-col bg-bg-app text-text-primary ${embedded ? "h-full min-h-dvh" : "h-dvh"}`}>
      {!embedded && (
        <header className="flex items-center gap-2 border-b border-border-subtle bg-bg-panel px-4 py-2.5">
          <Link href="/workspace" title="回到写作视图" className="rounded-md p-1.5 text-text-secondary hover:bg-brand-soft hover:text-text-primary"><Home className="size-4" aria-hidden /></Link>
          <button onClick={() => setLeftOpen((v) => !v)} title="收起 / 展开左栏" className="rounded-md p-1.5 text-text-secondary hover:bg-brand-soft hover:text-text-primary"><PanelLeft className="size-4" aria-hidden /></button>
        </header>
      )}
      <div className="flex min-h-0 flex-1">
        {/* 左栏 */}
        {!embedded && leftOpen && (
          <nav className="flex w-[252px] shrink-0 flex-col border-r border-border-subtle bg-bg-panel">
            <div className="flex-1 space-y-5 overflow-auto p-3">
              <button
                onClick={newContent}
                className="flex w-full items-center gap-2 rounded-[10px] border border-border-subtle bg-bg-card px-3.5 py-2.5 text-sm font-semibold text-text-primary shadow-[var(--shadow-card)] hover:bg-brand-soft"
              >
                <Plus className="size-4 text-brand" aria-hidden /> 新写一条
              </button>

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
                {openError && <p className="mb-2 text-[11px] leading-4 text-danger">{openError}</p>}
                {recentTasks.length === 0 ? (
                  <p className="rounded-[var(--radius-lg)] border border-dashed border-border-subtle bg-bg-card px-3 py-4 text-xs leading-5 text-text-secondary">
                    还没有历史内容。生成第一条后会出现在这里。
                  </p>
                ) : (
                  <div className="space-y-1">
                    {recentTasks.slice(0, 8).map((t) => {
                      const active = gen?.taskId === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => void openTask(t.id)}
                          disabled={openingTaskId !== null}
                          className={`w-full rounded-lg border px-2.5 py-2 text-left text-[12px] transition-colors disabled:opacity-60 ${active ? "border-brand bg-brand-soft" : "border-transparent hover:bg-brand-soft"}`}
                        >
                          <span className="block truncate font-medium text-text-primary">
                            {openingTaskId === t.id ? "打开中…" : t.title?.trim() || t.intentPreview || "未命名内容"}
                          </span>
                          <span className="mt-0.5 flex justify-between text-[11px] text-text-muted">
                            <span>{TASK_STATUS_LABEL[t.status] ?? t.status}</span>
                            <span>{formatTaskTime(t.updatedAt)}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 账号页脚（唯一身份显示点，D2）：点头像展开账号菜单 */}
            <div className="border-t border-border-subtle p-2">
              <AccountMenu userEmail={userEmail} />
            </div>
          </nav>
        )}

        {/* 中栏 */}
        <main className="relative flex min-w-0 flex-1 flex-col overflow-auto">
          <div className="flex-1 px-6 py-5">
            {!gen ? (
              /* Stage 0：想法输入，主操作紧跟输入框（DESIGN §4）。 */
              <div className="mx-auto max-w-[760px] pt-[10vh]">
                <h1 className="mb-3 font-heading text-[22px] font-semibold text-text-primary">今天想写哪条内容？</h1>
                <p className="mb-4 text-sm leading-6 text-text-secondary">描述一个想法、选题，或卡住的地方。</p>
                <Textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  rows={10}
                  placeholder="写一个内容想法、选题，或正卡住的地方。比如：上线前一晚，把做了三周的功能砍掉了……"
                  className="mt-2 min-h-[220px] resize-none text-[15px] leading-7"
                />
                <div className="mt-4 flex items-center gap-3">
                  <Button onClick={generate} disabled={idea.trim().length === 0 || genLoading}>
                    {genLoading ? "正在生成内容框架…" : "开始创作"}
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
                  {mainContent && <span className="ml-auto text-[11px] text-text-muted">{draftSaveState === "saving" ? "保存中…" : draftSaveState === "saved" ? "草稿已保存" : draftSaveState === "error" ? "草稿保存失败，继续编辑可重试" : ""}</span>}
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
                          正文可直接修改，平台版本基于修改后的内容生成。
                        </p>
                      </div>
                      <button onClick={genMain} disabled={mainLoading} className="ml-auto text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-50">
                        {mainLoading ? "重生成中…" : "↻ 重新生成"}
                      </button>
                    </div>
                    {mainError && <p className="mb-2 text-sm text-danger">{mainError}</p>}
                    {persistWarning && <p className="mb-2 rounded-[10px] bg-warning-soft px-3 py-2 text-xs leading-5 text-warning">{persistWarning}</p>}
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
                            onChange={(e) => {
                              const next = draftSections.map((d, di) => (di === i ? { ...d, heading: e.target.value } : d));
                              setDraftSections(next);
                              scheduleDraftSave(next);
                            }}
                            className="w-full bg-transparent text-[16px] font-semibold text-text-primary outline-none"
                          />
                          <textarea
                            value={draftSections[i]?.text ?? s.text}
                            onChange={(e) => {
                              const next = draftSections.map((d, di) => (di === i ? { ...d, text: e.target.value } : d));
                              setDraftSections(next);
                              scheduleDraftSave(next);
                            }}
                            rows={Math.max(2, Math.ceil((draftSections[i]?.text ?? s.text).length / 34))}
                            placeholder="（这一段还没有内容，可自己写）"
                            className="mt-2 w-full resize-none bg-transparent text-sm leading-7 text-text-primary outline-none placeholder:text-text-muted"
                          />
                        </div>
                      ))}
                    </div>

                    {/* 产出区（G0S-10）：平台选择 + 生成 + 版本记录，紧跟正文（原底栏取消） */}
                    <div className="mt-8 border-t border-border-subtle pt-5">
                      <div className="text-[15px] font-semibold text-text-primary">平台版本</div>
                      <p className="mt-1 text-sm leading-6 text-text-secondary">选择平台，基于当前正文生成可发布版本。</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {RENDERERS.map((r) => {
                          const on = target === r.id;
                          return (
                            <button
                              key={r.id}
                              onClick={() => setTarget(r.id)}
                              className={`flex items-center gap-1.5 rounded-[9px] border px-3 py-1.5 text-[12.5px] ${on ? "border-brand bg-brand-soft text-text-primary" : "border-border-subtle bg-bg-card text-text-primary hover:bg-brand-soft"}`}
                            >
                              <span className="flex size-3.5 items-center justify-center rounded bg-text-primary text-[9px] font-bold text-text-inverse">{r.glyph}</span>
                              {r.label}
                            </button>
                          );
                        })}
                        <Button
                          onClick={() => deriveMain(target, RENDERERS.find((r) => r.id === target)!.label)}
                          disabled={renderLoading !== null}
                          size="sm"
                          className="ml-auto"
                        >
                          {renderLoading ? platformProgressLabel(renderLoading) : platformActionLabel(target)}
                        </Button>
                      </div>
                      {renderError && <p className="mt-2 text-sm text-danger">{renderError}</p>}
                      {artifacts.length > 0 && (
                        <div className="mt-4">
                          <div className="mb-2 text-xs font-medium text-text-secondary">平台版本记录（{artifacts.length}）</div>
                          <div className="space-y-1.5">
                            {artifacts.map((a, i) => (
                              <button
                                key={a.id ?? `local-${i}`}
                                onClick={() => setRenderOut({ platform: a.platform, rendererId: a.rendererId as RendererId, taskId: gen?.taskId ?? "", units: a.units })}
                                className="flex w-full items-center gap-2 rounded-[10px] border border-border-subtle bg-bg-card px-3 py-2 text-left text-[12.5px] hover:bg-brand-soft"
                                title="打开这个版本（可复制）"
                              >
                                <span className="font-medium text-text-primary">{a.platform}</span>
                                {a.id === null && <span className="text-[10px] text-warning">未持久化</span>}
                                <span className="ml-auto text-[11px] text-text-muted">{formatTaskTime(a.createdAt)}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </main>

        {/* 右栏 · 设置（DESIGN §4：只放影响生成结果的设置；状态 Badge 是全局唯一状态点） */}
        <aside className="flex w-[296px] shrink-0 flex-col overflow-auto border-l border-border-subtle bg-bg-panel p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
            内容设置
            <Badge className="ml-auto" variant={gen ? (stable ? "success" : "warning") : "warning"}>
              {!gen ? "等待想法" : stable ? "内容框架已确认" : pendingCount > 0 ? `待确认 ${pendingCount} 项` : "还可调整"}
            </Badge>
          </div>

          <div className="mb-2 text-xs font-medium text-text-secondary">
            写作顺序{mainContent ? "（正文已生成，只读）" : ""}
          </div>
          {structure ? (
            <div className="space-y-1.5">
              {structure.slots.map((s: StructureSlot, i) => {
                const opts = strategiesForSlot(s.key);
                const editable = !mainContent;
                const open = editable && editingSlot === s.key;
                const hl = hoverSlot === s.key;
                return (
                  <div key={i}>
                    <button
                      onMouseEnter={() => setHoverSlot(s.key)}
                      onMouseLeave={() => setHoverSlot(null)}
                      onClick={() => editable && setEditingSlot(open ? null : s.key)}
                      className={`flex w-full items-center gap-2 rounded-[10px] border px-3 py-2 text-left text-[12.5px] transition-colors ${hl || open ? "border-brand bg-brand-soft" : "border-border-subtle bg-bg-card"} ${editable ? "hover:bg-brand-soft" : "cursor-default opacity-80"}`}
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded bg-bg-panel text-[10px] text-text-secondary">{i + 1}</span>
                      <span className="text-text-primary">{getLabel(s.key, "zh-Hans")}</span>
                      <span className="ml-auto truncate text-text-secondary">
                        {s.strategyKey ? getLabel(s.strategyKey, "zh-Hans") : <span className="text-brand">待补充</span>}
                      </span>
                      {editable && <span className="text-text-muted">›</span>}
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
            {renderOut.rendererId === "xiaohongshu" && artifacts.some((a) => a.rendererId === "image_prompt") && (
              <p className="mb-3 rounded-[10px] bg-brand-soft px-3 py-2 text-xs text-text-secondary">
                卡片提示词已同步生成，关闭后在「平台版本记录」打开。
              </p>
            )}
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
