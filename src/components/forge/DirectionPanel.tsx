"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Info,
  LoaderCircle,
  Pencil,
  RotateCcw,
  Save,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Assumption, AssumptionConfidence } from "@/lib/ai/types";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";

const VALUE_OPTIONS: Record<string, string[]> = {
  audience: [
    "普通家庭财务新手",
    "新手父母",
    "月光族职场人",
    "自由职业者",
  ],
  content_form: ["图文清单", "问答拆解", "三步行动指南", "案例复盘"],
  angle: [
    "先给判断再给做法",
    "反常识提醒",
    "风险边界说明",
    "生活化故事切入",
  ],
};

function getConfidenceLabel(confidence: AssumptionConfidence) {
  if (confidence === "high") return copy.direction.confidenceHigh;
  if (confidence === "unsure") return copy.direction.confidenceUnsure;
  return copy.direction.confidenceInferred;
}

interface DirectionPanelProps {
  assumptions: Assumption[];
  focusedIdea: string;
  hasAccountPost: boolean;
  pending: boolean;
  rememberedKeys: string[];
  compact?: boolean;
  onEdit: (key: string, value: string) => void;
  onGenerate: () => void;
  onDismiss?: (key: string) => void;
  onRemember?: (assumption: Assumption) => void;
  onRestore?: (key: string) => void;
}

export function DirectionPanel({
  assumptions,
  focusedIdea,
  hasAccountPost,
  pending,
  rememberedKeys,
  compact = false,
  onEdit,
  onGenerate,
  onDismiss,
  onRemember,
  onRestore,
}: DirectionPanelProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [rationaleOverrides, setRationaleOverrides] = useState<
    Record<string, boolean>
  >({});
  const visibleAssumptions = assumptions.filter((a) => a.state !== "dismissed");
  const dismissedAssumptions = assumptions.filter(
    (a) => a.state === "dismissed",
  );
  const confirmedCount = visibleAssumptions.filter(
    (a) => a.state === "edited" || a.source === "profile",
  ).length;

  return (
    <section className="rounded-lg border border-stone-300 bg-white/88 p-5 shadow-sm">
      <div
        className={cn(
          "flex flex-col gap-4",
          !compact && "lg:flex-row lg:items-start lg:justify-between",
        )}
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
            <Check className="size-3.5" aria-hidden />
            {copy.direction.ready}
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-stone-950">
            {copy.direction.title}
          </h2>
          <div className="max-w-2xl rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2 text-sm leading-6 text-stone-800">
            <span className="font-medium text-stone-950">
              {copy.direction.focusLabel}
            </span>
            {focusedIdea.trim()}
          </div>
          <p className="max-w-2xl text-sm leading-6 text-stone-600">
            {hasAccountPost
              ? copy.direction.summaryWithPost
              : copy.direction.summaryWithoutPost}
          </p>
        </div>
        <div className={cn("text-sm text-stone-600", !compact && "lg:text-right")}>
          <p className="font-medium text-stone-900">
            {copy.direction.confirmed.replace("{n}", String(confirmedCount))}
          </p>
          <p>{copy.direction.defaultNotice}</p>
        </div>
      </div>

      <div className={cn("mt-5 grid gap-3", compact ? "grid-cols-1" : "md:grid-cols-3")}>
        {visibleAssumptions.map((assumption) => {
          const options = VALUE_OPTIONS[assumption.key] ?? [];
          const isEditing = editingKey === assumption.key;
          const confidence = assumption.confidence ?? "inferred";
          const defaultRationaleOpen =
            confidence === "unsure" || !assumption.rationale;
          const isRationaleOpen =
            rationaleOverrides[assumption.key] ?? defaultRationaleOpen;
          const remembered = rememberedKeys.includes(assumption.key);
          const confirmed =
            assumption.state === "edited" || assumption.source === "profile";

          return (
            <div
              key={assumption.key}
              className={cn(
                "min-w-0 rounded-lg border border-stone-300 bg-stone-50/80 p-4",
                confirmed && "border-stone-500 bg-white",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-stone-300 bg-white px-2.5 py-1 text-xs text-stone-600">
                    <span className="shrink-0 font-medium">{assumption.label}</span>
                    <span className="truncate font-semibold text-stone-950">
                      {assumption.value}
                    </span>
                  </div>
                  <p className="mt-3 break-words text-base font-semibold leading-6 text-stone-950">
                    {assumption.value}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                    confidence === "high" &&
                      "border border-stone-950 bg-stone-950 text-white",
                    confidence === "inferred" &&
                      "border border-stone-400 bg-white text-stone-700",
                    confidence === "unsure" &&
                      "border border-dashed border-stone-400 bg-stone-100 text-stone-700",
                  )}
                >
                  {getConfidenceLabel(confidence)}
                </span>
              </div>
              {confirmed && (
                <p className="mt-2 text-xs font-medium text-stone-500">
                  {assumption.state === "edited"
                    ? copy.direction.editedBadge
                    : copy.direction.profileBadge}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingKey(isEditing ? null : assumption.key)}
                  disabled={pending}
                >
                  <Pencil className="size-3.5" aria-hidden />
                  {copy.common.edit}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setRationaleOverrides((prev) => ({
                      ...prev,
                      [assumption.key]: !isRationaleOpen,
                    }))
                  }
                  aria-expanded={isRationaleOpen}
                >
                  <Info className="size-3.5" aria-hidden />
                  {isRationaleOpen
                    ? copy.direction.collapseRationale
                    : copy.direction.expandRationale}
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform",
                      isRationaleOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                </Button>
                {onRemember && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemember(assumption)}
                    disabled={pending || remembered}
                    title={copy.assumptions.rememberTitle}
                    className="text-stone-600 hover:bg-amber-50 hover:text-stone-950"
                  >
                    {remembered ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : (
                      <Save className="size-3.5" aria-hidden />
                    )}
                    {remembered
                      ? copy.assumptions.remembered
                      : copy.direction.remember}
                  </Button>
                )}
                {onRestore && assumption.state === "edited" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onRestore(assumption.key);
                      setEditingKey(null);
                    }}
                    disabled={pending}
                  >
                    <RotateCcw className="size-3.5" aria-hidden />
                    {copy.direction.restoreDefault}
                  </Button>
                )}
                {onDismiss && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onDismiss(assumption.key);
                      setEditingKey(null);
                    }}
                    disabled={pending}
                    className="text-stone-500 hover:bg-stone-100 hover:text-stone-950"
                  >
                    <X className="size-3.5" aria-hidden />
                    {copy.direction.dismiss}
                  </Button>
                )}
              </div>

              {isRationaleOpen && (
                <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm leading-6 text-stone-600">
                  <span className="font-medium text-stone-900">
                    {copy.direction.rationalePrefix}
                  </span>
                  {assumption.rationale ?? copy.direction.noRationale}
                </p>
              )}

              {isEditing && (
                <div className="mt-3 grid gap-2">
                  {options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        onEdit(assumption.key, option);
                        setEditingKey(null);
                      }}
                      disabled={pending}
                      aria-pressed={option === assumption.value}
                      className={cn(
                        "rounded-md border border-stone-300 bg-white px-3 py-2 text-left text-sm font-medium text-stone-800 transition hover:border-stone-500 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-stone-300/60 disabled:opacity-60",
                        option === assumption.value &&
                          "border-stone-900 bg-stone-900 text-white hover:bg-stone-900",
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {dismissedAssumptions.length > 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-stone-300 bg-white/70 p-3">
          <p className="text-xs font-medium text-stone-500">
            {copy.direction.dismissedTitle}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {dismissedAssumptions.map((assumption) => (
              <Button
                key={assumption.key}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRestore?.(assumption.key)}
                disabled={pending || !onRestore}
                className="max-w-full border-stone-300 bg-white"
              >
                <RotateCcw className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">
                  {copy.direction.restore} {assumption.label}
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}

      <div
        className={cn(
          "mt-5 flex gap-3",
          compact ? "flex-col" : "items-center justify-end",
        )}
      >
        {visibleAssumptions.length === 0 && (
          <p className="text-sm text-stone-600">
            {copy.direction.allDismissed}
          </p>
        )}
        <Button
          type="button"
          onClick={onGenerate}
          disabled={pending || visibleAssumptions.length === 0}
          className={cn(
            "min-w-36 bg-[#9b4a24] text-white shadow-sm hover:bg-[#823d1d] focus-visible:ring-[#d8a06f]/45",
            compact && "w-full",
          )}
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <ArrowRight className="size-4" aria-hidden />
          )}
          {pending ? copy.idea.forging : copy.direction.generate}
        </Button>
      </div>
    </section>
  );
}
