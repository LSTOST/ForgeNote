"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MAX_INPUT_CHARS } from "@/lib/constants";

interface RecipeRerunProps {
  recipeId: string;
}

type RerunState = "idle" | "running" | "error";

// 换输入重跑（I-10）。沿用当前配方对新输入重新生成一个 session，
// 成功后跳到 /forge?session=<新 sessionId> 查看结果（复用现有 session 读取模式）。
export function RecipeRerun({ recipeId }: RecipeRerunProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [state, setState] = useState<RerunState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const trimmedLength = input.trim().length;
  const overLimit = input.length > MAX_INPUT_CHARS;
  const canSubmit = trimmedLength > 0 && !overLimit && state !== "running";

  async function rerun() {
    if (!canSubmit) return;
    setState("running");
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/recipes/${recipeId}/rerun`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput: input }),
      });
      const json = await res.json().catch(() => null);

      if (json?.ok && json.data?.sessionId) {
        // 成功：把用户带到能看到新生成结果的位置（复用 /forge 的 session 读取）。
        router.push(`/forge?session=${json.data.sessionId}`);
        return;
      }

      setErrorMessage(json?.error?.message ?? "重跑失败，请重试");
      setState("error");
    } catch {
      setErrorMessage("网络异常，请稍后重试");
      setState("error");
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label
          htmlFor="rerun-input"
          className="text-sm font-medium text-foreground"
        >
          换输入重跑
        </label>
        <p className="text-sm text-muted-foreground">
          沿用本配方，输入一个新主题，生成一个新的结果。原配方不会被改动。
        </p>
      </div>

      <textarea
        id="rerun-input"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="写下新的主题，例如：想做一组退租拍照清单的图文卡片"
        rows={5}
        disabled={state === "running"}
        className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={
            overLimit
              ? "text-xs font-medium text-destructive"
              : "text-xs text-muted-foreground"
          }
        >
          {input.length} / {MAX_INPUT_CHARS} 字
          {overLimit ? "（已超出上限）" : ""}
        </span>

        <Button type="button" onClick={rerun} disabled={!canSubmit}>
          <RotateCw className="size-4" aria-hidden />
          {state === "running" ? "重跑中…" : "换输入重跑"}
        </Button>
      </div>

      {state === "error" && errorMessage && (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <CircleAlert className="size-4 shrink-0" aria-hidden />
          {errorMessage}
        </p>
      )}
    </div>
  );
}
