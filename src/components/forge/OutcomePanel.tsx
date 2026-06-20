import { Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";

// 生成结果区（UIUX §7）。M1 Day 1 仅空态——不接 AI。
export function OutcomePanel() {
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
