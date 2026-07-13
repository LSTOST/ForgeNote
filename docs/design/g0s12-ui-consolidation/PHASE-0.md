# PHASE-0 指令 · 基线盘点与裁决（喂给 Cursor 的完整提示词）

你是 ForgeNote 仓库的执行工程师。本任务是 G0S-12「UI/UX 一致性重整」的第 0 阶段：**只做盘点取证和已裁决的清理，不做任何视觉修改**。

## 先读（按序，不读其他）

1. `AGENTS.md`（产品边界）
2. `docs/DECISIONS.md` 的 D-13、D-14（当前范围：独居生产台；CCOS 已冻结）
3. `docs/DESIGN.md`（设计系统规范 v2.0）
4. `docs/design/g0s12-ui-consolidation/README.md`（本计划总控）

## 任务 A · 产出不一致审计表

新建 `docs/design/g0s12-ui-consolidation/AUDIT.md`，逐项取证（每条带文件路径:行号）：

1. **Logo**：全仓搜 BrandMark 与任何品牌标识的使用点；列出哪些页面有 logo、哪些没有、样式是否一致（已知：营销页/first-run 用 BrandMark，workspace 顶栏和 login 各自处理）。
2. **字体**：`src/app/globals.css` 的 `--font-heading`（Georgia/宋体衬线）与 `--font-sans` 并存；列出每个使用点，标注每页标题实际渲染的字族。
3. **颜色**：grep 所有硬编码色值（`#[0-9a-fA-F]{3,8}`、`rgb(`、tailwind 原生色如 `text-gray-`、`bg-slate-` 等）出现在 `src/app/**` 与 `src/components/**` 但未走 `--` token 的地方，逐条列出。
4. **圆角**：统计 `rounded-*` 与 `--radius-*` 的所有取值分布（已知散布 8/9/10/12/14/16/20px），按页面归类。
5. **组件变体**：Button/Badge/Card/输入框在 `src/components/ui/*` 之外的野生实现（页面里手写的 className 按钮等），逐个列出。
6. **样式世代标注**：给 8 个 app 页面（/login /first-run /workspace /radar /account /profile /gate0 及 TopNav）各标一个世代（M1 遗留 / M2 旧版 / v0 视觉 / G0S-10 新版），一句话说明依据。

AUDIT.md 末尾给一张汇总表：每类分歧的数量 + 建议收敛方向（只建议，不执行）。

## 任务 B · 执行已裁决的清理（Owner 已批准）

1. 给以下三份文档头部加冻结横幅（格式参考 `docs/PRD-CCOS.md` 头部的冻结写法，注明「2026-07-12，G0S-12 阶段 0，随 CCOS 冻结；可复用骨架将折入 PHASE-2」）：
   - `docs/LOW-FIDELITY-WIREFRAMES.md`
   - `docs/LOW-FIDELITY-PROTOTYPE-PLAN.md`
   - `docs/UX-STRUCTURE-VALIDATION.md`
2. 删除 `src/app/ux-prototype/` 整个目录（原型不进生产代码）；全仓 grep `ux-prototype` 确认无残留引用。
3. `docs/roadmap/roadmap.json`：G0S-12 票的 note 追加「阶段 0 完成：审计表 N 项分歧；平行流三文档冻结；/ux-prototype 移除」。

## 边界（违反即失败）

- 不改任何组件样式、颜色、文案——本阶段只有任务 B 的三处冻结横幅、一个目录删除、一处 roadmap note 是允许的写操作。
- 不动 `src/lib/**`、`src/app/api/**`。
- 不读也不参考已冻结的 CCOS 文档内容做任何「顺手统一」。

## 验证与收尾

- 跑 `npm run lint && npm run typecheck && npm run build && npm run doctor`，全绿。
- 产出后**停下**，输出一句话总结 + AUDIT.md 路径，等 Owner 审。
