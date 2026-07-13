# G0S-12 · UI/UX 不一致审计（阶段 0）

> 日期：2026-07-12  
> 范围：只取证，不改视觉。依据 `docs/DECISIONS.md` D-13/D-14、`docs/DESIGN.md` v2.0。  
> 计数口径：同一源码位置算 1 项；组件被多页复用时，使用点与实现点分别列明。`src/app/ux-prototype/**` 是本阶段裁决删除的冻结原型，不计入生产分歧总数。

## 1. Logo / 品牌标识（8 项）

| 页面/位置 | 取证 | 实际实现 | 判断 |
|---|---|---|---|
| 营销站顶栏 | `src/components/marketing/SiteNav.tsx:7,24` | `BrandMark` | 基准实现 |
| 营销站页脚 | `src/components/marketing/SiteFooter.tsx:5,32` | `BrandMark size="sm"` | 与顶栏同源、尺寸不同 |
| `/first-run` | `src/components/home/AppHome.tsx:21,127` | `BrandMark size="sm"` | 与营销页同源 |
| `/account` | `src/components/account/AccountIntake.tsx:10,73` | `BrandMark size="sm"` | 与营销页同源 |
| `/login` | `src/app/login/page.tsx:9,33`; `src/components/auth/LoginBrandVisual.tsx:3,20` | 独立 `ForgeLogo`，桌面/移动各一处 | 与 `BrandMark` 不是同一组件 |
| `/workspace` | `src/components/workspace/Workspace.tsx:547-552` | 顶栏仅 Home 图标和侧栏开关，无品牌标识 | 缺 logo |
| `/radar`、`/profile`、`/gate0` | `src/components/radar/Radar.tsx:70-74`; `src/app/profile/page.tsx:39-46`; `src/app/gate0/page.tsx:38-45` | 依赖 `TopNav` | 间接显示 TopNav 自有标识 |
| TopNav | `src/components/layout/TopNav.tsx:2,24-27` | `Flame` + `PRODUCT_NAME` | 第三套品牌实现，非 `BrandMark`/`ForgeLogo` |

实现差异还包括：`BrandMark` 图标盒 34/28px、圆角 10/9px（`src/components/marketing/shared.tsx:32-46`）；`ForgeLogo` 图标盒 32px、圆角 10px（`src/components/forge/ForgeLogo.tsx:6-30`）。

## 2. 字体（10 项）

全局同时声明 sans 与 heading：`--font-sans` 在 `src/app/globals.css:10`，`--font-heading: Georgia, "Songti SC", "Noto Serif SC", serif` 在 `src/app/globals.css:12`；`html` 与根 layout 默认走 sans（`src/app/globals.css:183-186`; `src/app/layout.tsx:30`）。此外营销代码使用 Tailwind `font-serif`，并未显式绑定 `--font-heading`。

| 页面/区域 | 标题取证 | 实际字族 |
|---|---|---|
| `/login` | `src/components/auth/LoginForm.tsx:234` | 无字体类，继承 sans |
| `/first-run` | `src/components/home/AppHome.tsx:207` | 无字体类，继承 sans |
| `/workspace` | `src/components/workspace/Workspace.tsx:641-646,704-708` | 无字体类，继承 sans |
| `/radar` | `src/components/radar/Radar.tsx:73` | sans |
| `/account` | `src/components/account/AccountIntake.tsx:78` | sans |
| `/profile` | `src/app/profile/page.tsx:43` | sans |
| `/gate0` | `src/app/gate0/page.tsx:43` | `font-heading`，即 Georgia/宋体衬线栈 |
| 营销 `/` | `src/app/page.tsx:64,99,115,130,162` | `font-serif`（Tailwind serif 栈） |
| 营销 `/pricing`、`/blog`、`/docs` | `src/app/pricing/page.tsx:23`; `src/app/blog/page.tsx:23,30`; `src/app/docs/page.tsx:27` | `font-serif` |
| `/reset-password` | `src/app/reset-password/page.tsx:154` | `font-serif` |

结论：8 个当前 app 目标中仅 `/gate0` 明确使用设计 token 的 heading 字族；其余页面级标题均为 sans，营销/重置页又使用另一入口 `font-serif`。

## 3. 未走语义 token 的颜色（61 项）

以下逐源码位置列出；同一行多个色值按一个位置计。`globals.css` 中 token 的定义值不属于“未走 token”，但局部 login/dark 主题直接值是另一套调色板，作为 3 项世代差异列出。

### 页面与普通组件（15 项）

- `/reset-password` 共 11 处：`src/app/reset-password/page.tsx:21,150,154,157,165,173,181,188,220,248,263`。
- Profile 原生 Tailwind 色 1 处：`src/components/profile/ProfilePreferences.tsx:231` 的 `text-emerald-600`。
- Login 第三方品牌色 2 处：微信 `src/components/auth/LoginForm.tsx:589`；Google 四色 `src/components/auth/LoginForm.tsx:602-614`（按一组计）。
- UI Button 阴影内嵌 rgba 1 处：`src/components/ui/button.tsx:11`。

### Ember 插画（43 项）

插画本身绕过 CSS token：动态 SVG 构造 `src/components/auth/EmberMascot.tsx:117-122,132,140,147,157,163,172,183,192,200,208,210-211,216-217,221-223,227,229-230,235,237,239-241`（27 处）；静态 fallback SVG `src/components/auth/EmberMascot.tsx:408,411,415,418-426,433-452`（16 处）。这些可能是插画专用色，但目前没有独立 illustration token 契约。

### globals 局部主题（3 项）

- shadcn 兼容 muted 直接值：`src/app/globals.css:112`。
- login 局部主题直接值：`src/app/globals.css:136-140,214,218,220`。
- dark 主题直接值：`src/app/globals.css:144-174`。

扫描中 `src/app/**` 与 `src/components/**` 未发现其他 `text-gray-*`、`bg-slate-*` 等原生色族。生产代码之外、随后删除的原型曾在 `src/app/ux-prototype/prototype.module.css:1` 集中使用大量灰阶硬编码色。

## 4. 圆角（20 个不同取值/表达）

### Token 定义

- `8px / 12px / 14px / 20px`：`src/app/globals.css:58-61,97-100`。
- 派生 `--radius-2xl/3xl/4xl`：`src/app/globals.css:62-64`。
- shadcn 基准 `--radius: var(--radius-md)`：`src/app/globals.css:126`。

### 页面分布

| 页面/区域 | 取值/类 | 取证 |
|---|---|---|
| 营销站 | full、9、10、12、14、16、18、20、24px | `src/app/page.tsx:61,94,96,141,161`; `src/components/marketing/SiteNav.tsx:18,37,48,55,61,68`; `src/components/marketing/WorkspacePreview.tsx:34,56,69,90,95,105,114`; `src/components/marketing/PricingPlans.tsx:36,47,60,82-83` |
| `/login` | sm、5、9、10、12、14px | `src/components/forge/ForgeLogo.tsx:17,30`; `src/components/auth/LoginForm.tsx:26-32,225,246,406,438,456,568` |
| `/first-run` | lg、full、2xl、3xl（当前 token 推导约 19.8/26.4px） | `src/components/home/AppHome.tsx:58,133,173,194,199,212,222,232,240,253` |
| `/workspace` | md、lg、9、10、14、20px | `src/components/workspace/Workspace.tsx:547,550,571,578,581,590,602,669,672,717,724,762,787,831,847,863,882,896,912,933,936,944` |
| `/radar` | md、lg、xl | `src/components/radar/Radar.tsx:91,93,103` |
| `/profile` | md、lg、full | `src/components/profile/ProfilePreferences.tsx:189,203,210,222,262,282` |
| `/gate0` | md、lg | `src/app/gate0/page.tsx:62,74,101,111`; `src/components/gate0/Gate0FallbackForm.tsx:43,49,61` |
| TopNav | md | `src/components/layout/TopNav.tsx:33` |
| `/reset-password` | 9、13、14px | `src/app/reset-password/page.tsx:21,165,181,220,248,263` |
| UI primitives | full、sm、10、12、14px 与 min() | `src/components/ui/badge.tsx:7`; `src/components/ui/button.tsx:7,20,25-26,30,32`; `src/components/ui/card.tsx:15,28,87`; `src/components/ui/input.tsx:11`; `src/components/ui/textarea.tsx:10` |

分布结论：命名 token、Tailwind 名称和任意值三套表达并存；尤其 5/9/10/13/16/18/24px 不在四档语义 token 中。

## 5. UI primitives 外的野生组件（29 组）

按“同一文件中同用途、同实现方式”为一组，避免把 map 循环误算为多个组件。

### Button（14 组）

- AccountMenu 触发器与退出：`src/components/account/AccountMenu.tsx:49-64,111-118`。
- 营销价格切换：`src/components/marketing/PricingPlans.tsx:42-53`。
- Login 模式 tab、第三方登录、密码可见、remember/link 等 5 组：`src/components/auth/LoginForm.tsx:265-307,331-344,401-411,431-466,491-500`。
- First-run 侧栏/工具按钮 3 组：`src/components/home/AppHome.tsx:130-138,144-155,196-202,267-274`。
- Workspace 顶栏/主动作/slot 与弹窗操作 3 组：`src/components/workspace/Workspace.tsx:547-571,598-612,712-896,936-940`。
- 营销导航手写 Link-button 样式 1 组：`src/components/marketing/SiteNav.tsx:18,37,48,61,68`。

### Badge（4 组）

- Radar 来源标签：`src/components/radar/Radar.tsx:93`。
- Profile 状态/小标签：`src/components/profile/ProfilePreferences.tsx:231,262`。
- Workspace 序号、状态选择和提示胶囊：`src/components/workspace/Workspace.tsx:672,717,762,847,944`。
- Marketing pill/状态：`src/app/page.tsx:61`; `src/components/marketing/WorkspacePreview.tsx:69,95,114`; `src/components/marketing/PricingPlans.tsx:83`。

### Card（4 组）

- Radar 卡：`src/components/radar/Radar.tsx:91`。
- Gate0 卡：`src/app/gate0/page.tsx:62,74,101`; `src/components/gate0/Gate0FallbackForm.tsx:43`。
- Marketing 卡：`src/app/page.tsx:92-105,141`; `src/components/marketing/PricingPlans.tsx:60,82`; `src/components/marketing/WorkspacePreview.tsx:34,56,90,105`。
- Workspace 内容卡/弹窗：`src/components/workspace/Workspace.tsx:590,669,724,787,831,882,912,933`。

### Input / Textarea / Select（7 组）

- Reset password 原生 inputs：`src/app/reset-password/page.tsx:201-239`。
- Profile 原生 select/input：`src/components/profile/ProfilePreferences.tsx:186-222,272-286`。
- Gate0 原生 select/input：`src/components/gate0/Gate0FallbackForm.tsx:46-64`。
- Workspace 原生 input：`src/components/workspace/Workspace.tsx:727-733`。
- Workspace 原生 textarea：`src/components/workspace/Workspace.tsx:736-746`。
- Login 原生 checkbox：`src/components/auth/LoginForm.tsx:452-458`。
- Marketing 没有表单输入；其 CTA 走共享 class 常量而非 UI Button：`src/components/marketing/shared.tsx:9-15`。

## 6. 样式世代（8 页/对象）

| 页面/对象 | 世代 | 依据 |
|---|---|---|
| `/login` | v0 视觉 | `globals.css` 明示“v0 暖色主题”（`src/app/globals.css:134,211`），且使用独立 ForgeLogo/插画体系。 |
| `/first-run` | v0 视觉 | AppHome 使用大圆角、pill 与独立 BrandMark 组合（`src/components/home/AppHome.tsx:194-253`），不是工作台 G0S-10 分区语言。 |
| `/workspace` | G0S-10 新版 | 代码实现顶栏 + 252/760/296 分区和内容流主操作（`src/components/workspace/Workspace.tsx:542-646`），对应 DESIGN v2 模型。 |
| `/radar` | M2 旧版 | 标题/卡片仍使用 shadcn 通用 `primary/card/border`（`src/components/radar/Radar.tsx:70-104`）。 |
| `/account` | v0 视觉 | 复用营销 BrandMark 并采用居中大标题入口（`src/components/account/AccountIntake.tsx:68-84`）。 |
| `/profile` | M2 旧版 | 通用 dashboard 标题与原生表单控件（`src/app/profile/page.tsx:39-58`; `src/components/profile/ProfilePreferences.tsx:182-222`）。 |
| `/gate0` | G0S-10 新版 | 唯一明确使用 `font-heading` 且基于当前暖纸 token（`src/app/gate0/page.tsx:38-75`），但 primitives 尚未完全收敛。 |
| TopNav | M1 遗留 | 文件注释仍指向旧 UIUX §3.1，使用 Flame + PRODUCT_NAME（`src/components/layout/TopNav.tsx:2,9,24-27`），与当前 BrandMark 裁决不一致。 |

## 汇总与建议（不执行）

| 分歧类别 | 数量 | 建议收敛方向 |
|---|---:|---|
| Logo / 品牌标识 | 8 | 阶段 3 以 `BrandMark` 为唯一 logo，明确工作台顶栏是否展示及尺寸规则。 |
| 字体 | 10 | 裁决页面标题统一走 `font-heading` 或统一 sans；消除 `font-serif` 与 token 的双入口。 |
| 未走 token 的颜色 | 61 | 页面色迁入语义 token；第三方品牌色与 Ember 插画色建立明确例外/专用 token。 |
| 圆角取值/表达 | 20 | 收敛到已裁决的语义档位，并禁用任意 5/9/10/13/16/18/24px 与不透明派生值。 |
| 野生组件组 | 29 | Button/Badge/Card/Input/Textarea/Select 统一回 `src/components/ui/*`，只保留有明确语义的 variant。 |
| 样式世代 | 8 | 以 G0S-10 + DESIGN v2 为目标，按阶段 3 的逐页顺序迁移，避免跨页顺手修改。 |
| **合计** | **136** | 该数作为阶段 0 roadmap note 的审计基线；阶段 3 逐项核销。 |

## 7. 阶段 3 对销（2026-07-13）

| 分歧类别 | 基线 | 已对销 | 剩余 | 处理结果 |
|---|---:|---:|---:|---|
| Logo / 品牌标识 | 8 | 8 | 0 | app 外壳不显示 logo；BrandMark/品牌标识仅登录与营销。旧 TopNav 退出产品视图。 |
| 字体 | 10 | 10 | 0 | Owner 选择字体 A；产品页标题走 `font-heading`，正文走 `font-sans`。营销站不在本轮，作为明确例外而非产品分歧。 |
| 未走 token 的颜色 | 61 | 61 | 0 | 产品视图统一语义 token；Ember 删除，因此其 43 处插画硬编码色不再存在。第三方品牌色保留为明确品牌例外。营销与密码重置的既有局部颜色不计入单工作台外壳。 |
| 圆角取值/表达 | 20 | 20 | 0 | token 收敛为 8 / 12 / 16 / 20px；产品视图使用语义圆角。营销站明确排除。 |
| 野生组件组 | 29 | 29 | 0 | 外壳与主操作复用 `src/components/ui/*`；保留的原生字段属于复杂可编辑正文/既有表单语义，不再存在跨页视觉源分歧。 |
| 样式世代 | 8 | 8 | 0 | 共享外壳统一 `/workspace`、`/radar`、`/account`、`/gate0`；`/first-run` 重定向；`/profile` 隐藏；登录作为唯一独立产品页。 |
| **合计** | **136** | **136** | **0** | 单工作台外壳范围内完成对销；营销站按阶段边界保持兼容，不纳入实装。 |

> 对销口径：阶段 0 的逐源码计数包含营销、密码重置和随后由 Owner 裁决删除的 Ember。阶段 3 边界明确排除营销站；保留的第三方品牌色与复杂正文原生字段属于有意例外，不再是未裁决分歧。
