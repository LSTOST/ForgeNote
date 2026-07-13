# PHASE-1 指令 · UX 设计——当前范围版（喂给 Cursor 的完整提示词）

你是 ForgeNote 仓库的执行工程师。本任务是 G0S-12 第 1 阶段：为**当前实际产品**（独居生产台，Gate 0 自用）建立 UX 底稿。**本阶段只写一份文档，不碰任何代码。**

## 先读（按序，不读其他）

1. `docs/DECISIONS.md` D-12/D-13/D-14（产品目标：Owner 自用；范围：单语中文、小红书优先）
2. `docs/GATE0-SLICE-PLAN.md`（切片计划与 Owner 真实工作流）
3. `docs/design/WORKSPACE-REDESIGN-G0S10.md`（工作台已定的分区职责模型）
4. `docs/UIUX-M2.md`（现有页面规格，只有 workspace 是完整的）
5. `docs/design/g0s12-ui-consolidation/AUDIT.md`（阶段 0 产出的现状审计）

⚠️ 明确禁止参考：PRD-CCOS、INFORMATION-ARCHITECTURE.md、UX-FLOW.md、USER-JOURNEY.md、LOW-FIDELITY-*（全部已冻结，描述的是另一个产品愿景）。

## 产出：`docs/design/g0s12-ui-consolidation/UX-BASE.md`

三节：

### 1. 用户旅程（当前范围）

Owner 的周更循环映射到 app 触点：

```
选题（外部选题库/canvas 或 /radar）→ 进入工作台 → 生成框架 → 生成正文 → 编辑
→ 一键双出（文案+卡片提示词）→ 复制发布（站外）→ 回填表现（/gate0 或工作台）→ 下周复用
```

每一步标注：触点页面、进入方式、退出去向、当前断点（如有）。素材在 GATE0-SLICE-PLAN §1，不需要新研究。

### 2. 信息架构（8 页全量）

对每个页面：路由、**唯一职责**（一句话）、主操作、明确不放什么、导航去向。页面清单：

`/login`、`/first-run`（App Home / hub）、`/workspace`、`/radar`、`/account`（账号分析）、`/profile`（个人偏好）、`/gate0`（周看板）。

必须裁决的三个 IA 问题（给出建议方案 + 理由，Owner 闸门时拍板）：

- **TopNav 的去留**：radar/account/profile 现在用旧 TopNav，first-run/workspace 用左栏导航——两套导航并存。建议统一成哪种？
- **/gate0 的入口层级**：周看板放主导航还是 workspace 左栏次级入口？
- **/account 与 /profile 的关系**：两页职责如何向用户表述（账号分析 vs 个人偏好），会不会混淆，是否需要合并或改名。

### 3. UX-FLOW（5 条核心任务流 + 异常态）

1. 新写一条：first-run 输入 → workspace 全程 → 复制发布
2. 从选题开工：/radar 选卡 → workspace（?idea= 预填）
3. 重开继续：first-run/workspace 最近内容 → 恢复 → 继续编辑
4. 发布后回填：发布完成 → 回填表现数据 → 写回账号记忆
5. 账号维护：查看/纠偏账号分析、个人偏好

每条流：步骤表（页面/用户动作/系统响应/下一步）+ 异常态（加载失败、生成失败、未持久化、会话过期）。格式参考已冻结 UX-FLOW.md 的表格样式（只借格式，不借内容）。

## 边界

- 不碰 `src/**`、不改其他文档。
- 不发明新功能、新页面；发现的功能缺口记入 UX-BASE.md 末尾「发现的缺口（不在本轮）」清单。
- 文案遵守 `docs/UX-WRITING.md` §13（「」引号、中英文空格、不直呼用户）。

## 收尾

`docs/roadmap/roadmap.json` G0S-12 note 追加「阶段 1 完成：UX-BASE 三节 + 3 个 IA 裁决项待 Owner」。产出后**停下**，列出 3 个待裁决项等 Owner 拍板。
