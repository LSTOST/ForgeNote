"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
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
  InlineSummary,
  CONFIDENCE_LABEL,
  type Slot,
} from "@/components/onboarding/InlineSummary";
import { WorkbenchPreview } from "@/components/onboarding/WorkbenchPreview";

type Step = "input" | "loading" | "understanding" | "error" | "generating";

const DEFAULT_IDEA =
  "想做一组讲第一次独居要不要存备用金的内容，给刚毕业自己租房的人看";

const EXAMPLES = [
  "第一次独居要备的 10 样东西",
  "月薪到手怎么分才不月光",
  "租房避坑：签合同前必问的几句话",
];

/** 引导首屏预告「我会替你补这些」的维度。 */
const DIMENSION_CHIPS = ["受众", "平台", "内容形式", "目标", "风格"];

/** 依据账号上下文构造 5 个判断槽位。 */
function buildSlots(withContext: boolean): Slot[] {
  return [
    {
      key: "audience",
      dimension: "受众",
      value: "刚毕业、第一次独居的年轻人",
      confidence: withContext ? "sure" : "guess",
      basis: withContext
        ? "你过往的帖也大多写给刚开始独立生活的人"
        : "你想法里写了「第一次独居」「刚毕业自己租房」",
      basisSource: withContext ? "account" : "idea",
      corrected: false,
    },
    {
      key: "platform",
      dimension: "平台",
      value: "小红书",
      confidence: withContext ? "sure" : "guess",
      basis: withContext ? "你过往内容大多发在小红书" : "你没特别说，先按最常见的来",
      basisSource: withContext ? "account" : "idea",
      corrected: false,
    },
    {
      key: "format",
      dimension: "内容形式",
      value: "一组 7 张清单卡",
      confidence: "guess",
      basis: "这种「要不要做某事」的话题，清单卡最好读",
      basisSource: "idea",
      corrected: false,
    },
    {
      key: "goal",
      dimension: "目标",
      value: withContext ? "让人愿意收藏照着做" : "让人看完心里有底",
      confidence: withContext ? "guess" : "unsure",
      basis: withContext
        ? "你过往帖的收藏通常比点赞高，偏实用向"
        : "你没说想要什么效果，这条我基本在猜",
      basisSource: withContext ? "account" : "idea",
      corrected: false,
    },
    {
      key: "style",
      dimension: "风格",
      value: "过来人、不制造焦虑、浅色清单",
      confidence: "unsure",
      basis: "你没提风格，这条我基本是猜的",
      basisSource: "idea",
      corrected: false,
    },
  ];
}

export function OnboardingPrototype() {
  const [step, setStep] = useState<Step>("input");
  const [idea, setIdea] = useState(DEFAULT_IDEA);
  const [showPaste, setShowPaste] = useState(false);
  const [pastPost, setPastPost] = useState("");
  const [withContext, setWithContext] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const hasAccountContext = pastPost.trim().length > 0;

  function enterUnderstanding(ctx: boolean) {
    setWithContext(ctx);
    setSlots(buildSlots(ctx));
    setEditingKey(null);
    setStep("understanding");
  }

  function startUnderstanding() {
    const ctx = hasAccountContext;
    setStep("loading");
    window.setTimeout(() => enterUnderstanding(ctx), 1300);
  }

  // 引导：只点出最该确认的 1–2 条（还没把握优先）。
  const flaggedKeys = useMemo(() => {
    const open = slots.filter((s) => !s.corrected);
    const unsure = open.filter((s) => s.confidence === "unsure");
    return unsure.slice(0, 2).map((s) => s.key);
  }, [slots]);

  function submitSlot(key: string, value: string) {
    setSlots((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value, corrected: true } : s)),
    );
    setEditingKey(null);
  }

  return (
    <div className="space-y-6">
      <StateNavigator
        step={step}
        withContext={withContext}
        onInput={() => setStep("input")}
        onLoading={() => setStep("loading")}
        onCtx={() => enterUnderstanding(true)}
        onNoCtx={() => enterUnderstanding(false)}
        onError={() => setStep("error")}
        onGenerating={() => setStep("generating")}
      />

      {step === "input" && (
        <InputScreen
          idea={idea}
          onIdea={setIdea}
          showPaste={showPaste}
          onTogglePaste={() => setShowPaste((v) => !v)}
          pastPost={pastPost}
          onPastPost={setPastPost}
          hasAccountContext={hasAccountContext}
          onUnderstand={startUnderstanding}
          onDirectStart={() => setStep("generating")}
        />
      )}

      {step === "loading" && <LoadingScreen withContext={withContext} />}

      {step === "error" && (
        <ErrorScreen idea={idea} onRetry={startUnderstanding} onBack={() => setStep("input")} />
      )}

      {step === "understanding" && (
        <UnderstandingScreen
          slots={slots}
          withContext={withContext}
          flaggedKeys={flaggedKeys}
          editingKey={editingKey}
          onStartEdit={setEditingKey}
          onSubmit={submitSlot}
          onCancel={() => setEditingKey(null)}
          onConfirm={() => setStep("generating")}
          onRestart={() => enterUnderstanding(withContext)}
          onBack={() => setStep("input")}
        />
      )}

      {step === "generating" && (
        <GeneratingScreen slots={slots} onBack={() => setStep("input")} />
      )}

      <WorkbenchPreview />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 屏 1：想法输入（价值说明 + 大输入框 + 示例 + 维度预告 + 冷启动）       */
/* ------------------------------------------------------------------ */

interface InputScreenProps {
  idea: string;
  onIdea: (v: string) => void;
  showPaste: boolean;
  onTogglePaste: () => void;
  pastPost: string;
  onPastPost: (v: string) => void;
  hasAccountContext: boolean;
  onUnderstand: () => void;
  onDirectStart: () => void;
}

function InputScreen({
  idea,
  onIdea,
  showPaste,
  onTogglePaste,
  pastPost,
  onPastPost,
  hasAccountContext,
  onUnderstand,
  onDirectStart,
}: InputScreenProps) {
  const canStart = idea.trim().length > 0;
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-semibold tracking-tight text-balance">
          你今天想做什么内容？
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          写一句模糊的想法就行。我会先替你想清楚该怎么做，再动手——你几乎不用解释。
        </p>
      </div>

      <Textarea
        value={idea}
        onChange={(e) => onIdea(e.target.value)}
        rows={4}
        placeholder="比如：想做一组讲第一次独居备用金清单的内容"
        className="resize-y text-base"
      />

      {/* 3 个可点选示例 */}
      <div className="flex flex-wrap gap-2">
        <span className="self-center text-xs text-muted-foreground">没头绪？试试：</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => onIdea(ex)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
          >
            {ex}
          </button>
        ))}
      </div>

      {/* 输入前就亮出「我会替你补这些」 */}
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <Sparkles className="size-3.5" aria-hidden />
            你不用写全，这些我会替你补：
          </span>
          {DIMENSION_CHIPS.map((d) => (
            <span
              key={d}
              className="rounded-md bg-background px-2 py-0.5 text-foreground"
            >
              {d}
            </span>
          ))}
        </p>
      </div>

      {/* 冷启动：可选、可跳过、中等存在感 */}
      <div className="rounded-xl border border-border bg-card">
        <button
          type="button"
          onClick={onTogglePaste}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2">
            <ClipboardPaste className="size-4 text-muted-foreground" aria-hidden />
            <span className="text-sm font-medium">
              先让我认识你的账号风格——贴一条你发过的帖
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
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" disabled={!canStart} onClick={onDirectStart}>
            也可以直接开始
          </Button>
          <Button type="button" size="lg" disabled={!canStart} onClick={onUnderstand}>
            <Sparkles className="size-4" aria-hidden />
            看看我怎么理解
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 理解中：轻量骨架 loading                                             */
/* ------------------------------------------------------------------ */

function LoadingScreen({ withContext }: { withContext: boolean }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
        {withContext
          ? "正在结合你的想法和账号风格，理清该怎么做…"
          : "正在读你的想法，理清该怎么做…"}
      </div>
      <div className="rounded-xl border border-border bg-card p-5" aria-hidden>
        <div className="space-y-3">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-5 border-t border-border pt-3">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        </div>
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
            <h2 className="text-sm font-semibold text-foreground">这次没理清我的理解</h2>
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
          重试
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
/* 屏 2：我对这次内容的理解（核心，轻、一眼扫完）                        */
/* ------------------------------------------------------------------ */

interface UnderstandingScreenProps {
  slots: Slot[];
  withContext: boolean;
  flaggedKeys: string[];
  editingKey: string | null;
  onStartEdit: (key: string) => void;
  onSubmit: (key: string, value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  onRestart: () => void;
  onBack: () => void;
}

function UnderstandingScreen({
  slots,
  withContext,
  flaggedKeys,
  editingKey,
  onStartEdit,
  onSubmit,
  onCancel,
  onConfirm,
  onRestart,
  onBack,
}: UnderstandingScreenProps) {
  const openFlagged = slots.filter((s) => flaggedKeys.includes(s.key) && !s.corrected);
  const allSettled = openFlagged.length === 0;

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
          我打算这么做，对吗？
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          {allSettled
            ? "看起来都对上了，点【都对，开始生成】我就动手；想改哪个词，点一下就能改。"
            : `带点的词是我还没把握的，帮我确认下；其余你点一下任意词就能改。`}
        </p>
      </div>

      {/* 无账号上下文提示 */}
      {!withContext && (
        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            我还不认识你的账号，下面都是只凭这次想法的推测，所以有几条还没把握。
            想更准，可以回上一步贴一条旧帖。
          </span>
        </div>
      )}

      <InlineSummary
        slots={slots}
        flaggedKeys={flaggedKeys}
        editingKey={editingKey}
        onStartEdit={onStartEdit}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />

      {/* 底部操作 */}
      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/95 px-1 pb-1 pt-4 backdrop-blur">
        <Button type="button" variant="ghost" onClick={onRestart}>
          <RotateCcw className="size-4" aria-hidden />
          重新理解
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={onConfirm}>
            先跳过，直接生成
          </Button>
          <Button type="button" size="lg" onClick={onConfirm}>
            <Check className="size-4" aria-hidden />
            都对，开始生成
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 生成内容包（占位，不设计结果区）；顶部展示「认可后收成一行」          */
/* ------------------------------------------------------------------ */

function GeneratingScreen({ slots, onBack }: { slots: Slot[]; onBack: () => void }) {
  // 认可后：整条理解收成一行带 ✓。
  const line =
    slots.length > 0
      ? `给${slots[0].value}，在${slots[1].value}做${slots[2].value}`
      : "按你的想法";

  return (
    <div className="space-y-5">
      {/* 收成一行的确认条 */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
          <Check className="size-3.5" aria-hidden />
        </span>
        <p className="min-w-0 flex-1 truncate text-sm text-foreground">
          已按这个理解开始：{line}…
        </p>
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          重新理解
        </button>
      </div>

      {/* 生成占位（不设计结果区） */}
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
          <Hammer className="size-5 text-muted-foreground" aria-hidden />
        </div>
        <h2 className="mt-4 text-base font-semibold text-foreground">
          正在为你生成第一份内容…
        </h2>
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          这里之后会出现可编辑的内容（本原型不展开结果区）。生成完，它就会落进上面工作台的中间区。
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 原型状态导览（仅原型用）                                             */
/* ------------------------------------------------------------------ */

interface StateNavigatorProps {
  step: Step;
  withContext: boolean;
  onInput: () => void;
  onLoading: () => void;
  onCtx: () => void;
  onNoCtx: () => void;
  onError: () => void;
  onGenerating: () => void;
}

function StateNavigator({
  step,
  withContext,
  onInput,
  onLoading,
  onCtx,
  onNoCtx,
  onError,
  onGenerating,
}: StateNavigatorProps) {
  const tabs: { label: string; active: boolean; onClick: () => void }[] = [
    { label: "输入", active: step === "input", onClick: onInput },
    { label: "理解中", active: step === "loading", onClick: onLoading },
    {
      label: "我的理解 · 认识你",
      active: step === "understanding" && withContext,
      onClick: onCtx,
    },
    {
      label: "我的理解 · 还不认识你",
      active: step === "understanding" && !withContext,
      onClick: onNoCtx,
    },
    { label: "理解失败", active: step === "error", onClick: onError },
    { label: "认可后 · 生成", active: step === "generating", onClick: onGenerating },
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
