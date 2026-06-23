import { Lock } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * 工作台终态示意（低保真 · 仅一张参照 · 不可交互）。
 * 左=账号与内容资产，中=当前内容任务与内容包，右=假设条/配方/生成控制，
 * 底=历史版本与表现回填。标注「随用户积累逐块显形」。
 */

function Placeholder({ widths }: { widths: string[] }) {
  return (
    <div className="space-y-1.5">
      {widths.map((w, i) => (
        <div key={i} className={cn("h-2 rounded-full bg-muted-foreground/15", w)} />
      ))}
    </div>
  );
}

function Region({
  label,
  status,
  children,
  className,
}: {
  label: string;
  status: "now" | "later";
  children: React.ReactNode;
  className?: string;
}) {
  const isNow = status === "now";
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        isNow
          ? "border-foreground/30 bg-card"
          : "border-dashed border-border bg-muted/30",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-[11px] font-medium",
            isNow ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
        {isNow ? (
          <span className="rounded-full bg-foreground px-1.5 py-0.5 text-[9px] font-medium text-background">
            现在用得到
          </span>
        ) : (
          <span className="inline-flex items-center gap-0.5 rounded-full border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground">
            <Lock className="size-2.5" aria-hidden />
            随积累显形
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export function WorkbenchPreview() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-1">
        <h3 className="text-sm font-medium text-foreground">
          这只是起点，工作台会随你用得越多越满
        </h3>
        <span className="text-[11px] text-muted-foreground">
          示意 · 各区随你积累内容与表现逐块显形，不是一上来就满载
        </span>
      </div>

      {/* 终态四区布局：左 / 中 / 右 + 底 */}
      <div className="grid grid-cols-12 gap-2">
        {/* 左：账号与内容资产 */}
        <Region
          label="账号与内容资产"
          status="later"
          className="col-span-3 flex flex-col gap-2"
        >
          <Placeholder widths={["w-full", "w-4/5", "w-3/5"]} />
          <Placeholder widths={["w-full", "w-2/3"]} />
        </Region>

        {/* 中：当前内容任务与内容包（新人唯一要看的） */}
        <Region
          label="当前内容任务与内容包"
          status="now"
          className="col-span-6"
        >
          <div className="space-y-2">
            <div className="h-2.5 w-1/2 rounded-full bg-foreground/25" />
            <Placeholder widths={["w-full", "w-full", "w-4/5"]} />
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="aspect-[3/4] rounded-md border border-border bg-muted/60"
                />
              ))}
            </div>
          </div>
        </Region>

        {/* 右：假设条 / 配方 / 生成控制 */}
        <Region
          label="假设条 · 配方 · 生成控制"
          status="later"
          className="col-span-3 flex flex-col gap-2"
        >
          <Placeholder widths={["w-full", "w-3/4"]} />
          <Placeholder widths={["w-full", "w-2/3", "w-1/2"]} />
        </Region>

        {/* 底：历史版本与表现回填 */}
        <Region
          label="历史版本与表现回填"
          status="later"
          className="col-span-12"
        >
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-8 flex-1 rounded-md border border-border bg-muted/50"
              />
            ))}
          </div>
        </Region>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        第一次来，我们只点亮中间这一块——开始你的第一条内容任务。等你做出第一批内容、
        积累了表现数据，左边的账号资产、右边的配方、底部的历史与回填会自己长出来。
      </p>
    </div>
  );
}
