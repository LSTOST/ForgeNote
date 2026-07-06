"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import { MAX_INPUT_CHARS, MAX_OUTPUT_LOCALE_CHARS } from "@/lib/constants";

const c = copy.recipeDetail;

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
        // 成功：/forge 已删（M2-04），带用户到 v3 工作台。注：session 结果展示是旧 /forge 能力，
        // /workspace 不消费 session；M1 recipe 重跑流的结果回看待 v3 化（或随 /recipes 退役）。
        router.push("/workspace");
        return;
      }

      setErrorMessage(json?.error?.message ?? c.rerunFailed);
      setState("error");
    } catch {
      setErrorMessage(copy.common.networkError);
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
          {c.rerunTitle}
        </label>
        <p className="text-sm text-muted-foreground">{c.rerunDescription}</p>
      </div>

      <textarea
        id="rerun-input"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder={c.rerunPlaceholder}
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
          {copy.forge.outputLocaleLabel}
          <span className="ml-1 font-normal text-muted-foreground">
            {copy.common.optionalSuffix}
          </span>
        </label>
        <input
          id="rerun-output-locale"
          type="text"
          value={outputLocale}
          onChange={(event) => setOutputLocale(event.target.value)}
          placeholder={copy.forge.outputLocalePlaceholder}
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
          {c.charCounter
            .replace("{count}", String(input.length))
            .replace("{max}", String(MAX_INPUT_CHARS))}
          {overLimit ? c.overLimitSuffix : ""}
        </span>

        <Button type="button" onClick={rerun} disabled={!canSubmit}>
          <RotateCw className="size-4" aria-hidden />
          {state === "running" ? c.rerunning : c.rerunButton}
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
