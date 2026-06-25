"use client";

import { ArrowRight, LoaderCircle, Paperclip } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { copy } from "@/lib/copy";
import {
  IDEA_PLACEHOLDER,
  MAX_ACCOUNT_POST_CHARS,
  MAX_INPUT_CHARS,
} from "@/lib/constants";

interface IdeaInputProps {
  value: string;
  onChange: (value: string) => void;
  accountPost: string;
  onAccountPostChange: (value: string) => void;
  onForge: () => void;
  savedAt: string | null;
  /** 生成中：按钮禁用并显示加载态（UIUX §5.3）。 */
  pending?: boolean;
}

export function IdeaInput({
  value,
  onChange,
  accountPost,
  onAccountPostChange,
  onForge,
  savedAt,
  pending = false,
}: IdeaInputProps) {
  const [accountPostOpen, setAccountPostOpen] = useState(
    accountPost.trim().length > 0,
  );
  const charCount = value.length;
  const accountPostCount = accountPost.length;
  const isEmpty = value.trim().length === 0;
  const isTooLong = charCount > MAX_INPUT_CHARS;
  const accountPostTooLong = accountPostCount > MAX_ACCOUNT_POST_CHARS;
  const canForge = !isEmpty && !isTooLong && !accountPostTooLong && !pending;

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.metaKey || event.ctrlKey) {
      return;
    }
    if (!canForge) return;
    event.preventDefault();
    onForge();
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {copy.idea.kicker}
        </p>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {copy.idea.title}
        </h1>
      </div>

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={IDEA_PLACEHOLDER}
        rows={6}
        aria-label={copy.idea.inputAria}
        aria-invalid={isTooLong}
        disabled={pending}
        onKeyDown={handleKeyDown}
        className="min-h-48 resize-y border-stone-300 bg-white/85 px-4 py-4 text-[1.05rem] leading-7 shadow-sm placeholder:text-stone-400 focus-visible:border-stone-500 focus-visible:ring-stone-300/60"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-5 text-sm text-muted-foreground">
          {isTooLong && (
            <p className="text-destructive">
              {copy.idea.tooLong.replace("{max}", String(MAX_INPUT_CHARS))}
            </p>
          )}
          {!isTooLong && savedAt && (
            <p>{copy.idea.savedAt.replace("{time}", savedAt)}</p>
          )}
        </div>

        <Button type="button" disabled={!canForge} onClick={onForge}>
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <ArrowRight className="size-4" aria-hidden />
          )}
          {pending ? copy.idea.forging : copy.idea.forge}
        </Button>
      </div>

      <div className="border-t border-stone-200 pt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setAccountPostOpen((open) => !open)}
          aria-expanded={accountPostOpen}
          className="px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
        >
          <Paperclip className="size-4" aria-hidden />
          {copy.idea.accountPostToggle}
        </Button>
        {accountPostOpen && (
          <div className="mt-3 space-y-2">
            <Textarea
              value={accountPost}
              onChange={(e) => onAccountPostChange(e.target.value)}
              placeholder={copy.idea.accountPostPlaceholder}
              rows={5}
              aria-label={copy.idea.accountPostAria}
              aria-invalid={accountPostTooLong}
              disabled={pending}
              className="min-h-32 resize-y border-stone-300 bg-white/75 text-sm leading-6 shadow-sm placeholder:text-stone-400 focus-visible:border-stone-500 focus-visible:ring-stone-300/60"
            />
            {accountPostTooLong && (
              <p className="text-sm text-destructive">
                {copy.idea.accountPostTooLong.replace(
                  "{max}",
                  String(MAX_ACCOUNT_POST_CHARS),
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
