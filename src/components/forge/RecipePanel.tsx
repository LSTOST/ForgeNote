"use client";

import { useState } from "react";
import { BookMarked, Check, CircleAlert, CircleCheck, Copy } from "lucide-react";

import type { ForgeStatus } from "@/components/forge/ForgeWorkbench";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { RecipeDraft, Verification } from "@/lib/ai/types";

interface RecipePanelProps {
  status: ForgeStatus;
  recipe: RecipeDraft | null;
  verification: Verification | null;
}

/** 将配方拼为可复制的纯文本摘要。 */
function buildRecipeSummary(r: RecipeDraft): string {
  const lines: string[] = [
    `配方名称：${r.name}`,
    `内容类型：${r.intentType}`,
    `目标受众：${r.audience}`,
    `内容目标：${r.goal}`,
    `语气风格：${r.tone}`,
    `视觉规范：${r.visualStyle}`,
  ];
  if (r.structure.length) lines.push(`结构方式：${r.structure.join("、")}`);
  if (r.negativeRules.length) lines.push(`禁止项：${r.negativeRules.join("、")}`);
  if (r.variables.length) lines.push(`可替换变量：${r.variables.join("、")}`);
  if (r.acceptance.length) lines.push(`验收标准：${r.acceptance.join("、")}`);
  return lines.join("\n");
}

// 内容配方区（UIUX §8）。I-02B 渲染真实配方 + 验收结果；Batch C 加复制摘要 + 占位「保存配方」。
export function RecipePanel({ status, recipe, verification }: RecipePanelProps) {
  // 轻量复制反馈，与 OutcomePanel 一致，不引 toast 库。
  const [copied, setCopied] = useState(false);

  async function copySummary(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // 复制失败静默忽略。
    }
  }
  if (status === "loading") {
    return (
      <Card className="min-h-72 p-6">
        <p className="mb-4 text-sm text-muted-foreground">正在整理配方…</p>
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
        {/* 操作区（UIUX §8.3）。保存配方在下一批开放，本批占位禁用。 */}
        <div className="flex flex-wrap gap-2 border-b pb-4">
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
            {copied ? "已复制" : "复制配方摘要"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            title="保存配方将在下一批开放"
          >
            保存配方（下一批开放）
          </Button>
        </div>

        <Field label="配方名称" value={recipe.name} />
        <Field label="内容类型" value={recipe.intentType} />
        <Field label="目标受众" value={recipe.audience} />
        <Field label="内容目标" value={recipe.goal} />
        <Field label="语气风格" value={recipe.tone} />
        <Field label="视觉规范" value={recipe.visualStyle} />
        <ListField label="结构方式" items={recipe.structure} />
        <ListField label="禁止项" items={recipe.negativeRules} />
        <ListField label="可替换变量" items={recipe.variables} />
        <ListField label="验收标准" items={recipe.acceptance} />

        {verification && <VerificationBlock verification={verification} />}
      </Card>
    );
  }

  // idle / error 空态（错误详情与重试在左侧 OutcomePanel 呈现）。
  return (
    <Card className="flex min-h-72 flex-col items-center justify-center gap-3 border-dashed p-8 text-center">
      <BookMarked className="size-8 text-muted-foreground/60" aria-hidden />
      <h2 className="text-base font-medium">内容配方会出现在这里</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        配方记录这次内容是如何生成的，下次可以换输入重跑。
      </p>
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
        <p className="text-xs font-medium text-muted-foreground">验收结果</p>
        <span
          className={
            verification.overallPassed
              ? "text-xs font-medium text-emerald-600"
              : "text-xs font-medium text-destructive"
          }
        >
          {verification.overallPassed ? "全部通过" : "存在未通过项"}
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
