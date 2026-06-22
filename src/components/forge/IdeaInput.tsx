"use client";

import { Hammer, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { copy } from "@/lib/copy";
import { IDEA_PLACEHOLDER, MAX_INPUT_CHARS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface IdeaInputProps {
  value: string;
  onChange: (value: string) => void;
  onForge: () => void;
  /** 生成中：按钮禁用并显示加载态（UIUX §5.3）。 */
  pending?: boolean;
}

export function IdeaInput({ value, onChange, onForge, pending = false }: IdeaInputProps) {
  const charCount = value.length;
  const isEmpty = value.trim().length === 0;
  const isTooLong = charCount > MAX_INPUT_CHARS;
  const canForge = !isEmpty && !isTooLong && !pending;

  return (
    <div className="space-y-3">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={IDEA_PLACEHOLDER}
        rows={6}
        aria-label={copy.idea.inputAria}
        aria-invalid={isTooLong}
        disabled={pending}
        className="resize-y text-base"
      />

      <div className="flex items-center justify-between gap-4">
        <p
          className={cn(
            "text-sm",
            isTooLong ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {isTooLong
            ? copy.idea.tooLong.replace("{max}", String(MAX_INPUT_CHARS))
            : copy.idea.counter
                .replace("{count}", String(charCount))
                .replace("{max}", String(MAX_INPUT_CHARS))}
        </p>

        <Button type="button" disabled={!canForge} onClick={onForge}>
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <Hammer className="size-4" aria-hidden />
          )}
          {pending ? copy.idea.forging : copy.idea.forge}
        </Button>
      </div>
    </div>
  );
}
