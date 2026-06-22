"use client";

import { useState } from "react";
import { BookMarked, Check, CircleAlert, CircleCheck, Copy, Save } from "lucide-react";

import type { ForgeStatus } from "@/components/forge/ForgeWorkbench";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { copy } from "@/lib/copy";
import type { RecipeDraft, Verification } from "@/lib/ai/types";

const c = copy.recipePanel;

interface RecipePanelProps {
  status: ForgeStatus;
  recipe: RecipeDraft | null;
  verification: Verification | null;
  // 来源 session（Batch A 成功生成后非空）；保存配方写入 recipes 时引用（I-08）。
  sessionId: string | null;
}

/** 将配方拼为可复制的纯文本摘要。 */
function buildRecipeSummary(r: RecipeDraft): string {
  const lines: string[] = [
    `${c.summaryName}：${r.name}`,
    `${c.summaryIntent}：${r.intentType}`,
    `${c.summaryAudience}：${r.audience}`,
    `${c.summaryGoal}：${r.goal}`,
    `${c.summaryTone}：${r.tone}`,
    `${c.summaryVisual}：${r.visualStyle}`,
  ];
  if (r.structure.length) lines.push(`${c.summaryStructure}：${r.structure.join("、")}`);
  if (r.negativeRules.length) lines.push(`${c.summaryNegative}：${r.negativeRules.join("、")}`);
  if (r.variables.length) lines.push(`${c.summaryVariables}：${r.variables.join("、")}`);
  if (r.acceptance.length) lines.push(`${c.summaryAcceptance}：${r.acceptance.join("、")}`);
  return lines.join("\n");
}

/** 保存配方的本地状态机（I-08）。 */
type SaveState = "idle" | "naming" | "saving" | "saved" | "error";

// 内容配方区（UIUX §8 / §9）。I-02B 渲染真实配方 + 验收结果；Batch C 加复制摘要；I-08 加保存配方闭环。
export function RecipePanel({
  status,
  recipe,
  verification,
  sessionId,
}: RecipePanelProps) {
  // 轻量复制反馈，与 OutcomePanel 一致，不引 toast 库。
  const [copied, setCopied] = useState(false);
  // 保存配方状态（I-08，UIUX §9.2）。
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [recipeName, setRecipeName] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  // 切换 session（新生成 / 新建）时由父组件以 key 重挂本组件来重置上述状态，
  // 避免沿用上一条的保存反馈（见 ForgeWorkbench 的 key={sessionId}）。

  async function copySummary(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // 复制失败静默忽略。
    }
  }

  // 打开命名 UI，默认值用配方名（UIUX §9.1）。
  function startNaming(defaultName: string) {
    setRecipeName(defaultName);
    setSaveError(null);
    setSaveState("naming");
  }

  async function saveRecipe() {
    if (!sessionId) return;
    const trimmed = recipeName.trim();
    if (trimmed.length === 0) return;

    setSaveState("saving");
    setSaveError(null);
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, name: trimmed }),
      });
      const json = await res.json().catch(() => null);
      if (json?.ok) {
        setSaveState("saved");
      } else {
        // 失败：保留命名 UI 与已生成结果，显示 inline error，可重试（UIUX §9.2）。
        setSaveError(json?.error?.message ?? c.saveFailed);
        setSaveState("error");
      }
    } catch {
      setSaveError(copy.common.networkError);
      setSaveState("error");
    }
  }
  if (status === "loading") {
    return (
      <Card className="min-h-72 p-6">
        <p className="mb-4 text-sm text-muted-foreground">{c.loading}</p>
        <div className="space-y-3" aria-hidden>
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-20 w-full animate-pulse rounded bg-muted" />
        </div>
      </Card>
    );
  }

  if (status === "success" && recipe) {
    return (
      <Card className="min-h-72 space-y-5 p-6">
        {/* 操作区（UIUX §8.3 / §9）。复制摘要 + 保存配方闭环（I-08）。 */}
        <div className="space-y-3 border-b pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copySummary(buildRecipeSummary(recipe))}
            >
              {copied ? (
                <Check className="size-3.5" aria-hidden />
              ) : (
                <Copy className="size-3.5" aria-hidden />
              )}
              {copied ? copy.common.copied : c.copySummary}
            </Button>

            {/* 命名态以外：展示「保存配方」入口（saved 后可再次保存为新配方）。 */}
            {saveState !== "naming" && saveState !== "saving" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => startNaming(recipe.name)}
                disabled={!sessionId}
                title={!sessionId ? c.needSession : undefined}
              >
                <Save className="size-3.5" aria-hidden />
                {c.saveRecipe}
              </Button>
            )}

            {saveState === "saved" && (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                <CircleCheck className="size-4" aria-hidden />
                {c.saved}
              </span>
            )}
          </div>

          {/* 命名 UI（UIUX §9.1）：默认值为配方名，名称为空禁用保存，保存中 loading。 */}
          {(saveState === "naming" ||
            saveState === "saving" ||
            saveState === "error") && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder={c.namePlaceholder}
                  aria-label={c.nameAria}
                  disabled={saveState === "saving"}
                  className="h-9 min-w-56 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={saveRecipe}
                  disabled={recipeName.trim().length === 0 || saveState === "saving"}
                >
                  {saveState === "saving" ? copy.common.saving : copy.common.save}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSaveState("idle")}
                  disabled={saveState === "saving"}
                >
                  {copy.common.cancel}
                </Button>
              </div>
              {saveState === "error" && saveError && (
                <p className="flex items-center gap-1.5 text-sm text-destructive">
                  <CircleAlert className="size-4 shrink-0" aria-hidden />
                  {saveError}
                </p>
              )}
            </div>
          )}
        </div>

        <Field label={c.summaryName} value={recipe.name} />
        <Field label={c.summaryIntent} value={recipe.intentType} />
        <Field label={c.summaryAudience} value={recipe.audience} />
        <Field label={c.summaryGoal} value={recipe.goal} />
        <Field label={c.summaryTone} value={recipe.tone} />
        <Field label={c.summaryVisual} value={recipe.visualStyle} />
        <ListField label={c.summaryStructure} items={recipe.structure} />
        <ListField label={c.summaryNegative} items={recipe.negativeRules} />
        <ListField label={c.summaryVariables} items={recipe.variables} />
        <ListField label={c.summaryAcceptance} items={recipe.acceptance} />

        {verification && <VerificationBlock verification={verification} />}
      </Card>
    );
  }

  // idle / error 空态（错误详情与重试在左侧 OutcomePanel 呈现）。
  return (
    <Card className="flex min-h-72 flex-col items-center justify-center gap-3 border-dashed p-8 text-center">
      <BookMarked className="size-8 text-muted-foreground/60" aria-hidden />
      <h2 className="text-base font-medium">{c.emptyTitle}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{c.emptyBody}</p>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm leading-relaxed text-foreground">{value}</p>
    </div>
  );
}

function ListField({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <ul className="list-disc space-y-0.5 pl-5 text-sm">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function VerificationBlock({ verification }: { verification: Verification }) {
  return (
    <div className="space-y-2 border-t pt-4">
      <div className="flex items-center gap-2">
        <p className="text-xs font-medium text-muted-foreground">{c.verificationTitle}</p>
        <span
          className={
            verification.overallPassed
              ? "text-xs font-medium text-emerald-600"
              : "text-xs font-medium text-destructive"
          }
        >
          {verification.overallPassed ? c.verifyPass : c.verifyFail}
        </span>
      </div>
      <ul className="space-y-1.5">
        {verification.checks.map((check) => (
          <li key={check.key} className="flex items-start gap-2 text-sm">
            {check.passed ? (
              <CircleCheck
                className="mt-0.5 size-4 shrink-0 text-emerald-600"
                aria-hidden
              />
            ) : (
              <CircleAlert
                className="mt-0.5 size-4 shrink-0 text-destructive"
                aria-hidden
              />
            )}
            <span>
              <span className="font-medium">{check.label}</span>
              {check.message ? (
                <span className="text-muted-foreground">：{check.message}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
