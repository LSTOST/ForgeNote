# ForgeNote Design System

> v2.0（2026-07-12，G0S-10）：按 open-design 9 节 schema 补齐；反模式清单取自 killaislop.com 并按 ForgeNote 裁剪；工作台分区职责改为「主操作跟随内容流」模型（原底栏模型废止）。
> 中文文案规则见 `docs/UX-WRITING.md`（本文件 §7 只放指针）。

ForgeNote is a warm, restrained content workspace. The interface should feel like a quiet desk for making a post, not an enterprise dashboard and not a generic AI chat box.

## 0. Principles

- Account-driven first: the product starts from account analysis, then moves into ideas, content frames, draft writing, platform versions, and publishing feedback.
- Human language only in UI: code and APIs may keep internal names, but primary UI copy must describe user actions and results.
- Structure stays behind the scenes: users see content frames, writing order, expression choices, and next actions.
- Paper-like content surfaces: the center workspace should feel readable and editable, with calm spacing and low visual noise.
- **One primary action per stage**: every screen has exactly one brand-colored action, placed at the end of the center content flow.
- **每个信息只在一个地方出现**：同一状态/进度/身份不得在多个分区重复展示（重复 = 动线噪音）。
- Subtract first（killaislop 原则 4）：先删到每个留下的元素都有存在理由，再谈装饰。

## 1. Color

Source tokens live in `src/app/globals.css`. Use semantic CSS variables before raw color values.

```css
--bg-app: #F6F1E8;      --bg-panel: #FBF8F2;
--bg-card: #FFFDF8;     --bg-elevated: #FFFFFF;

--text-primary: #2A241D; --text-secondary: #6F675E;
--text-muted: #A39A8F;   --text-inverse: #FFFDF8;

--border-subtle: #E5DCCF; --border-strong: #D6C8B8;

--brand: #E85D1F;        --brand-hover: #D94F16;
--brand-soft: #FFF0E8;   --brand-muted: #F6B08F;

--success: #4F8A5B;  --success-soft: #EDF6EF;
--warning: #D8942C;  --warning-soft: #FFF6E6;
--danger: #C94A3A;   --danger-soft: #FFF0EE;
```

规则：

- **One accent**：brand 橙只用于主操作、选中态、进度。一屏最多一个 brand 实心按钮。
- 语义色只用于真实状态（成功/警告/危险），普通信息不上色。
- ⚠️ **暖纸白基准是 Owner 拍板的品牌决策**（v3.17，PR #33，`docs/UI-DESIGN-SYSTEM-REFACTOR.md`）。killaislop 将「warm cozy palette」列为 AI 味信号，但那针对的是未经决策的默认值——此处已满足「decide before decorating」。未经 Owner 拍板不得改回冷色或引入渐变。

## 2. Typography

Owner 于 G0S-12 选择方案 A：**衬线标题 + 无衬线正文**。页面级标题与阶段标题统一使用 `font-heading`（Georgia / 宋体衬线栈）；正文、表单、导航与元信息统一使用 `font-sans`。不得再以 `font-serif` 建立第二套标题入口。

系统字体栈（globals.css 为准）。语义字阶（避免 killaislop 的「14–18px 扁平层级」）：

| 角色 | 字号/行高 | 用途 |
|---|---|---|
| display | 22px / 1.4，semibold | 页面级标题（登录、first-run） |
| heading | 18px / 1.4，semibold | 中区阶段标题（内容框架 / 正文） |
| body | 15px / 1.8 | 正文、编辑区 |
| secondary | 13px / 1.6 | 说明文字、导航项 |
| caption | 12px / 1.5 | 元信息、时间、状态 |
| micro | 11px | 仅限徽标内文字；不再更小 |

层级靠字号 + 字重 + 间距建立，不靠换色、不靠斜体、不靠高亮。

圆角仅使用四档语义 token：`sm 8px / md 12px / lg 16px / xl 20px`。禁止任意圆角值；卡片阴影只使用暖褐 `--shadow-card`，弹层只使用 `--shadow-popover`。

## 3. Spacing

紧凑在组内，宽松在组间（killaislop：strategic spacing）：

| 层级 | 值 | 用法 |
|---|---|---|
| 组内 | 4 / 6 / 8px | 图标与文字、徽标间、行间 |
| 组间 | 12 / 16px | 卡片内区块、表单项之间 |
| 区块间 | 20 / 24px | 中区 section 之间、右栏分组之间 |
| 分区留白 | 24 / 32px | 中区左右 padding、页面级留白 |

禁止全局单一 gap 值（gap-4 everywhere 是 AI 味信号）。

## 4. Layout · 单工作台外壳

登录后由共享 layout 提供一个持久外壳：252px 可收起左栏 + 主区。路由切换只替换主区，左栏不重载；`/workspace`、`/radar`、`/account`、`/gate0` 保留独立 URL 与深链。

| 分区 | 唯一职责 | 明确不放 |
|---|---|---|
| 外壳左栏 252px 可收起 | Home、收起、新写一条、最近内容、选题、辅助组（周看板/账号分析）、账号菜单 | logo、状态、进度、当前内容详情、重复身份卡 |
| 主区 | 按路由显示写作、选题、账号分析或周看板视图 | 第二套全站导航、旧 TopNav |
| 写作中区 max-w 760 | 内容本体 + **主操作在内容流末尾**；Stage B 末尾是产出区 | 设置类控件 |
| 写作右栏 296px | 影响生成结果的设置：写作顺序、待确认、账号分析摘要；顶部一个状态 Badge | 内容复述、重复状态、平台版本记录 |

阶段动线（一条从上往下的线）：

```
Stage 0  想法输入 ──[生成内容框架]──▶
Stage A  框架预览 ──[生成正文]──▶
Stage B  正文编辑 ──▶ 产出区：选平台 → [生成] → 平台版本记录（点击回看/复制）
```

- 主操作始终紧跟其作用的内容之后，不与内容分离到别的分区。
- 每阶段一个 brand 按钮；上一阶段的按钮随阶段推进消失。
- 弹窗只用于「查看单个产物」，关闭不丢失（记录列表常驻产出区）。

## 5. Components

- Button: primary 用 `--brand`；secondary 用卡片底+细边框；**不渲染未接线的 disabled 占位按钮**（死按钮=欠账，进 roadmap 不进 UI）。
- Card: `--bg-card` + `--border-subtle` + `--radius-lg` + `--shadow-card`；禁止卡中卡。
- Input/Textarea: `--bg-card` + `--border-strong`，focus 用 `--brand-soft` ring。
- Badge: 默认中性；active/success/warning/danger 对应语义色；一屏同类 Badge ≤3。
- Panel: 侧栏用 `--bg-panel` + subtle border；Panel 是分区框架，不是装饰。
- 快捷键提示（kbd）：只在真实实现了监听时展示。

## 6. Motion

- 只过渡承载状态变化的属性（background/opacity/border-color），120–200ms。
- 禁止 `transition-all`、`scale-105` 悬停、脉冲发光、骨架以外的循环动画。
- 加载反馈用文字态（「生成中…」）+ 按钮禁用；长任务（>3s）在按钮旁给一句进度描述。

## 7. Voice / UI Copy

中文文案规范唯一事实源：`docs/UX-WRITING.md`（含禁用词表、替换表、Fenng 中文排版规则）。速查：

- 按钮写「点击后得到什么」，不复述页面标题。
- UI 不出现内部词（配方/派生/雷达/账号大脑/slot/strategy…），替换表见 UX-WRITING §3。
- 直角引号「」；中英文与数字之间加空格；UI 文案不直呼用户（避免「你/您」句式，改客观陈述）。

## 8. Brand

- app 单工作台外壳不放产品 logo；左上只放 Home 与收起左侧工作区按钮。
- BrandMark 仅用于 `/login` 与营销站。登录页保持左侧静态品牌视觉 + 右侧表单；Ember 插画已按 Owner 裁决移除。
- 语气：安静、具体、可信——「具体胜过响亮」（真实数字 > 形容词，宁可不写不编指标）。
- 登录成功进入 `/workspace`；无进行中内容时，写作视图显示「今天想写哪条内容？」。

## 9. Anti-patterns（禁止清单，按 killaislop 裁剪）

视觉：

- ❌ indigo→violet 渐变、gradient text、玻璃拟态（backdrop-blur）、大半径 pill 化一切
- ❌ 发光/脉冲状态点、超出元素的大阴影（blur ≥40px）、嵌套圆角不对齐
- ❌ 彩色左边条卡片（border-l-4）批量使用、图标彩底瓷砖网格、卡中卡
- ❌ 装饰性编号（01/02/03 编无序内容）、kicker 小标题满天飞、ALL-CAPS 标签网格

文案与信息：

- ❌ emoji 进 UI chrome（仅真实状态可用）、假指标（10k+/99.9% 无出处）、「不只是 X——更是 Y」句式
- ❌ 高亮词撒满段落、整句营销文案上 display 字号

交互：

- ❌ 死按钮（disabled 且无接线计划展示给用户）、假快捷键提示、同一信息多分区重复、主操作与内容分离
- ❌ 一次性弹窗承载需要留存的产物

Do not expose raw JSON, internal field names, or machine keys in user-facing text.
