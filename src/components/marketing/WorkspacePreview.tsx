// ForgeNote M2-16 — 官网产品展示区（laper「Pulp Fiction 实拍」位，打磨版）。
// 缩微真界面密度：图标栏 / 选题列（5 卡，M2-06 真实来源标签词表）/ 结构区（槽位+策略+稳定性）/ 渲染条。
// 只演示已存在的产品形态；示例全取 Owner 真实账号「独居生活指南」，依据用定性表述、不编数字。

import {
  BadgeCheck,
  BookOpen,
  Copy,
  LayoutGrid,
  Layers,
  PencilLine,
  Radar,
  RefreshCw,
  Settings,
  Zap,
} from "lucide-react";

import { SURFACE_WINDOW } from "./shared";

// M2-06 来源标签词表：账号匹配强 / 近期信号 / 历史有效 / 低证据
const TOPIC_CARDS = [
  {
    tag: "账号匹配强",
    tone: "primary",
    title: "一个人住，厨房先买这 3 类就够了",
    basis: "命中「厨房」章节缺口；清单体是你的强结构",
    active: true,
  },
  {
    tag: "历史有效",
    tone: "ink",
    title: "独居第一年，我停掉的 5 笔固定支出",
    basis: "钱主题历史表现最好；评论区高频追问",
    active: false,
  },
  {
    tag: "近期信号",
    tone: "ink",
    title: "下班回家 20 分钟，一人食不将就",
    basis: "场景类内容配比偏低；近两周同类互动走高",
    active: false,
  },
  {
    tag: "账号匹配强",
    tone: "primary",
    title: "租房改造：100 元内的 5 个幸福感小件",
    basis: "低成本改造是账号强主题；可复用改造前后结构",
    active: false,
  },
  {
    tag: "低证据",
    tone: "muted",
    title: "一个人生病时的自救清单",
    basis: "只有一条历史样本支撑，建议小步试",
    active: false,
  },
];

const SLOTS = [
  { key: "钩子", strategy: "反常识开场", text: "「先别买锅具套装」" },
  { key: "场景", strategy: "第一人称代入", text: "刚搬进来的第一周，预算全砸在了锅上" },
  { key: "清单", strategy: "三分类框架", text: "煮 · 切 · 存，各买一件就够" },
  { key: "案例", strategy: "亲测细节", text: "那口 39 元的雪平锅用了一整年" },
  { key: "收束", strategy: "行动指令", text: "存下这张清单，再逛超市" },
];

const RAIL_ICONS = [
  { icon: LayoutGrid, label: "工作台", active: true },
  { icon: Radar, label: "选题雷达", active: false },
  { icon: Layers, label: "结构", active: false },
  { icon: BookOpen, label: "配方库", active: false },
];

function TagPill({ tag, tone }: { tag: string; tone: string }) {
  const cls =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "muted"
        ? "bg-secondary text-muted-foreground/80"
        : "bg-secondary text-foreground/70";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[10px] leading-4 font-medium ${cls}`}
    >
      <span
        aria-hidden
        className={`size-1 rounded-full ${tone === "primary" ? "bg-primary" : "bg-muted-foreground/50"}`}
      />
      {tag}
    </span>
  );
}

export function WorkspacePreview() {
  return (
    <div className={`overflow-hidden rounded-2xl bg-card ${SURFACE_WINDOW}`}>
      {/* 窗口顶栏 */}
      <div className="flex items-center gap-2 border-b border-border bg-secondary/70 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#E8B3A6]" aria-hidden />
        <span className="size-2.5 rounded-full bg-[#E8D3A0]" aria-hidden />
        <span className="size-2.5 rounded-full bg-[#BFCDA8]" aria-hidden />
        <span className="ml-3 text-[11.5px] font-medium text-muted-foreground">
          ForgeNote 工作台
        </span>
        <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-[10.5px] text-muted-foreground sm:flex">
          <Radar className="size-3 text-primary" aria-hidden />
          本周 · 独居生活指南
        </span>
        <span className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-[9px] font-semibold text-primary">
          独
        </span>
      </div>

      <div className="flex">
        {/* 图标导航栏 */}
        <div className="hidden w-[52px] shrink-0 flex-col items-center gap-1 border-r border-border bg-secondary/50 py-3 lg:flex">
          <span className="mb-2 flex size-7 items-center justify-center rounded-[8px] bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
            <Zap className="size-3.5" aria-hidden strokeWidth={2.2} />
          </span>
          {RAIL_ICONS.map((item) => (
            <span
              key={item.label}
              title={item.label}
              className={`flex size-8 items-center justify-center rounded-[9px] ${
                item.active
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground/60"
              }`}
            >
              <item.icon className="size-4" aria-hidden strokeWidth={1.8} />
            </span>
          ))}
          <span className="mt-auto flex size-8 items-center justify-center rounded-[9px] text-muted-foreground/50">
            <Settings className="size-4" aria-hidden strokeWidth={1.8} />
          </span>
        </div>

        {/* 选题列 */}
        <div className="relative w-full border-b border-border bg-secondary/30 md:w-[288px] md:shrink-0 md:border-r md:border-b-0">
          <div className="flex items-center justify-between px-3.5 pt-3 pb-1.5">
            <p className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground">
              本周选题 · 5 张
            </p>
            <RefreshCw className="size-3 text-muted-foreground/50" aria-hidden />
          </div>
          <ul className="space-y-1.5 px-2.5 pb-3">
            {TOPIC_CARDS.map((card) => (
              <li
                key={card.title}
                className={`rounded-xl border p-2.5 ${
                  card.active
                    ? "border-primary/40 bg-card shadow-[0_1px_2px_rgba(90,60,25,0.06),0_8px_20px_-10px_rgba(150,70,30,0.35),inset_0_1px_0_rgba(255,255,255,0.6)]"
                    : "border-border/80 bg-card/60"
                }`}
              >
                <TagPill tag={card.tag} tone={card.tone} />
                <p
                  className={`mt-1.5 text-[12.5px] leading-snug font-medium ${card.active ? "text-foreground" : "text-foreground/80"}`}
                >
                  {card.title}
                </p>
                <p className="mt-1 text-[10.5px] leading-4 text-muted-foreground/90">
                  依据：{card.basis}
                </p>
              </li>
            ))}
          </ul>
          {/* 底部融边（laper 式 fade mask） */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-10 bg-gradient-to-t from-[#F1EDE3] to-transparent md:block"
          />
        </div>

        {/* 结构区 */}
        <div className="min-w-0 flex-1 p-3.5 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 truncate text-[13px] font-semibold">
              一个人住，厨房先买这 3 类就够了
            </p>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              结构 · 清单体
            </span>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-semibold text-primary">
              <BadgeCheck className="size-3" aria-hidden />
              结构稳定
            </span>
          </div>

          <ul className="mt-3 space-y-1.5">
            {SLOTS.map((slot, i) => (
              <li
                key={slot.key}
                className={`group flex items-center gap-2.5 rounded-xl border px-3 py-2 ${
                  i === 0
                    ? "border-primary/30 bg-background/80"
                    : "border-border/80 bg-background/50"
                }`}
              >
                <span className="mkt-serif w-8 shrink-0 text-[12px] font-semibold text-foreground/85">
                  {slot.key}
                </span>
                <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  {slot.strategy}
                </span>
                <span className="min-w-0 truncate text-[11.5px] text-muted-foreground">
                  {slot.text}
                </span>
                <PencilLine
                  className="ml-auto size-3 shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/60"
                  aria-hidden
                />
              </li>
            ))}
          </ul>

          {/* 稳定性六条件 */}
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-2">
            <p className="text-[11px] font-medium text-foreground/80">
              稳定性判定 6/6 通过
            </p>
            <span className="flex gap-1" aria-hidden>
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="size-1.5 rounded-full bg-primary/70" />
              ))}
            </span>
            <p className="ml-auto text-[10.5px] text-muted-foreground">
              槽位覆盖 · token 合法 · 无待裁决 …
            </p>
          </div>
        </div>
      </div>

      {/* 渲染条 */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border bg-secondary/60 px-3.5 py-2.5 sm:px-4">
        <div className="flex gap-1.5">
          {["小红书", "X thread", "图片 Prompt"].map((target, i) => (
            <span
              key={target}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                i === 0
                  ? "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
                  : "border border-border bg-card text-muted-foreground"
              }`}
            >
              {target}
            </span>
          ))}
        </div>
        <p className="hidden min-w-0 flex-1 truncate text-[11px] text-muted-foreground sm:block">
          ① 先别买锅具套装｜一个人住的厨房，其实只需要这 3 类东西……
        </p>
        <span className="ml-auto inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-[10.5px] font-medium text-foreground/80">
          <Copy className="size-3" aria-hidden />
          复制
        </span>
      </div>
    </div>
  );
}
