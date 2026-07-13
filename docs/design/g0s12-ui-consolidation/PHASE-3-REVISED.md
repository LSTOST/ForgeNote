# PHASE-3-REVISED 指令 · 单外壳架构实装（喂给 Cursor 的完整提示词）

你是 ForgeNote 仓库的执行工程师。G0S-12 最后阶段：把已冻结的**单工作台外壳**线框实装到代码。**本文替代 PHASE-3.md**（那份是架构修正前按「8 独立页」写的，作废）。分步 commit，每个视图一个 commit。

前提：Owner 已过阶段 2 返工闸门（布局冻结）。

## 先读

1. `docs/design/g0s12-ui-consolidation/UX-BASE.md` **§2.3 单工作台外壳**（生效 IA）
2. `docs/design/g0s12-ui-consolidation/WIREFRAMES.md`（返工版，WF-S 外壳 + WF-W/R/A/G 视图）+ `prototype.html`（交互冻结基准）
3. `docs/DESIGN.md` v2.0 全文（§9 反模式逐条硬约束）
4. `docs/design/g0s12-ui-consolidation/AUDIT.md`（要消灭的 136 项分歧）
5. `docs/UX-WRITING.md` §13（文案规矩）

## 架构目标（相对现状）

- 现状：`/workspace`、`/radar`、`/account`、`/gate0`、`/first-run`、`/profile` 各是独立页，导航各异。
- 目标：**一个共享布局外壳**包裹 `/workspace`、`/radar`、`/account`、`/gate0`（Next.js route group / shared layout），左栏常驻，切换路由时左栏不重载；主区随路由换视图。**保留所有路由 URL 与深链**。
- `/first-run` 并入 `/workspace` 空状态（路由重定向到 `/workspace`）。`/profile` 隐藏（路由与代码保留，移除全部导航入口）。登录落点 = `/workspace`。

## Step 1 · Tokens 定稿（commit 1）

同原 PHASE-3 Step 1：

- 色板不动（暖纸白已拍板）。
- 圆角收敛为 `sm 8 / md 12 / lg 16 / xl 20`，替换 AUDIT 所有野生值（5/9/10/13/18/24px）。
- 阴影全走暖褐 token。
- **字体裁决**：同一写作视图截 A（衬线标题+无衬线正文）/ B（全无衬线）两图给 Owner 选；**未选前不进 Step 2**。定稿写进 DESIGN.md §2 + globals.css。

## Step 2 · 组件收敛（commit 2）

- `src/components/ui/*` 为唯一组件源；AUDIT 的 29 组野生实现替换或抽成 ui 组件。
- **BrandMark 归属修正**：单外壳内**不放 logo**（Owner 拍板，左上是 Home + 收起按钮）。BrandMark 仅保留在 `/login` 与营销站。更新 DESIGN.md §8 说明这一点（不再是"全站唯一 logo 处处出现"，而是"app 外壳无 logo，品牌标识只在 login/营销"）。
- 死代码：被替换的野生样式删净，grep 确认。

## Step 3 · 外壳与视图实装（每项一个 commit，顺序固定）

**3.1 共享外壳（commit 3）**：建 route group + 布局壳（左栏 + 主区容器）。左栏含：Home 按钮、收起按钮（收起后显示 fixed「展开」按钮，见 prototype `#expandSidebar`）、新写一条、最近内容、本周可写选题、辅助组（周看板/账号分析）、页脚账号菜单（账号分析/退出，去掉个人偏好）。左栏在路由切换间不重载。旧 TopNav 从这些路由移除。

**3.2 写作视图（commit 4）**：`/workspace`——空状态 = 原 first-run「今天想写哪条内容」输入；工作流态 = Stage 0→A→B→产出区（沿用 G0S-10 现有实现，套进新壳）。`/first-run` 改为重定向 `/workspace`。

**3.3 选题视图（commit 5）**：`/radar` 套进外壳，卡片 → 写作视图预填（保留 `?idea=`）。

**3.4 账号分析视图（commit 6）**：`/account` 套进外壳。

**3.5 周看板视图（commit 7）**：`/gate0` 套进外壳。

**3.6 登录页（commit 8）**：`/login` 是外壳外唯一独立页，套用新 tokens + BrandMark。**Ember 插画留/砍**：实装到此步时停下问 Owner——留则建 illustration 专用 token 契约收编 43 处硬编码色；砍则移除 EmberMascot 换静态品牌视觉。按 Owner 回复执行。

**3.7 隐藏 profile（并入相关 commit）**：移除 `/profile` 的所有导航入口（账号菜单、任何 Link）；路由与组件保留但不可从 UI 到达；grep 确认无残留入口。

每个视图 commit 前：按对应 WF 线框实装（偏离线框先报告不自行发挥）→ 文案按状态表 + UX-WRITING §13 → 自查 DESIGN §9 → `npm run lint && typecheck && build` 过 → **截图交 Owner 过目**，点头才下一个。

## Step 4 · 规格与收口（commit 最后）

- `docs/UIUX-M2.md`：改写为单外壳架构（外壳 + 4 视图 + login），与实装一致；删除旧的「四区工作台 + 独立页」描述。
- `docs/DESIGN.md`：§1 圆角阴影、§2 字体、§4 布局（单外壳）、§8 BrandMark 归属，按本阶段定稿更新。
- roadmap G0S-12 note 追加「阶段 3 完成」；全绿则 status 视 Codex review 结果标 code_done 或保持 in_progress 注明待 review。
- AUDIT 136 项逐条对销表（→ 剩 0，剩余项说明原因）。
- 全量验证：`npm run lint && typecheck && build && doctor`。

## 边界（违反即失败）

- 不动 `src/lib/**`、`src/app/api/**`、`supabase/**`——纯 UI/布局层。
- 不加功能、不加页面、不加依赖。
- 营销站不在本轮（其 import 的共享 ui 组件保持兼容）。
- AGENTS.md 边界：无积分/升级/billing/iOS。
- 隐藏 profile 是"移除入口"不是"删代码"。

## 收尾

输出：各视图截图 + 验证结果 + AUDIT 对销表 + 两个 Owner 决策点（字体 A/B、Ember 留砍）的落地结论。停下等 Owner 全壳走查。
