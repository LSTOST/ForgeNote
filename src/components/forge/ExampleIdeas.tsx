"use client";

import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import { EXAMPLE_IDEAS } from "@/lib/constants";

interface ExampleIdeasProps {
  /** 点击示例后填入输入框（不自动生成，UIUX §5.4）。 */
  onPick: (idea: string) => void;
}

export function ExampleIdeas({ onPick }: ExampleIdeasProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{copy.idea.examplesHint}</p>
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_IDEAS.map((idea) => (
          <Button
            key={idea}
            type="button"
            variant="outline"
            size="sm"
            className="h-auto whitespace-normal py-1.5 text-left font-normal"
            onClick={() => onPick(idea)}
          >
            {idea}
          </Button>
        ))}
      </div>
    </div>
  );
}
