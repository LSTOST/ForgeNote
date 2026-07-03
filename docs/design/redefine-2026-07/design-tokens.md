# ForgeNote 文字创作工作台 · Design Tokens（Owner 定稿，2026-07-02）

> 来源：Owner 直接给出，作为后续所有设计的一致性基准。
> 核心原则：**纸感底 + 极克制 UI + 橙色只做语义强调，不做界面装饰。**
> 一句话定位：**ForgeNote 的视觉不是工具软件，而是"一张可以执行 AI 生成的编辑纸"。**

## 1. 基础色板（Foundation）

### 背景系统（Paper Layer）——工作台的"纸感空间层级"

| Token | 值 | 用途 |
|---|---|---|
| `bg-paper-0` | `#F6F1E8` | 默认背景 |
| `bg-paper-1` | `#F3EBDD` | 卡片/编辑区主底 |
| `bg-paper-2` | `#EFE3D3` | 浮层/hover 背景 |
| `bg-paper-inset` | `#E9DDC9` | 内嵌区域/分栏底 |

### 文字系统（Ink Layer）

| Token | 值 |
|---|---|
| `text-primary` | `#2B2B2B`（正文，深炭黑） |
| `text-secondary` | `#6B6B6B`（说明） |
| `text-tertiary` | `#9A9A9A`（辅助信息） |
| `text-disabled` | `#C2C2C2` |

### 强调色（Accent / Hermes Orange）

| Token | 值 |
|---|---|
| `accent-strong` | `#E86A2F`（核心强调） |
| `accent-soft` | `#F3A07A`（弱提示/hover） |
| `accent-ghost` | `#FBE7DE`（浅背景标记） |
| `accent-border` | `#E07A3A`（边框状态） |

**规则：只能在"语义动作"上使用橙色**——关键改动、当前任务、风险提示、选中状态。

## 2. 线框与边界（Stroke System）

`border-default: #D8C9B6` · `border-soft: #E7D9C6` · `border-focus: #E86A2F` · `border-subtle: rgba(0,0,0,0.06)`

## 3. 阴影（极弱，不做"UI 感"）

全部必须"像纸张叠层"，禁止电商卡片阴影。

`shadow-0: none` · `shadow-1: 0 1px 0 rgba(0,0,0,0.03)` · `shadow-2: 0 2px 6px rgba(0,0,0,0.05)`（仅浮层） · `shadow-inset: inset 0 1px 0 rgba(0,0,0,0.04)`

## 4. 圆角（决定"写作感"）

`radius-xs: 4px`（标签） · `radius-sm: 8px`（按钮） · `radius-md: 12px`（卡片） · `radius-lg: 16px`（主编辑区） · `radius-xl: 20px`（大面板）

**禁止锐角 + 禁止过圆**（避免 Notion + iOS 混合风）。

## 5. 字体系统（内容创作导向）

- 中文主字体：`"PingFang SC", "Noto Sans CJK SC"`
- 标题：weight 600–700，letter-spacing -0.02em
- 正文：weight 400–500，line-height 1.6–1.8（必须偏宽松）

## 6. UI 语义组件规则

**Button · Primary（唯一主按钮）**：bg `#E86A2F` / text `#FFFFFF` / hover `#D85F24`。
用途：生成内容、确认发布、应用结构。

**Button · Secondary**：bg `#F3EBDD` / border `#D8C9B6` / text `#2B2B2B`。

**Button · Ghost（编辑型）**：bg transparent / hover `#EFE3D3` / text `#6B6B6B`。

**Input**：bg `#F6F1E8` / border `#E7D9C6` / focus border `#E86A2F` / placeholder `#9A9A9A`。

**Card**：bg `#F3EBDD` / border `#E7D9C6` / padding 24px / radius 12px / hover: slight lift + `#EFE3D3`。

**Editor（核心工作区）**：bg `#F6F1E8` / **max-width 720–860px（关键）** / padding 48px（"纸张留白感"）。

## 7. 状态系统（Task / Writing Flow，只用于任务流）

`state-idle: #B8B0A2` · `state-writing: #6B6B6B` · `state-active: #E86A2F` · `state-done: #3C3C3C` · `state-warning: #C96A2B`

## 8. 关键设计约束（比颜色更重要）

**❌ 禁止**：大面积橙色背景 · 强渐变 · 卡片阴影过重 · 蓝色/科技感高饱和 UI · 多种强调色共存

**✅ 必须**：橙色 ≤ 3% 视觉占比 · 页面看起来"像纸 + 编辑器" · UI 弱化、文字优先级最高 · 所有交互都"像写作动作"，不是"操作系统"

---

## 附：暗色变体（Claude Code 提案，待 Owner 确认）

工作台右上角支持深浅切换。暗色版沿用"纸感"逻辑（暖炭纸，不是科技黑），橙色规则不变：

| Token | 暗色值 |
|---|---|
| `bg-paper-0` | `#211D16` |
| `bg-paper-1` | `#282318` |
| `bg-paper-2` | `#2F2A1E` |
| `bg-paper-inset` | `#1B1811` |
| `text-primary` | `#EDE6D9` |
| `text-secondary` | `#A89F8F` |
| `text-tertiary` | `#7A7263` |
| `border-default` | `#3E382B` |
| `border-soft` | `#332E22` |
| `accent-ghost`（暗） | `rgba(232,106,47,0.14)` |

`accent-strong / soft / border` 与状态色在两种模式下保持同值。
