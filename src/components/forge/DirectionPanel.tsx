"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Info,
  LoaderCircle,
  Pencil,
  Save,
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

const CONFIDENCE_LABEL: Record<AssumptionConfidence, string> = {
  high: "确定",
  inferred: "推断",
  unsure: "待确认",
};

interface DirectionPanelProps {
  assumptions: Assumption[];
  focusedIdea: string;
  hasAccountPost: boolean;
  pending: boolean;
  rememberedKeys: string[];
  compact?: boolean;
  onEdit: (key: string, value: string) => void;
  onGenerate: () => void;
  onRemember?: (assumption: Assumption) => void;
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
  onRemember,
}: DirectionPanelProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [openRationaleKey, setOpenRationaleKey] = useState<string | null>(null);
  const visibleAssumptions = assumptions.filter((a) => a.state !== "dismissed");
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
          const isRationaleOpen = openRationaleKey === assumption.key;
          const confidence = assumption.confidence ?? "inferred";
          const remembered = rememberedKeys.includes(assumption.key);

          return (
            <div
              key={assumption.key}
              className={cn(
                "rounded-lg border border-stone-300 bg-stone-50/80 p-4",
                assumption.state === "edited" && "border-stone-500 bg-white",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-stone-500">
                    {assumption.label}
                  </p>
                  <p className="mt-1 text-base font-semibold leading-6 text-stone-950">
                    {assumption.value}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    confidence === "high" &&
                      "bg-emerald-100 text-emerald-800",
                    confidence === "inferred" &&
                      "bg-amber-100 text-amber-800",
                    confidence === "unsure" && "bg-stone-200 text-stone-700",
                  )}
                >
                  {CONFIDENCE_LABEL[confidence]}
                </span>
              </div>

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
                    setOpenRationaleKey(isRationaleOpen ? null : assumption.key)
                  }
                >
                  <Info className="size-3.5" aria-hidden />
                  {copy.direction.rationale}
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
              </div>

              {isRationaleOpen && (
                <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm leading-6 text-stone-600">
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
                      className={cn(
                        "rounded-md border border-stone-300 bg-white px-3 py-2 text-left text-sm font-medium text-stone-800 transition hover:border-stone-500 hover:bg-stone-100",
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

      <div className={cn("mt-5 flex", compact ? "justify-stretch" : "justify-end")}>
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
