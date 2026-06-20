"use client";

import { useState } from "react";

import { ExampleIdeas } from "@/components/forge/ExampleIdeas";
import { IdeaInput } from "@/components/forge/IdeaInput";
import { OutcomePanel } from "@/components/forge/OutcomePanel";
import { RecipePanel } from "@/components/forge/RecipePanel";

export function ForgeWorkbench() {
  const [idea, setIdea] = useState("");

  function handleForge() {
    // M1 Day 1：暂不接 AI，先打印输入内容验证交互链路。
    console.log("[forge] rawInput:", idea);
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <IdeaInput value={idea} onChange={setIdea} onForge={handleForge} />
        <ExampleIdeas onPick={setIdea} />
      </section>

      {/* 桌面端左右布局，移动端上下堆叠（UIUX §5.1 / §5.2）。 */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OutcomePanel />
        <RecipePanel />
      </section>
    </div>
  );
}
