# ForgeNote 文字创作工作台 · Design Tokens（Owner 定稿，2026-07-02）

> 来源：Owner 直接给出，作为后续所有设计的一致性基准。
> 核心原则：**纸感底 + 极克制 UI + 橙色只做语义强调，不做界面装饰。**
> 一句话定位：**ForgeNote 的视觉不是工具软件，而是"一张可以执行 AI 生成的编辑纸"。**

## 1. 基础色板（Foundation）

> **v3.16 暖化修订（2026-07-03，Owner「A 方向 + 点阵纸」）**：原配色被 Owner 判为"灰沉沉"——
> 根因是暖纸底叠中性冷灰墨。本次把墨色系整体转暖褐、橙色略提暖、并新增**点阵纸画布**。
> 下表已是暖化后的值；括注为 v3.15 旧值。视觉气质不变（仍是极克制纸感），只是去掉了冷灰的闷感。

### 画布与点阵（Canvas Layer，v3.16 新增）

| Token | 值 | 用途 |
|---|---|---|
| `canvas` | `#EDE4CC` | 应用底画布（面板透明，露出连续点阵） |
| `dot` | `rgba(150,118,66,0.16)` | 点阵颜色（暖褐，低透明） |

点阵实现：`.frame` 上 `background-image: radial-gradient(var(--dot) 1px, transparent 1.5px); background-size: 20px 20px;`；
大面板（顶栏/左栏/右栏/底栏）设 `background: transparent` 让点阵连续贯穿；内容卡用实底浮于其上。

### 背景系统（Paper Layer）——浮于点阵之上的"纸感层级"

| Token | 值（v3.16 暖化） | 旧值 | 用途 |
|---|---|---|---|
| `bg-paper-0` | `#F5EDDB` | ~~#F6F1E8~~ | 内容卡/段落卡实底 |
| `bg-paper-1` | `#F1E7D3` | ~~#F3EBDD~~ | 次级卡/按钮底 |
| `bg-paper-2` | `#EBDFC8` | ~~#EFE3D3~~ | hover 背景 |
| `bg-paper-inset` | `#E5D8BF` | ~~#E9DDC9~~ | 内嵌/进度槽底 |
| `card` | `#FBF6E9` | ~~#FBF7EF~~ | 最亮浮层卡（编辑区/任务卡） |

### 文字系统（Ink Layer，v3.16 转暖褐——去灰的关键）

| Token | 值（v3.16 暖化） | 旧值 |
|---|---|---|
| `text-primary` | `#2A231B`（暖炭黑） | ~~#2B2B2B~~ |
| `text-secondary` | `#6D6051`（暖褐灰） | ~~#6B6B6B~~ |
| `text-tertiary` | `#A0937C`（暖辅助） | ~~#9A9A9A~~ |
| `text-disabled` | `#C6B99E` | ~~#C2C2C2~~ |

### 强调色（Accent / Hermes Orange，略提暖）

| Token | 值（v3.16） | 旧值 |
|---|---|---|
| `accent-strong` | `#E8631F`（核心强调） | ~~#E86A2F~~ |
| `accent-hover` | `#D85A18` | ~~#D85F24~~ |
| `accent-ghost` | `#FBE2CE`（浅背景标记） | ~~#FBE7DE~~ |
| `accent-border` | `#E0702E`（边框状态） | ~~#E07A3A~~ |

**规则不变：只能在"语义动作"上使用橙色**——关键改动、当前任务、风险提示、选中状态。
仍是单强调色（方向 B 的第二强调色青绿未采纳，留作后续可选）。

## 2. 线框与边界（Stroke System，v3.16 转暖）

`border-default: #DAC6A5`（旧 #D8C9B6）· `border-soft: #E6D8BF`（旧 #E7D9C6）·
`border-focus: #E8631F` · `border-subtle: rgba(70,50,20,0.07)`（旧 rgba(0,0,0,0.06)）

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
