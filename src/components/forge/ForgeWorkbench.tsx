"use client";

import { useState } from "react";

import { ExampleIdeas } from "@/components/forge/ExampleIdeas";
import { IdeaInput } from "@/components/forge/IdeaInput";
import { OutcomePanel } from "@/components/forge/OutcomePanel";
import { RecipePanel } from "@/components/forge/RecipePanel";
import type {
  Assumption,
  ContentPackage,
  Question,
  RecipeDraft,
  Verification,
} from "@/lib/ai/types";

/** /api/forge 成功响应中的 data（与 route handler 输出对齐）。 */
export interface ForgeData {
  intentType: string;
  assumptions: Assumption[];
  questions: Question[];
  outcome: ContentPackage;
  recipe: RecipeDraft;
  verification: Verification;
}

export type ForgeStatus = "idle" | "loading" | "success" | "error";

export function ForgeWorkbench() {
  const [idea, setIdea] = useState("");
  const [status, setStatus] = useState<ForgeStatus>("idle");
  const [data, setData] = useState<ForgeData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function runForge() {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput: idea }),
      });
      const json = await res.json();

      if (json?.ok) {
        setData(json.data as ForgeData);
        setStatus("success");
      } else {
        // 失败时保留用户输入（idea 不清空），展示错误并允许重试（UIUX §7.4 / D-04）。
        setErrorMessage(json?.error?.message ?? "生成失败，请重试");
        setStatus("error");
      }
    } catch {
      setErrorMessage("网络异常，请稍后重试");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <IdeaInput
          value={idea}
          onChange={setIdea}
          onForge={runForge}
          pending={status === "loading"}
        />
        {status !== "loading" && <ExampleIdeas onPick={setIdea} />}
      </section>

      {/* 桌面端左右布局，移动端上下堆叠（UIUX §5.1 / §5.2）。 */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OutcomePanel
          status={status}
          outcome={data?.outcome ?? null}
          errorMessage={errorMessage}
          onRetry={runForge}
        />
        <RecipePanel
          status={status}
          recipe={data?.recipe ?? null}
          verification={data?.verification ?? null}
        />
      </section>
    </div>
  );
}
