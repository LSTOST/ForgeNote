# ForgeNote 文字创作工作台 · Design Tokens（Owner 定稿，2026-07-02）

> 来源：Owner 直接给出，作为后续所有设计的一致性基准。
> 核心原则：**近白暖灰底 + 纯白内容卡 + 极克制 UI + 橙色只做语义强调，不做界面装饰。**
> 一句话定位：**ForgeNote 的视觉不是工具软件，而是"一张可以执行 AI 生成的编辑纸"。**

> ## ⚠ v3.17 暖纸白修订（2026-07-05，Owner 定，取代 v3.16 暖黄 + 点阵）
>
> **动机**：v3.16「暖黄底 + 点阵纸」被 Owner 判为难看——根因有二：①点阵是装饰性噪音，
> 内容工作台里不承担对齐功能，铺满全屏后字浮在噪音上；②暖黄相染了整个界面（canvas/paper/card
> 都是同一暖黄的不同明度），等于整屏泡在一杯茶里，内容不跳。成熟内容工具（Notion / Substack /
> iA Writer / Craft / Ghost）的共识：**背景近中性、内容区亮、暖色只在内容本身、靠排版分层**——
> 但它们的"白"是**暖纸白**（非纯 `#FFFFFF`）。中途一版做成冷白/冷灰被 Owner 判「太冷」，故收敛为暖纸白。
>
> **三条改动（本次唯一变更，其余原则不动）**：
> 1. **删除点阵**（canvas 的 `--dot` radial-gradient 全部移除，产品与概念稿同步）。
> 2. **暖象牙底 + 暖白卡**：page `#F4F1E9`、card `#FCFAF5`；不回闷黄、不走冷白，暖意保留在纸调与墨色里。
> 3. **标题上衬线**（`--font-heading` = `Georgia,"Songti SC","Noto Serif SC",serif`），做"内容嗓音"。
>
> **不变**：爱马仕橙 `#E8631F` 仅做语义动作、圆角/阴影克制、单强调色。
> **权威新值见下方 §1.1「v3.17 令牌表」**；再下方的 v3.16 暖黄表整体作废，仅留作历史。
> 产品实现：`src/app/globals.css`（`:root` / `.dark`）。

## 1.1 v3.17 令牌表（现行权威）

### 表面（Surface，暖象牙 → 暖白）

| Token | 值 | 用途 |
|---|---|---|
| `--background` | `#F4F1E9` | 应用底画布（暖象牙，无点阵） |
| `--card` / `--popover` | `#FCFAF5` | 内容卡 / 浮层（暖白，非纯白，比底更亮浮起） |
| `--secondary` / `--muted` | `#EFEBE1` | 次级按钮底 / 静默区 |
| `--accent`（hover） | `#EAE4D8` | hover / 高亮背景 |
| `--sidebar` | `#EFEBE1` | 左右栏底 |

### 文字（Ink，暖中性近黑）

| Token | 值 | 用途 |
|---|---|---|
| `--foreground` | `#26211A` | 主文字 |
| `--muted-foreground` | `#6B6252` | 次级文字 |
| （辅助/三级） | `#A79C89` | 提示 / 占位 |

### 强调与线框

| Token | 值 | 用途 |
|---|---|---|
| `--primary` | `#E8631F` | 唯一强调色，仅语义动作（生成 / 确认 / 当前 / 风险） |
| 强调深色（暖白底小字） | `#B4490F` | 橙色文字落浅底时用此深色保证可读 |
| `--ring` | `#E0702E` | 焦点环 |
| `--border` / `--input` | `#E6DFD1` | 默认暖发丝线（弃 v3.16 的重褐线 `#DAC6A5`，也弃冷灰 `#E5E3DD`） |

### 状态语义色（面板 / 徽章，落暖白底，全暖不用冷蓝）

| 状态 | 文字 | 底 | 含义 |
|---|---|---|---|
| 待开发 | `#6B6252` | `#EFEBE1` | 暖中性 |
| 进行中 | `#B4490F` | `#FBE7D2` | 橙（当前） |
| 代码完成 | `#8A6D2E` | `#F3EAD2` | 琥珀（完成待验收，带 caution 味） |
| 已验收 | `#4F7A43` | `#E8EFDB` | 暖绿（成功） |

### 暗色（`.dark`，暖中性近黑，非暖褐）

page `#191817` · card `#232220` · 次级 `#2A2825` · 主文字 `#EAE8E3` · 次文字 `#A6A29A` ·
线 `#34322E` · 橙与焦点环不变。

---

> 以下 §1 起为 **v3.16 暖黄 + 点阵历史值，已被上方 v3.17 取代，仅存档参考，不再实现。**

## 1. 基础色板（Foundation · v3.16 历史）

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
