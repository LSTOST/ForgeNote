# PHASE-3 指令 · UI 与设计系统实装（喂给 Cursor 的完整提示词）

你是 ForgeNote 仓库的执行工程师。本任务是 G0S-12 第 3 阶段（最后阶段）：tokens 定稿 → 组件收敛 → 按已冻结的线框逐页实装。**分四步，每步一个 commit，第 3 步内每页一个 commit。**

前提：Owner 已过 PHASE-2 闸门（布局冻结）。

## 先读

1. `docs/design/g0s12-ui-consolidation/WIREFRAMES.md` + `prototype.html`（布局唯一依据）
2. `docs/DESIGN.md` v2.0 全文（tokens、字阶、间距、反模式清单——**§9 反模式逐条是硬约束**）
3. `docs/design/g0s12-ui-consolidation/AUDIT.md`（要消灭的分歧清单）
4. `docs/UX-WRITING.md` §13（所有新写文案的规矩）

## Step 1 · Tokens 定稿（commit 1）

在 `src/app/globals.css` 收敛为单一来源：

- **色板不动**：暖纸白基准是 Owner 拍板的品牌决策（DESIGN.md §1），禁止改色相、禁止引入渐变。
- **圆角收敛**：全站合并为 `--radius-sm: 8px / --radius-md: 12px / --radius-lg: 16px / --radius-xl: 20px`（对齐 Harvest 参考：按钮/输入 16、卡片 20）。替换 AUDIT.md 列出的所有野生值（9/10/14px 等）。
- **阴影转暖**：shadow 色从纯黑透明度改为暖褐底（参考 `rgba(42,36,29,…)` 已是暖色，检查是否全站走 token）。
- **字体裁决**：先做 A/B 对照——同一 first-run 页分别用「A：标题衬线（现状 Georgia/宋）+ 正文无衬线」与「B：全无衬线，仅营销 hero 保留衬线」截图两张给 Owner 选。**Owner 未选前不得继续 Step 2**。选定后写死进 DESIGN.md §2 与 globals.css。

## Step 2 · 组件收敛（commit 2）

- 以 `src/components/ui/*` 为唯一组件源。对 AUDIT.md 列出的每个野生实现：能用现有组件的替换；确有新语义的（如账号菜单、空状态、页面头）抽成 ui 组件再用。
- **BrandMark 成为全站唯一 logo**：workspace 顶栏、login 页统一接入 `src/components/marketing/shared.tsx` 的 BrandMark（尺寸变体可加参数，不复制实现）。
- 死代码清理：被替换的野生样式删干净，grep 确认无残留。

## Step 3 · 逐页实装（每页一个 commit，顺序固定）

workspace → first-run → login → radar → account → profile → gate0

每页流程：

1. 按 WIREFRAMES.md 对应节实装（布局不得偏离已冻结线框；发现线框错误停下来报告，不自行发挥）
2. 文案按状态表 + UX-WRITING §13
3. 自查 DESIGN.md §9 反模式清单
4. `npm run lint && npm run typecheck && npm run build` 过后 commit，**截图该页交 Owner 过目**，Owner 点头才进下一页

导航统一（UX-BASE 裁决的结论）在对应页面的 commit 内落地（如 TopNav 替换/移除）。

## Step 4 · 规格与收口（commit 最后一个）

- `docs/UIUX-M2.md`：从「只有 workspace 完整」扩成 8 页全量规格（每页：分区/主操作/状态表/导航），与实装一致。
- `docs/DESIGN.md`：§2 字体、§1 圆角阴影按 Step 1 定稿更新。
- `docs/roadmap/roadmap.json`：G0S-12 note 追加「阶段 3 完成」，状态改 `code_done` 需 Codex review 通过，否则保持 `in_progress` 并注明待 review。
- 全量验证：`npm run lint && npm run typecheck && npm run build && npm run doctor`。

## 边界（违反即失败）

- 不动 `src/lib/**`、`src/app/api/**`、`supabase/**`——纯 UI 层。
- 不加功能、不加页面、不加依赖（不装新 npm 包）。
- 营销站（`/`、`/pricing`、`/blog`、`/docs`、marketing 组件）**不在本轮**，除了它们 import 的共享 ui 组件保持兼容。
- AGENTS.md 产品边界：不出现积分/升级/billing/iOS 等元素。

## 收尾

输出：8 页截图清单 + 验证结果 + AUDIT.md 分歧逐条对销表（原 N 项 → 剩 0 项，剩余项说明原因）。停下等 Owner 全页走查。
