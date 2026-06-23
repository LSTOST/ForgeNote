"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ClipboardPaste,
  Hammer,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  JudgmentCard,
  type CardData,
  type CardItem,
} from "@/components/prototype/JudgmentCard";

type Step = "idea" | "loading" | "understanding" | "error";

const DEFAULT_IDEA =
  "想做一组讲第一次独居要不要存备用金的图文卡片，给刚毕业自己租房的人看";

/** 依据账号上下文构造四条判断（受众 / 平台与形式 / 语气 / 视觉方向）。 */
function buildCards(withContext: boolean): CardData[] {
  return [
    {
      key: "audience",
      dimension: "受众",
      judgment: "刚毕业、第一次自己租房独居的年轻人",
      confidence: withContext ? "high" : "inferred",
      basis: withContext
        ? "你过往发的帖也大多写给刚开始独立生活的人"
        : "你在想法里写了「第一次独居」「刚毕业自己租房」",
      basisSource: withContext ? "account" : "idea",
    },
    {
      key: "platform",
      dimension: "平台与形式",
      judgment: "小红书图文，一组 7 张卡片",
      confidence: "inferred",
      basis: withContext
        ? "你过往的内容大多发在小红书"
        : "你没特别说，我先按最常见的小红书图文来",
      basisSource: withContext ? "account" : "idea",
    },
    {
      key: "tone",
      dimension: "语气",
      judgment: "踏实、说人话，不制造焦虑",
      confidence: "inferred",
      basis: "这是新手容易紧张的话题，我倾向把话说稳一点",
      basisSource: "idea",
    },
    {
      key: "visual",
      dimension: "视觉方向",
      judgment: "干净的浅色背景，以文字为主",
      confidence: "uncertain",
      basis: "你没提到想要的风格，这条我基本是猜的",
      basisSource: "idea",
    },
  ];
}

function toItems(cards: CardData[]): CardItem[] {
  return cards.map((data) => ({
    data,
    value: data.judgment,
    state: "pending",
    corrected: false,
  }));
}

export function AssumptionPrototype() {
  const [step, setStep] = useState<Step>("idea");
  const [idea, setIdea] = useState(DEFAULT_IDEA);
  const [showPaste, setShowPaste] = useState(false);
  const [pastPost, setPastPost] = useState("");
  const [withContext, setWithContext] = useState(false);
  const [items, setItems] = useState<CardItem[]>([]);

  const hasAccountContext = pastPost.trim().length > 0;

  function enterUnderstanding(ctx: boolean) {
    setWithContext(ctx);
    setItems(toItems(buildCards(ctx)));
    setStep("understanding");
  }

  // 屏 1 → 理解中 → 屏 2（轻量 loading 模拟）。
  function startUnderstanding() {
    const ctx = hasAccountContext;
    setStep("loading");
    window.setTimeout(() => enterUnderstanding(ctx), 1300);
  }

  function resetToIdea() {
    setStep("idea");
  }

  // --- 卡片操作 ---
  function update(key: string, patch: Partial<CardItem>) {
    setItems((prev) =>
      prev.map((it) => (it.data.key === key ? { ...it, ...patch } : it)),
    );
  }

  const approvedCount = items.filter((it) => it.state === "approved").length;
  const allApproved = items.length > 0 && approvedCount === items.length;

  // 引导：只点出最该确认的 1–2 条（不太确定优先，其次推断）。已认可/编辑中的不再标记。
  const flaggedKeys = useMemo(() => {
    const open = items.filter(
      (it) => it.state === "pending" && !it.corrected,
    );
    const uncertain = open.filter((it) => it.data.confidence === "uncertain");
    const inferred = open.filter((it) => it.data.confidence === "inferred");
    return [...uncertain, ...inferred].slice(0, 2).map((it) => it.data.key);
  }, [items]);

  return (
    <div className="space-y-6">
      <StateNavigator
        step={step}
        withContext={withContext}
        onIdea={resetToIdea}
        onLoading={() => setStep("loading")}
        onUnderstanding={() => enterUnderstanding(true)}
        onUnderstandingNoCtx={() => enterUnderstanding(false)}
        onError={() => setStep("error")}
      />

      {step === "idea" && (
        <IdeaScreen
          idea={idea}
          onIdea={setIdea}
          showPaste={showPaste}
          onTogglePaste={() => setShowPaste((v) => !v)}
          pastPost={pastPost}
          onPastPost={setPastPost}
          hasAccountContext={hasAccountContext}
          onStart={startUnderstanding}
        />
      )}

      {step === "loading" && <LoadingScreen withContext={withContext} />}

      {step === "error" && (
        <ErrorScreen idea={idea} onRetry={startUnderstanding} onBack={resetToIdea} />
      )}

      {step === "understanding" && (
        <UnderstandingScreen
          items={items}
          withContext={withContext}
          flaggedKeys={flaggedKeys}
          approvedCount={approvedCount}
          allApproved={allApproved}
          onApprove={(k) => update(k, { state: "approved" })}
          onStartEdit={(k) => update(k, { state: "edit" })}
          onStartReject={(k) => update(k, { state: "reject" })}
          onSubmit={(k, value) =>
            update(k, { value, state: "approved", corrected: true })
          }
          onCancel={(k) => update(k, { state: "pending" })}
          onRestart={() => enterUnderstanding(withContext)}
          onBack={resetToIdea}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 屏 1：想法输入 + 可选冷启动                                          */
/* ------------------------------------------------------------------ */

interface IdeaScreenProps {
  idea: string;
  onIdea: (v: string) => void;
  showPaste: boolean;
  onTogglePaste: () => void;
  pastPost: string;
  onPastPost: (v: string) => void;
  hasAccountContext: boolean;
  onStart: () => void;
}

function IdeaScreen({
  idea,
  onIdea,
  showPaste,
  onTogglePaste,
  pastPost,
  onPastPost,
  hasAccountContext,
  onStart,
}: IdeaScreenProps) {
  const canStart = idea.trim().length > 0;
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-base font-semibold tracking-tight">
          说说你这次想做的内容
        </h2>
        <p className="text-sm text-muted-foreground">
          写得模糊也没关系，下一步我会先说说我的理解，再开始做。
        </p>
      </div>

      <Textarea
        value={idea}
        onChange={(e) => onIdea(e.target.value)}
        rows={5}
        placeholder="比如：想做一组讲第一次独居备用金清单的图文卡片"
        className="resize-y text-base"
      />

      {/* 冷启动：可选贴过往帖 */}
      <div className="rounded-xl border border-border bg-card">
        <button
          type="button"
          onClick={onTogglePaste}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2">
            <ClipboardPaste className="size-4 text-muted-foreground" aria-hidden />
            <span className="text-sm font-medium">
              贴一条你发过的帖，让我先认识你的账号风格
            </span>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              可选
            </span>
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              showPaste && "rotate-180",
            )}
            aria-hidden
          />
        </button>
        {showPaste && (
          <div className="space-y-2 border-t border-border px-4 py-3">
            <Textarea
              value={pastPost}
              onChange={(e) => onPastPost(e.target.value)}
              rows={3}
              placeholder="把一条你满意的旧帖正文贴进来即可，不贴也能继续。"
              className="resize-y text-sm"
            />
            <p className="text-xs text-muted-foreground">
              贴了之后，我对你受众和平台的判断会更有把握；不贴我就只从这次的想法推断。
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {hasAccountContext
            ? "已读到你的旧帖，我会结合你的账号来理解。"
            : "没贴旧帖也行，我会只凭这次的想法来理解。"}
        </p>
        <Button type="button" size="lg" disabled={!canStart} onClick={onStart}>
          <Sparkles className="size-4" aria-hidden />
          先看看我的理解
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 理解中：轻量 loading                                                 */
/* ------------------------------------------------------------------ */

function LoadingScreen({ withContext }: { withContext: boolean }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
        {withContext
          ? "正在结合你的想法和账号风格，整理我的理解…"
          : "正在读你的想法，整理我的理解…"}
      </div>
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-4"
            aria-hidden
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              <div className="h-4 w-12 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 理解失败：可重试、不丢输入                                           */
/* ------------------------------------------------------------------ */

function ErrorScreen({
  idea,
  onRetry,
  onBack,
}: {
  idea: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">
              这次没整理出我的理解
            </h2>
            <p className="text-sm text-muted-foreground">
              可能是网络或服务波动。你的想法已经保留好了，直接重试就行。
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">你刚才写的想法</p>
        <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
          {idea}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" onClick={onRetry}>
          <RotateCcw className="size-4" aria-hidden />
          重试理解
        </Button>
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" aria-hidden />
          回去改想法
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 屏 2：我对这次内容的理解                                              */
/* ------------------------------------------------------------------ */

interface UnderstandingScreenProps {
  items: CardItem[];
  withContext: boolean;
  flaggedKeys: string[];
  approvedCount: number;
  allApproved: boolean;
  onApprove: (key: string) => void;
  onStartEdit: (key: string) => void;
  onStartReject: (key: string) => void;
  onSubmit: (key: string, value: string) => void;
  onCancel: (key: string) => void;
  onRestart: () => void;
  onBack: () => void;
}

function UnderstandingScreen({
  items,
  withContext,
  flaggedKeys,
  approvedCount,
  allApproved,
  onApprove,
  onStartEdit,
  onStartReject,
  onSubmit,
  onCancel,
  onRestart,
  onBack,
}: UnderstandingScreenProps) {
  // 引导文案：列出最该确认的维度名。
  const flaggedNames = items
    .filter((it) => flaggedKeys.includes(it.data.key))
    .map((it) => it.data.dimension);

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        改想法
      </button>

      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-balance">
          我对这次内容的理解
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          {allApproved
            ? "都对上了，那就照这个理解来做。"
            : flaggedNames.length > 0
              ? `下面是我的判断。其中「${flaggedNames.join("」「")}」我最没把握，帮我确认一下；其余对的话直接认可就行。`
              : "下面是我的判断，看看哪条要改，对的直接认可就行。"}
        </p>
      </div>

      {/* 无账号上下文提示 */}
      {!withContext && (
        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            我还不认识你的账号，下面都是只凭这次想法的推断，所以整体没那么有把握。
            想更准的话，可以回上一步贴一条旧帖。
          </span>
        </div>
      )}

      {/* 进度 */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${(approvedCount / items.length) * 100}%` }}
          />
        </div>
        <span className="shrink-0 tabular-nums">
          已确认 {approvedCount}/{items.length}
        </span>
      </div>

      <div className="space-y-3">
        {items.map((it) => (
          <JudgmentCard
            key={it.data.key}
            item={it}
            flagged={flaggedKeys.includes(it.data.key)}
            onApprove={() => onApprove(it.data.key)}
            onStartEdit={() => onStartEdit(it.data.key)}
            onStartReject={() => onStartReject(it.data.key)}
            onSubmit={(v) => onSubmit(it.data.key, v)}
            onCancel={() => onCancel(it.data.key)}
          />
        ))}
      </div>

      {/* 底部操作 */}
      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/95 px-1 pb-1 pt-4 backdrop-blur">
        <Button type="button" variant="ghost" onClick={onRestart}>
          <RotateCcw className="size-4" aria-hidden />
          重新理解
        </Button>
        <Button type="button" size="lg">
          <Hammer className="size-4" aria-hidden />
          用这些理解生成内容包
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 原型状态导览（仅原型用，便于审阅各屏 / 各状态）                       */
/* ------------------------------------------------------------------ */

interface StateNavigatorProps {
  step: Step;
  withContext: boolean;
  onIdea: () => void;
  onLoading: () => void;
  onUnderstanding: () => void;
  onUnderstandingNoCtx: () => void;
  onError: () => void;
}

function StateNavigator({
  step,
  withContext,
  onIdea,
  onLoading,
  onUnderstanding,
  onUnderstandingNoCtx,
  onError,
}: StateNavigatorProps) {
  const tabs: { label: string; active: boolean; onClick: () => void }[] = [
    { label: "屏1 · 想法输入", active: step === "idea", onClick: onIdea },
    { label: "理解中", active: step === "loading", onClick: onLoading },
    {
      label: "屏2 · 认识你的账号",
      active: step === "understanding" && withContext,
      onClick: onUnderstanding,
    },
    {
      label: "屏2 · 还不认识你",
      active: step === "understanding" && !withContext,
      onClick: onUnderstandingNoCtx,
    },
    { label: "理解失败", active: step === "error", onClick: onError },
  ];

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        原型状态导览
      </p>
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={t.onClick}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              t.active
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
