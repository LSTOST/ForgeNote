"use client";

import { useState } from "react";
import {
  Check,
  CircleAlert,
  Copy,
  FilePlus2,
  LogIn,
  RotateCw,
  Sparkles,
} from "lucide-react";

import type { ForgeStatus } from "@/components/forge/ForgeWorkbench";
import { PerformancePanel } from "@/components/forge/PerformancePanel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { copy as uiCopy } from "@/lib/copy";
import type { ContentPackage, Verification } from "@/lib/ai/types";

const c = uiCopy.outcome;

interface OutcomePanelProps {
  status: ForgeStatus;
  outcome: ContentPackage | null;
  errorMessage: string | null;
  /** AUTH_REQUIRED：展示「需要登录」态，不跳转登录页（登录页未实现）。 */
  authRequired?: boolean;
  /** 成功落库后的 sessionId（Batch A）。 */
  sessionId?: string | null;
  /** I-16：本次生成的目标输出语言 / 表达偏好（无则不展示）。 */
  outputLocale?: string | null;
  /** I-22：发布前检查项，成功态在主结果区展示。 */
  verification?: Verification | null;
  onRetry: () => void;
  /** 新建：清空当前 session 回到空态（UIUX §7.5）。 */
  onNew: () => void;
}

/** 将整包内容拼为 UIUX §7.3 的全文（复制全文用）。 */
function buildFullText(o: ContentPackage): string {
  const lines: string[] = [];
  lines.push(`# ${c.positioning}`, o.positioning, "");
  lines.push(`# ${c.titles}`, ...o.titles.map((t) => `- ${t}`), "");
  lines.push(`# ${c.body}`, o.body, "");
  lines.push(
    `# ${c.cardPrompts}`,
    ...o.cardPrompts.map((card) => formatCardCopy(o, card.index)),
    "",
  );
  lines.push(
    `# ${c.visualDirections}`,
    ...o.cardPrompts.map((card) => formatVisualDirection(card.index, card.visualDirection ?? card.prompt)),
    "",
  );
  lines.push(`# ${c.hashtags}`, o.hashtags.map((t) => `#${t}`).join(" "), "");
  lines.push(`# ${c.commentGuide}`, o.commentGuide);
  return lines.join("\n");
}

// 生成结果区（UIUX §7）。I-02B 接入真实结果渲染；Batch A 加登录态/sessionId；Batch C 加复制操作区与新建。
export function OutcomePanel({
  status,
  outcome,
  errorMessage,
  authRequired = false,
  sessionId = null,
  outputLocale = null,
  verification = null,
  onRetry,
  onNew,
}: OutcomePanelProps) {
  // 轻量复制反馈（不引 toast 库）：记录最近复制的按钮 key，短暂显示「已复制」。
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
    } catch {
      // 复制失败（如无剪贴板权限）静默忽略，不打断主流程。
    }
  }
  if (status === "loading") {
    return (
      <Card className="min-h-72 p-6">
        <p className="mb-4 text-sm text-muted-foreground">{c.loading}</p>
        <div className="space-y-3" aria-hidden>
          <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-24 w-full animate-pulse rounded bg-muted" />
        </div>
      </Card>
    );
  }

  if (status === "error" && authRequired) {
    // 需要登录态：不跳转登录页（登录页未实现），仅提示。
    return (
      <Card className="flex min-h-72 flex-col items-center justify-center gap-3 border-dashed p-8 text-center">
        <LogIn className="size-8 text-muted-foreground/70" aria-hidden />
        <h2 className="text-base font-medium">{c.authRequiredTitle}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {errorMessage ?? c.authRequiredBody}
        </p>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card className="flex min-h-72 flex-col items-center justify-center gap-3 border-destructive/30 p-8 text-center">
        <CircleAlert className="size-8 text-destructive" aria-hidden />
        <h2 className="text-base font-medium">{c.failTitle}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {errorMessage ?? c.failBody}
        </p>
        <Button type="button" variant="outline" onClick={onRetry}>
          <RotateCw className="size-4" aria-hidden />
          {c.regenerate}
        </Button>
      </Card>
    );
  }

  if (status === "success" && outcome) {
    const copyLabel = (key: string, base: string) =>
      copiedKey === key ? uiCopy.common.copied : base;
    const copyIcon = (key: string) =>
      copiedKey === key ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      );

    return (
      <Card className="min-h-72 space-y-6 p-6">
        {/* 操作区（UIUX §7.5）。 */}
        <div className="flex flex-wrap gap-2 border-b pb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => copy("all", buildFullText(outcome))}
          >
            {copyIcon("all")}
            {copyLabel("all", c.copyAll)}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => copy("body", outcome.body)}
          >
            {copyIcon("body")}
            {copyLabel("body", c.copyBody)}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              copy(
                "prompts",
                outcome.cardPrompts.map((card) => formatCardCopy(outcome, card.index)).join("\n\n"),
              )
            }
          >
            {copyIcon("prompts")}
            {copyLabel("prompts", c.copyPrompts)}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              copy("tags", outcome.hashtags.map((t) => `#${t}`).join(" "))
            }
          >
            {copyIcon("tags")}
            {copyLabel("tags", c.copyTags)}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            <RotateCw className="size-3.5" aria-hidden />
            {c.regenerate}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onNew}>
            <FilePlus2 className="size-3.5" aria-hidden />
            {c.new}
          </Button>
        </div>

        <Section title={c.positioning}>
          <p className="text-sm leading-relaxed text-foreground">
            {outcome.positioning}
          </p>
        </Section>

        <Section title={c.titles}>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {outcome.titles.map((title, i) => (
              <li key={i}>{title}</li>
            ))}
          </ul>
        </Section>

        <Section title={c.body}>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {outcome.body}
          </p>
        </Section>

        <Section title={c.cardPrompts}>
          <ol className="space-y-3 text-sm">
            {outcome.cardPrompts.map((card) => (
              <li key={card.index} className="space-y-1.5 border-b border-border/60 pb-3 last:border-0 last:pb-0">
                <p className="font-medium text-foreground">
                  {c.cardNo.replace("{n}", String(card.index))}
                  {getCardTitle(outcome, card.index) ? `：${getCardTitle(outcome, card.index)}` : ""}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed">
                  {card.body ?? card.prompt}
                </p>
              </li>
            ))}
          </ol>
        </Section>

        <Section title={c.visualDirections}>
          <ol className="space-y-2 text-sm">
            {outcome.cardPrompts.map((card) => (
              <li key={card.index} className="flex gap-2">
                <span className="shrink-0 text-muted-foreground">
                  {c.cardNo.replace("{n}", String(card.index))}
                </span>
                <span className="leading-relaxed">
                  {card.visualDirection ?? card.prompt}
                </span>
              </li>
            ))}
          </ol>
        </Section>

        {verification && (
          <Section title={c.publishChecklist}>
            <ul className="space-y-1.5 text-sm">
              {verification.checks.map((check) => (
                <li key={check.key} className="flex items-start gap-2">
                  {check.passed ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                  ) : (
                    <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
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
          </Section>
        )}

        <Section title={c.hashtags}>
          <div className="flex flex-wrap gap-2">
            {outcome.hashtags.map((tag, i) => (
              <span
                key={i}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        </Section>

        <Section title={c.commentGuide}>
          <p className="text-sm leading-relaxed text-foreground">
            {outcome.commentGuide}
          </p>
        </Section>

        {(sessionId || outputLocale) && (
          <div className="space-y-1 border-t pt-3 text-xs text-muted-foreground/70">
            {sessionId && (
              <p>
                {c.sessionLabel}<span className="font-mono">{sessionId}</span>
              </p>
            )}
            {outputLocale && (
              <p>
                {c.localeLabel}<span className="font-medium">{outputLocale}</span>
              </p>
            )}
          </div>
        )}

        {/* I-12：F-16 表现回填 lite（仅成功且已落库 session 时可记录）。 */}
        {sessionId && <PerformancePanel sessionId={sessionId} />}
      </Card>
    );
  }

  // idle 空态。
  return (
    <Card className="flex min-h-72 flex-col items-center justify-center gap-3 border-dashed p-8 text-center">
      <Sparkles className="size-8 text-muted-foreground/60" aria-hidden />
      <h2 className="text-base font-medium">{c.emptyTitle}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{c.emptyBody}</p>
    </Card>
  );
}

function getCardTitle(outcome: ContentPackage, index: number): string {
  return outcome.cardStructure.find((card) => card.index === index)?.title ?? "";
}

function formatCardCopy(outcome: ContentPackage, index: number): string {
  const card = outcome.cardPrompts.find((item) => item.index === index);
  if (!card) return "";
  const title = getCardTitle(outcome, index);
  const label = c.cardNoBracket.replace("{n}", String(index));
  const body = card.body ?? card.prompt;
  return [title ? `${label} ${title}` : label, body].join("\n");
}

function formatVisualDirection(index: number, text: string): string {
  return `${c.cardNoBracket.replace("{n}", String(index))}\n${text}`;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      {children}
    </section>
  );
}
