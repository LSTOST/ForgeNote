"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MAX_INPUT_CHARS, MAX_OUTPUT_LOCALE_CHARS } from "@/lib/constants";

interface RecipeRerunProps {
  recipeId: string;
}

type RerunState = "idle" | "running" | "error";

// 换输入重跑（I-10）。沿用当前配方对新输入重新生成一个 session，
// 成功后跳到 /forge?session=<新 sessionId> 查看结果（复用现有 session 读取模式）。
export function RecipeRerun({ recipeId }: RecipeRerunProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  // I-16：可选输出语言 / 表达偏好；不从 recipe 自动带，由本次重跑显式输入。
  const [outputLocale, setOutputLocale] = useState("");
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
        body: JSON.stringify({
          rawInput: input,
          // I-16：空串视为不指定（null）；不传也兼容旧 rerun。
          outputLocale: outputLocale.trim() || null,
        }),
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

      {/* I-16：可选输出语言 / 表达偏好（自由文本，非下拉枚举；空值即不指定）。 */}
      <div className="space-y-1.5">
        <label
          htmlFor="rerun-output-locale"
          className="text-sm font-medium text-foreground"
        >
          输出语言 / 表达偏好
          <span className="ml-1 font-normal text-muted-foreground">（可选）</span>
        </label>
        <input
          id="rerun-output-locale"
          type="text"
          value={outputLocale}
          onChange={(event) => setOutputLocale(event.target.value)}
          placeholder="例如：zh-Hans、en-US、English for Instagram carousel"
          maxLength={MAX_OUTPUT_LOCALE_CHARS}
          disabled={state === "running"}
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
        />
      </div>

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
