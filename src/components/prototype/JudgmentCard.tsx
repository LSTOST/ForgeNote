"use client";

import { useState } from "react";
import { Check, Pencil, X, Wand2, CornerDownLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** 置信度：高 / 推断 / 不太确定。 */
export type Confidence = "high" | "inferred" | "uncertain";
/** 依据来源：来自账号 / 来自想法 / 来自用户纠正。 */
export type BasisSource = "account" | "idea" | "corrected";
/** 单卡交互态。 */
export type CardUiState = "pending" | "edit" | "reject" | "approved";

export interface CardData {
  key: string;
  /** 维度名，如「受众」。 */
  dimension: string;
  /** AI 的判断（自然语言）。 */
  judgment: string;
  /** 依据（自然语言，解释「为什么这么判断」）。 */
  basis: string;
  basisSource: BasisSource;
  confidence: Confidence;
}

export interface CardItem {
  data: CardData;
  /** 当前判断文本（编辑 / 纠正后可变）。 */
  value: string;
  state: CardUiState;
  /** 用户改过 → 依据来源转为 corrected、置信度视为已确认。 */
  corrected: boolean;
}

const CONFIDENCE_META: Record<
  Confidence,
  { label: string; dot: string; chip: string }
> = {
  high: {
    label: "高",
    dot: "bg-emerald-500",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  inferred: {
    label: "推断",
    dot: "bg-muted-foreground/60",
    chip: "border-border bg-muted text-muted-foreground",
  },
  uncertain: {
    label: "不太确定",
    dot: "bg-amber-500",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
};

const SOURCE_LABEL: Record<BasisSource, string> = {
  account: "来自你的账号",
  idea: "来自你的想法",
  corrected: "你定的",
};

interface JudgmentCardProps {
  item: CardItem;
  /** 被标记为「最该确认」的卡：轻微高亮引导。 */
  flagged: boolean;
  onApprove: () => void;
  onStartEdit: () => void;
  onStartReject: () => void;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export function JudgmentCard({
  item,
  flagged,
  onApprove,
  onStartEdit,
  onStartReject,
  onSubmit,
  onCancel,
}: JudgmentCardProps) {
  const { data, value, state, corrected } = item;
  const effectiveConfidence: Confidence = corrected ? "high" : data.confidence;
  const effectiveSource: BasisSource = corrected ? "corrected" : data.basisSource;
  const conf = CONFIDENCE_META[effectiveConfidence];

  // ---- 已认可：视觉收敛为一行紧凑摘要 ----
  if (state === "approved") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
          <Check className="size-3.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-xs text-muted-foreground">{data.dimension}</span>
          <p className="truncate text-sm text-foreground">{value}</p>
        </div>
        <Button
          type="button"
          size="xs"
          variant="ghost"
          className="shrink-0 text-muted-foreground"
          onClick={onStartEdit}
        >
          <Pencil className="size-3" aria-hidden />
          改
        </Button>
      </div>
    );
  }

  // ---- 编辑 / 纠正：内联输入 ----
  if (state === "edit" || state === "reject") {
    const isReject = state === "reject";
    return (
      <EditingCard
        dimension={data.dimension}
        title={isReject ? "那它应该是？" : `调整「${data.dimension}」`}
        hint={
          isReject
            ? "告诉我对的方向，我会按你说的来。"
            : "改成你想要的样子，回车保存。"
        }
        initial={isReject ? "" : value}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );
  }

  // ---- 默认 pending ----
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-colors",
        flagged
          ? "border-amber-500/40 ring-1 ring-amber-500/20"
          : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">
          {data.dimension}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
            conf.chip,
          )}
        >
          <span className={cn("size-1.5 rounded-full", conf.dot)} aria-hidden />
          {conf.label}
        </span>
      </div>

      <p className="mt-1.5 text-[15px] leading-relaxed text-foreground text-pretty">
        {value}
      </p>

      <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs leading-relaxed text-muted-foreground">
        <span>{data.basis}</span>
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px]",
            effectiveSource === "account"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-muted text-muted-foreground",
          )}
        >
          {SOURCE_LABEL[effectiveSource]}
        </span>
      </p>

      {/* 不太确定：主动求纠偏 */}
      {effectiveConfidence === "uncertain" && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
          <span className="text-xs text-amber-700 dark:text-amber-400">
            这条我基本靠猜，帮我定一下更准。
          </span>
          <Button
            type="button"
            size="xs"
            variant="outline"
            className="shrink-0 border-amber-500/40 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
            onClick={onStartReject}
          >
            <Wand2 className="size-3" aria-hidden />
            帮我定？
          </Button>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Button type="button" size="sm" onClick={onApprove}>
          <Check className="size-3.5" aria-hidden />
          认可
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onStartEdit}>
          <Pencil className="size-3.5" aria-hidden />
          调整
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          onClick={onStartReject}
        >
          <X className="size-3.5" aria-hidden />
          不对
        </Button>
      </div>
    </div>
  );
}

interface EditingCardProps {
  dimension: string;
  title: string;
  hint: string;
  initial: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

function EditingCard({
  dimension,
  title,
  hint,
  initial,
  onSubmit,
  onCancel,
}: EditingCardProps) {
  const [draft, setDraft] = useState(initial);
  const canSave = draft.trim().length > 0;

  function commit() {
    if (canSave) onSubmit(draft.trim());
  }

  return (
    <div className="rounded-xl border border-ring bg-card p-4 ring-3 ring-ring/20">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">
          {dimension}
        </span>
        <span className="text-xs font-medium text-foreground">{title}</span>
      </div>
      <Textarea
        autoFocus
        rows={2}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") onCancel();
        }}
        placeholder={hint}
        className="mt-2 resize-none text-sm"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:flex">
          <CornerDownLeft className="size-3" aria-hidden />
          回车保存 · Esc 取消
        </span>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            取消
          </Button>
          <Button type="button" size="sm" onClick={commit} disabled={!canSave}>
            <Check className="size-3.5" aria-hidden />
            就这样
          </Button>
        </div>
      </div>
    </div>
  );
}
