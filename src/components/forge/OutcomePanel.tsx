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
import type { ContentPackage } from "@/lib/ai/types";

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
    `# ${c.cardStructure}`,
    ...o.cardStructure.map((card) => `${card.index}. [${card.type}] ${card.title}`),
    "",
  );
  lines.push(
    `# ${c.cardPrompts}`,
    ...o.cardPrompts.map(
      (card) => `${c.cardNoBracket.replace("{n}", String(card.index))}\n${card.prompt}`,
    ),
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
        {sessionId && (
          <p className="text-xs text-muted-foreground/70">
            {c.sessionLabel}<span className="font-mono">{sessionId}</span>
          </p>
        )}
        {outputLocale && (
          <p className="text-xs text-muted-foreground/70">
            {c.localeLabel}<span className="font-medium">{outputLocale}</span>
          </p>
        )}

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
                outcome.cardPrompts
                  .map(
                    (card) =>
                      `${c.cardNoBracket.replace("{n}", String(card.index))}\n${card.prompt}`,
                  )
                  .join("\n\n"),
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

        <Section title={c.cardStructure}>
          <ol className="space-y-1 text-sm">
            {outcome.cardStructure.map((card) => (
              <li key={card.index} className="flex gap-2">
                <span className="text-muted-foreground">#{card.index}</span>
                <span className="text-muted-foreground">[{card.type}]</span>
                <span className="whitespace-pre-wrap">{card.title}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title={c.cardPrompts}>
          <ol className="space-y-3 text-sm">
            {outcome.cardPrompts.map((card) => (
              <li key={card.index} className="space-y-1">
                <p className="font-medium text-muted-foreground">
                  {c.cardNo.replace("{n}", String(card.index))}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed">
                  {card.prompt}
                </p>
              </li>
            ))}
          </ol>
        </Section>

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
