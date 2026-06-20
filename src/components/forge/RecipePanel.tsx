"use client";

import { BookMarked, CircleAlert, CircleCheck } from "lucide-react";

import type { ForgeStatus } from "@/components/forge/ForgeWorkbench";
import { Card } from "@/components/ui/card";
import type { RecipeDraft, Verification } from "@/lib/ai/types";

interface RecipePanelProps {
  status: ForgeStatus;
  recipe: RecipeDraft | null;
  verification: Verification | null;
}

// 内容配方区（UIUX §8）。I-02B 渲染真实配方 + 验收结果。
export function RecipePanel({ status, recipe, verification }: RecipePanelProps) {
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
