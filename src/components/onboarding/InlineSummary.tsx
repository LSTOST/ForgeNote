"use client";

import { useState } from "react";
import { Check, ChevronDown, CornerDownLeft, Wand2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** 置信度：很确定 / 推测 / 还没把握。 */
export type Confidence = "sure" | "guess" | "unsure";
/** 依据来源：来自账号 / 来自想法 / 你定的。 */
export type BasisSource = "account" | "idea" | "corrected";

export interface Slot {
  key: string;
  /** 维度名，编辑时用，如「受众」。 */
  dimension: string;
  /** 当前判断值（标签里显示的文字）。 */
  value: string;
  confidence: Confidence;
  /** 依据：默认收起，点开才看。 */
  basis: string;
  basisSource: BasisSource;
  /** 用户改过 → 视为已敲定。 */
  corrected: boolean;
}

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  sure: "很确定",
  guess: "推测",
  unsure: "还没把握",
};

const SOURCE_LABEL: Record<BasisSource, string> = {
  account: "来自你的账号",
  idea: "来自你的想法",
  corrected: "你定的",
};

/**
 * 把判断压成一句话：用连接词把各标签串成自然语言。
 * 顺序对应 slots：受众 / 平台 / 内容形式 / 目标 / 风格。
 */
const CONNECTORS = ["给", "，在", "做", "，想让人", "，整体走", "的风格？"];

interface InlineSummaryProps {
  slots: Slot[];
  /** 被标记为「最该确认」的 key（仅 1–2 条，导向注意力）。 */
  flaggedKeys: string[];
  /** 哪个 slot 正在编辑。 */
  editingKey: string | null;
  onStartEdit: (key: string) => void;
  onSubmit: (key: string, value: string) => void;
  onCancel: () => void;
}

export function InlineSummary({
  slots,
  flaggedKeys,
  editingKey,
  onStartEdit,
  onSubmit,
  onCancel,
}: InlineSummaryProps) {
  const [showBasis, setShowBasis] = useState(false);
  const flaggedSlots = slots.filter((s) => flaggedKeys.includes(s.key) && !s.corrected);

  return (
    <div className="space-y-4">
      {/* 一眼扫完的摘要句 */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-lg leading-loose text-foreground text-pretty">
          {slots.map((slot, i) => (
            <span key={slot.key}>
              <span className="text-muted-foreground">{CONNECTORS[i]}</span>
              <InlineTag
                slot={slot}
                flagged={flaggedKeys.includes(slot.key) && !slot.corrected}
                onClick={() => onStartEdit(slot.key)}
              />
            </span>
          ))}
          <span className="text-muted-foreground">{CONNECTORS[slots.length]}</span>
        </p>

        {/* 内联编辑器 */}
        {editingKey && (
          <SlotEditor
            slot={slots.find((s) => s.key === editingKey)!}
            onSubmit={(v) => onSubmit(editingKey, v)}
            onCancel={onCancel}
          />
        )}

        {/* 依据：默认收起 */}
        <div className="mt-4 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => setShowBasis((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown
              className={cn("size-3.5 transition-transform", showBasis && "rotate-180")}
              aria-hidden
            />
            {showBasis ? "收起我的依据" : "为什么这么理解？"}
          </button>
          {showBasis && (
            <ul className="mt-3 space-y-2">
              {slots.map((slot) => (
                <li key={slot.key} className="flex items-start gap-2 text-xs leading-relaxed">
                  <span className="mt-0.5 shrink-0 text-muted-foreground">
                    {slot.dimension}
                  </span>
                  <span className="text-foreground/80">
                    因为{slot.corrected ? "你刚改成了这个" : slot.basis}
                  </span>
                  <span
                    className={cn(
                      "ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px]",
                      slot.basisSource === "account" && !slot.corrected
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {SOURCE_LABEL[slot.corrected ? "corrected" : slot.basisSource]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 只有「还没把握」的 1–2 条才高亮 +「帮我定？」 */}
      {flaggedSlots.length > 0 && !editingKey && (
        <div className="space-y-2">
          {flaggedSlots.map((slot) => (
            <div
              key={slot.key}
              className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5"
            >
              <span className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                <span className="font-medium">{slot.dimension}</span>
                {" 这条我还没把握，定一下会更准。"}
              </span>
              <Button
                type="button"
                size="xs"
                variant="outline"
                className="shrink-0 border-amber-500/40 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
                onClick={() => onStartEdit(slot.key)}
              >
                <Wand2 className="size-3" aria-hidden />
                帮我定？
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- 内联标签：可点击改，置信度用极克制的单色点缀 ---- */

function InlineTag({
  slot,
  flagged,
  onClick,
}: {
  slot: Slot;
  flagged: boolean;
  onClick: () => void;
}) {
  const unsure = slot.confidence === "unsure" && !slot.corrected;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mx-0.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 align-baseline font-medium transition-colors",
        "underline decoration-dashed decoration-1 underline-offset-4",
        unsure
          ? "bg-amber-500/10 text-amber-800 decoration-amber-500/50 hover:bg-amber-500/15 dark:text-amber-300"
          : "bg-muted text-foreground decoration-muted-foreground/40 hover:bg-muted-foreground/15",
      )}
    >
      {slot.corrected && <Check className="size-3 text-emerald-600" aria-hidden />}
      {slot.value}
      {(unsure || flagged) && (
        <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
      )}
    </button>
  );
}

/* ---- 单个标签的内联编辑器 ---- */

function SlotEditor({
  slot,
  onSubmit,
  onCancel,
}: {
  slot: Slot;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(slot.value);
  const canSave = draft.trim().length > 0;

  function commit() {
    if (canSave) onSubmit(draft.trim());
  }

  return (
    <div className="mt-4 rounded-lg border border-ring bg-background p-3 ring-3 ring-ring/20">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground">改「{slot.dimension}」</span>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="取消"
        >
          <X className="size-3.5" aria-hidden />
        </button>
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
        placeholder={`告诉我「${slot.dimension}」应该是什么样`}
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
