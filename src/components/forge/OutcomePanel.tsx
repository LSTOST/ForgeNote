"use client";

import { CircleAlert, RotateCw, Sparkles } from "lucide-react";

import type { ForgeStatus } from "@/components/forge/ForgeWorkbench";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ContentPackage } from "@/lib/ai/types";

interface OutcomePanelProps {
  status: ForgeStatus;
  outcome: ContentPackage | null;
  errorMessage: string | null;
  onRetry: () => void;
}

// 生成结果区（UIUX §7）。I-02B 接入真实生成结果渲染。
export function OutcomePanel({
  status,
  outcome,
  errorMessage,
  onRetry,
}: OutcomePanelProps) {
  if (status === "loading") {
    return (
      <Card className="min-h-72 p-6">
        <p className="mb-4 text-sm text-muted-foreground">正在锻造内容…</p>
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

  if (status === "error") {
    return (
      <Card className="flex min-h-72 flex-col items-center justify-center gap-3 border-destructive/30 p-8 text-center">
        <CircleAlert className="size-8 text-destructive" aria-hidden />
        <h2 className="text-base font-medium">生成失败</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {errorMessage ?? "生成失败，请重试。"}
        </p>
        <Button type="button" variant="outline" onClick={onRetry}>
          <RotateCw className="size-4" aria-hidden />
          重新生成
        </Button>
      </Card>
    );
  }

  if (status === "success" && outcome) {
    return (
      <Card className="min-h-72 space-y-6 p-6">
        <Section title="内容定位">
          <p className="text-sm leading-relaxed text-foreground">
            {outcome.positioning}
          </p>
        </Section>

        <Section title="标题备选">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {outcome.titles.map((title, i) => (
              <li key={i}>{title}</li>
            ))}
          </ul>
        </Section>

        <Section title="小红书正文">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {outcome.body}
          </p>
        </Section>

        <Section title="卡片结构">
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

        <Section title="卡片 Prompt">
          <ol className="space-y-3 text-sm">
            {outcome.cardPrompts.map((card) => (
              <li key={card.index} className="space-y-1">
                <p className="font-medium text-muted-foreground">
                  第 {card.index} 张
                </p>
                <p className="whitespace-pre-wrap leading-relaxed">
                  {card.prompt}
                </p>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="发布话题">
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

        <Section title="评论区引导">
          <p className="text-sm leading-relaxed text-foreground">
            {outcome.commentGuide}
          </p>
        </Section>
      </Card>
    );
  }

  // idle 空态。
  return (
    <Card className="flex min-h-72 flex-col items-center justify-center gap-3 border-dashed p-8 text-center">
      <Sparkles className="size-8 text-muted-foreground/60" aria-hidden />
      <h2 className="text-base font-medium">生成结果会出现在这里</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        输入想法并点击“开始锻造”后，将生成标题、正文、卡片 Prompt 和话题。
      </p>
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
