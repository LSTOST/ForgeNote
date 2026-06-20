import { BookMarked } from "lucide-react";

import { Card } from "@/components/ui/card";

// 内容配方区（UIUX §8）。M1 Day 1 仅空态。
export function RecipePanel() {
  return (
    <Card className="flex min-h-72 flex-col items-center justify-center gap-3 border-dashed p-8 text-center">
      <BookMarked className="size-8 text-muted-foreground/60" aria-hidden />
      <h2 className="text-base font-medium">内容配方会出现在这里</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        配方记录这次内容是如何生成的，下次可以换输入重跑。
      </p>
    </Card>
  );
}
