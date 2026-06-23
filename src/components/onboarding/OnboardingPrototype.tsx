"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Hammer,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { InlineSummary, type Slot } from "@/components/onboarding/InlineSummary";
import { WorkbenchPreview } from "@/components/onboarding/WorkbenchPreview";

type Step = "input" | "loading" | "understanding" | "error" | "generating";

const DEFAULT_IDEA =
  "想做一组讲第一次独居要不要存备用金的内容，给刚毕业自己租房的人看";

/** 屏2 第一行的实质摘要：先证明读懂了想法本身。 */
const SUBSTANCE = "要不要存 · 存多少 · 放在哪 · 什么时候能动";

/** 依据账号上下文构造 3 个真正影响生成的判断槽位。 */
function buildSlots(withContext: boolean): Slot[] {
  return [
    {
      key: "audience",
      dimension: "受众",
      value: "刚独居、怕踩坑的年轻人",
      confidence: withContext ? "sure" : "guess",
      basis: withContext
        ? "你过往的帖也大多写给刚开始独立生活的人"
        : "你想法里写了「第一次独居」「刚毕业自己租房」",
      basisSource: withContext ? "account" : "idea",
      corrected: false,
    },
    {
      key: "format",
      dimension: "内容形式",
      value: "小红书 · 7 张清单卡",
      confidence: "guess",
      basis: withContext
        ? "你过往多发小红书，这种「要不要做」的话题清单卡最好读"
        : "这种「要不要做某事」的话题，清单卡最好读",
      basisSource: withContext ? "account" : "idea",
      corrected: false,
    },
    {
      key: "angle",
      dimension: "表达角度",
      value: "过来人提醒，不制造焦虑",
      confidence: withContext ? "guess" : "unsure",
      basis: withContext
        ? "你过往帖也偏稳、实用，不爱贩卖焦虑"
        : "你没提想用什么口吻，这项我基本在猜",
      basisSource: withContext ? "account" : "idea",
      corrected: false,
    },
  ];
}

export function OnboardingPrototype() {
  const [step, setStep] = useState<Step>("input");
  const [idea, setIdea] = useState(DEFAULT_IDEA);
  const [withContext, setWithContext] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  function enterUnderstanding(ctx: boolean) {
    setWithContext(ctx);
    setSlots(buildSlots(ctx));
    setEditingKey(null);
    setStep("understanding");
  }

  function startUnderstanding() {
    setStep("loading");
    window.setTimeout(() => enterUnderstanding(withContext), 1300);
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
        <InputScreen idea={idea} onIdea={setIdea} onUnderstand={startUnderstanding} />
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
  onUnderstand: () => void;
}

function InputScreen({ idea, onIdea, onUnderstand }: InputScreenProps) {
  const canStart = idea.trim().length > 0;
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold leading-snug tracking-tight text-balance">
        把一个模糊想法，变成可以直接开始做的内容方案
      </h2>

      <Textarea
        value={idea}
        onChange={(e) => onIdea(e.target.value)}
        rows={5}
        placeholder="把没想清楚的想法直接写进来——要不要存钱、怎么排版，都行"
        className="resize-y text-base"
      />

      <Button
        type="button"
        size="lg"
        className="w-full sm:w-auto"
        disabled={!canStart}
        onClick={onUnderstand}
      >
        生成内容方案
        <ArrowRight className="size-4" aria-hidden />
      </Button>
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
  onBack,
}: UnderstandingScreenProps) {
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
          我先帮你定了这次的方向，改不对的就行
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          下面每个词点一下就能改，没改的我按默认理解来。
        </p>
      </div>

      {/* 第一行先讲实质：证明读懂了想法本身 */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-xs text-muted-foreground">这次内容我会替你讲清</p>
        <p className="mt-1.5 text-base font-medium leading-relaxed text-foreground text-pretty">
          {SUBSTANCE}
        </p>
      </div>

      {/* 无账号上下文提示（柔和、不告警） */}
      {!withContext && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          我还不认识你的账号，下面是只凭这次想法的推测——有一项你定一下会更贴你。
        </p>
      )}

      <InlineSummary
        slots={slots}
        flaggedKeys={flaggedKeys}
        editingKey={editingKey}
        onStartEdit={onStartEdit}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />

      {/* 底部：只留一个前进键 */}
      <div className="sticky bottom-0 -mx-1 space-y-1.5 border-t border-border bg-background/95 px-1 pb-1 pt-4 backdrop-blur">
        <Button type="button" size="lg" className="w-full" onClick={onConfirm}>
          生成内容方案
          <ArrowRight className="size-4" aria-hidden />
        </Button>
        <p className="text-center text-xs text-muted-foreground">没改的我按默认理解来</p>
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
      ? `给${slots[0].value}做${slots[1].value}，用${slots[2].value}`
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
