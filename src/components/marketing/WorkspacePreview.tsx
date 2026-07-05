// ForgeNote M2-16 — 官网产品展示区（laper「Pulp Fiction 实拍」位）。
// 静态插画式 mock：左=本周选题卡（带依据，M2-06 真实形态），右=结构槽位 + 稳定性 + 渲染目标（M2-07/08 真实形态）。
// 只演示已存在的产品形态，不伪造数据面板。示例取 Owner 真实账号「独居生活指南」场景。

import { BadgeCheck, CircleCheck, Radar, SlidersHorizontal } from "lucide-react";

const TOPIC_CARDS = [
  {
    title: "一个人住，厨房先买这 3 类就够了",
    reasons: ["命中账号章节缺口", "同类结构近期表现强"],
    active: true,
  },
  {
    title: "独居第一年，我停掉的 5 笔固定支出",
    reasons: ["账号强主题 · 钱", "评论区高频追问"],
    active: false,
  },
  {
    title: "下班回家 20 分钟，一人食不将就",
    reasons: ["补场景类内容配比"],
    active: false,
  },
];

const SLOTS = [
  { key: "钩子", strategy: "反常识开场", text: "「先别买锅具套装」" },
  { key: "场景", strategy: "第一人称代入", text: "刚搬进来的第一周…" },
  { key: "清单", strategy: "三分类收纳", text: "煮 / 切 / 存，各一件" },
  { key: "收束", strategy: "行动指令", text: "存下这张清单再逛超市" },
];

export function WorkspacePreview() {
  return (
    <div className="overflow-hidden rounded-[20px] border border-border bg-card shadow-[0_24px_60px_-30px_rgba(80,50,20,0.4)]">
      {/* 窗口顶栏 */}
      <div className="flex items-center gap-2 border-b border-border bg-secondary/70 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-border" aria-hidden />
        <span className="size-2.5 rounded-full bg-border" aria-hidden />
        <span className="size-2.5 rounded-full bg-border" aria-hidden />
        <span className="ml-2 text-[12px] text-muted-foreground">
          ForgeNote 工作台 · 独居生活指南
        </span>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        {/* 左：本周选题卡 */}
        <div className="border-b border-border bg-secondary/40 p-4 lg:border-r lg:border-b-0">
          <p className="flex items-center gap-1.5 px-1 text-[12.5px] font-semibold tracking-wide text-muted-foreground">
            <Radar className="size-3.5 text-primary" aria-hidden />
            本周选题 · 每张带依据
          </p>
          <ul className="mt-3 space-y-2.5">
            {TOPIC_CARDS.map((card) => (
              <li
                key={card.title}
                className={`rounded-[14px] border p-3.5 ${
                  card.active
                    ? "border-primary/50 bg-card shadow-[0_8px_24px_-14px_rgba(150,70,30,0.45)]"
                    : "border-border bg-card/70"
                }`}
              >
                <p className="text-[14px] leading-snug font-medium text-foreground">
                  {card.title}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {card.reasons.map((reason) => (
                    <span
                      key={reason}
                      className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[11.5px] text-muted-foreground"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* 右：结构槽位 + 稳定性 + 渲染目标 */}
        <div className="p-4 sm:p-5">
          <p className="flex items-center gap-1.5 px-1 text-[12.5px] font-semibold tracking-wide text-muted-foreground">
            <SlidersHorizontal className="size-3.5 text-primary" aria-hidden />
            结构 · 槽位可改，策略可换
          </p>
          <ul className="mt-3 space-y-2">
            {SLOTS.map((slot) => (
              <li
                key={slot.key}
                className="flex items-center gap-3 rounded-[12px] border border-border bg-background/60 px-3.5 py-2.5"
              >
                <span className="w-10 shrink-0 font-serif text-[13.5px] font-semibold text-foreground">
                  {slot.key}
                </span>
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11.5px] font-medium text-primary">
                  {slot.strategy}
                </span>
                <span className="truncate text-[13px] text-muted-foreground">
                  {slot.text}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-border bg-secondary/50 px-3.5 py-2.5">
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
              <BadgeCheck className="size-4 text-primary" aria-hidden />
              结构稳定 · 可以渲染
            </p>
            <div className="flex gap-1.5">
              {["小红书", "X thread", "图片 Prompt"].map((target, i) => (
                <span
                  key={target}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium ${
                    i === 0
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-muted-foreground"
                  }`}
                >
                  {i === 0 && <CircleCheck className="size-3" aria-hidden />}
                  {target}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
