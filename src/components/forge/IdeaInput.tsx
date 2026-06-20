"use client";

import { Hammer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IDEA_PLACEHOLDER, MAX_INPUT_CHARS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface IdeaInputProps {
  value: string;
  onChange: (value: string) => void;
  onForge: () => void;
}

export function IdeaInput({ value, onChange, onForge }: IdeaInputProps) {
  const charCount = value.length;
  const isEmpty = value.trim().length === 0;
  const isTooLong = charCount > MAX_INPUT_CHARS;
  const canForge = !isEmpty && !isTooLong;

  return (
    <div className="space-y-3">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={IDEA_PLACEHOLDER}
        rows={6}
        aria-label="想法输入"
        aria-invalid={isTooLong}
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
            ? `已超过 ${MAX_INPUT_CHARS} 字，请精简后再锻造`
            : `${charCount} / ${MAX_INPUT_CHARS}`}
        </p>

        <Button type="button" disabled={!canForge} onClick={onForge}>
          <Hammer className="size-4" aria-hidden />
          开始锻造
        </Button>
      </div>
    </div>
  );
}
