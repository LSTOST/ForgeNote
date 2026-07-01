# I-25 Claude Code Handoff — Forge Workspace UI

## 执行结论

请实现 **I-25 / DSN-03-S2：Forge 工作区整体 UI（左 / 中 / 右 / 底）**。

这不是继续打磨登录页，也不是重写生成结果；目标是把 `/forge` 从纵向页面流改成 DSN-03 定义的工作区 shell。

## 必读

1. `docs/OPERATING-MODEL.md`
2. `docs/TICKETS.md` 中 `I-25 / DSN-03-S2 执行票`
3. `docs/design/dsn-03-core-ux-map/ia.md` §2
4. `docs/design/dsn-03-core-ux-map/state-map.md` S-08 / S-09 / S-10 / S-13 / S-16 / S-21 / S-22
5. `docs/design/dsn-03-core-ux-map/design-system-baseline.md`

如果 I-24 还没合入 main，请基于包含 I-24 的分支/PR 做 I-25，不能从旧假设条实现开始。

## 目标

桌面 `/forge` 必须呈现明确工作区结构：

```text
左：账号上下文 / 导航 / 真实已有入口
中：当前任务输入 + 生成结果主线
右：输出偏好 / I-24 假设条 / 生成控制 / 保存配方
底：session / 复用 / 表现连续性
```

移动端不复制四栏，按任务优先级单列：

```text
任务输入 → 假设确认 → 生成 → 内容方案 → 保存配方 → session/表现
```

## 允许改

- `src/components/forge/ForgeWorkbench.tsx`
- `src/components/forge/IdeaInput.tsx`（仅布局/空态适配）
- `src/components/forge/DirectionPanel.tsx`（仅容器适配，不回滚 I-24）
- `src/components/forge/OutcomePanel.tsx`（仅工作区容器适配）
- `src/components/forge/RecipePanel.tsx`（仅右栏/保存区容器适配）
- `src/components/forge/PerformancePanel.tsx`（仅必要时作为底部连续性入口）
- `src/lib/copy/zh-Hans.ts`
- `src/lib/copy/en.ts`
- `docs/acceptance/I-25.md`
- `docs/PROJECT-STATUS.md`

## 禁止改

- 不改 `/api/forge`
- 不改 prompt / AI contract
- 不改 DB / migrations / RLS
- 不改 auth / Supabase / OpenRouter
- 不做资产库、历史页、图像渲染、内容日历、自动学习、Stripe、runtime i18n
- 不触碰未跟踪 `原型图/`
- 不把 I-24 的 chip 假设条改回大卡片/长说明
- 不做结果区深层重构；如果结果层级不够，另开 I-26

## 验收路径

实现后必须提供：

```bash
npm run doctor
npm run lint
npm run typecheck
npm run build
FORGENOTE_BASE_URL=<preview-url> npm run smoke:api
```

Preview 登录态手工路径：

1. 登录进入 `/forge`，桌面宽度 ≥1280px。
2. 首屏能明确看到左 / 中 / 右 / 底工作区，不是纵向长文档。
3. 空输入态只强调当前任务输入和「先确认方向」。
4. 输入模糊想法，点击「先确认方向」。
5. 右栏出现 I-24 三条假设 chip；展开依据，编辑一条，确认 `已确认 1/3`。
6. 点击生成，成功后中区展示内容方案，URL 写入 `/forge?session=`。
7. 保存配方入口可见；保存后「查看配方」不回归。
8. 刷新当前 session URL，结果和工作区结构恢复。
9. 移动宽度 390px 无横向滚动，顺序为任务 → 假设 → 结果 → 保存/连续性。

## 交付要求

- 开 Draft PR。
- PR body 写清楚哪些文件改了、哪些边界没碰。
- `docs/acceptance/I-25.md` 只能记录真实验证事实，不能把本地代码检查写成产品验收通过。
- I-25 通过不等于 V-01 通过；真实非构建者用户证据仍然需要继续收集。
