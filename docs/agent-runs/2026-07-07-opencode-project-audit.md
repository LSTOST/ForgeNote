# ForgeNote 项目审查 — 2026-07-07

> 审查执行：OpenCode · 审查范围：全仓（代码、文档、roadmap、git状态）
> 审查结果：只读，未修改任何文件

---

## 1. 当前分支

- **分支**：`feat/m2-09-workspace`
- **基于**：`origin/feat/m2-09-workspace`（已同步）

---

## 2. 未提交改动

| 文件 | 状态 |
|------|------|
| `docs/design/redefine-2026-07/CODEX-CODE-REVIEW-M2.md` | 未跟踪（untracked） |
| `docs/agent-runs/2026-07-07-opencode-project-audit.md` | 未跟踪（本次新建） |

无 staged 或已修改文件，工作区干净。

---

## 3. 最近 10 次提交

| 提交 | 关联票 | 内容 |
|------|--------|------|
| `de1e6e0` | M2-09 Step4 | 从主内容派生多平台（底栏改派生，不再从结构直渲） |
| `3decc6b` | M2-09 Step3 | 右栏 token 骨架 → 可读轻控制 + 账号记忆 |
| `8bc4e0b` | M2-09 | docs(roadmap): Step1/2 完成，3/4 待办 |
| `228b00a` | M2-09 Step2 | 中区改为可读内容（提纲 → 可编辑正文/卡片/脚本），弃 token 槽位 |
| `d87ca5e` | M2-09 Step1 | 主内容引擎层（平台无关可读内容） |
| `4b8bd2b` | M2-16 | 官网质感/密度/动效三层打磨 |
| `3a42b54` | M2-15 | 退役旧 /recipes + 清死脚本 |
| `45d61ec` | M2-04 | 删除旧 /forge 整块（页面+API+组件），引用改指 /workspace |
| `fd72d3c` | M2-09 | 工作台输出语言选择（接 I-16 output_locale） |
| `f8c5a85` | M2-16 | 官网落地页——laper.ai 骨架 + v3.17 暖纸白 |

### 已完成事项总览

**M1**：完全交付（I-01~I-23 全部 Done，含 login/forge/recipes/profile/preferences/表现回填/eval/观测）。已归档至 `docs/archive/`。

**M2 已 closed**：

| 票 | 结果 |
|----|------|
| M2-00 | accepted（3 项 Owner 裁决落地） |
| M2-05 | accepted（首屏账号接入，含 source ledger） |
| M2-01 | code_done（Structure Token Registry v0） |
| M2-02 | code_done（结构核心数据模型 + RLS） |
| M2-03 | code_done（Renderer 契约 + golden-test 骨架） |
| M2-06 | code_done（选题雷达 5 卡） |
| M2-07 | code_done（结构生成 + 稳定性判定） |
| M2-08 | code_done（三 renderer） |
| M2-10 | code_done（RecipeSchema 保存/换输入复用） |

---

## 4. 项目启动与校验命令

| 命令 | 作用 |
|------|------|
| `npm run dev` | 启动开发服务器 (Next.js 16) |
| `npm run build` | 生产构建 |
| `npm run lint` | ESLint 检查 |
| `npm run typecheck` | TypeScript 类型检查 (`tsc --noEmit`) |
| `npm run doctor` | 项目健康检查 |
| `npm run progress` | 生成并打开进度面板 |
| `npm run db:test-rls` | Supabase RLS 策略测试 |

辅助检查脚本（M2 新增）：`check:intake` / `check:structure` / `check:renderers` / `check:recipe` / `check:radar` / `check:main-content` / `check:derive`，均以 `npm run` 运行。

---

## 5. 当前风险

### 5.1 高风险：M2-09 Step 1–4 尚未通过 Codex review

M2-09 是 M2 阶段用户可见核心页面（四区工作台）。四步均已提交但**未经 Codex 审查**：

| 步骤 | 内容 | 提交 |
|------|------|------|
| ① | 引擎主内容层 | `d87ca5e` |
| ② | 中区可读内容 | `228b00a` |
| ③ | 右栏轻控制 | `3decc6b` |
| ④ | 主内容派生 | `de1e6e0` |

**影响**：旧 `/api/render`（structure→platform）路径仍保留未删，存在两套生成路径并行风险。工作台实际可用性未经 Codex 架构审查或 Owner 真实路径验证。

### 5.2 中风险：M2-04 登录落点未完整验收

- 已删除旧 `/forge`（页面 + API + 8 组件），nav 和重跑等引用改指 `/workspace`
- 但仍需 Owner 以真实账号走通 `/login` → `/workspace` 完整流程
- 根路由 `/` 指向官网首页（M2-16），与之前 `/forge` 行为不同

### 5.3 中风险：GATE0 尚未启动

- Gate 0 状态 `todo`
- 需 M2-09 工作台可用 + M2-11 看板上线后才能进入四周自用验证
- 所有依赖 GATE0 的票（M2-12/M2-14）均无法开始

---

## 6. 最适合低风险执行 Agent 的 3 个任务

以下任务具有明确 spec、无 AI/LLM 调用依赖、低 blast radius，适合由执行 Agent 独立完成：

### 任务 1：M2-15 清理旧产物

| 维度 | 详情 |
|------|------|
| **状态** | `in_progress`（约 85% 已完成） |
| **剩余工作** | 清理旧 `src/lib/copy` 中死文案（`copy.nav.forge`/`recipes`、`copy.recipes.*` 等）；旧 DB 表标停写（`sessions`/`recipes`/`profile_preferences`/`usage_events` 旧表；drop 另票） |
| **依赖** | M2-10（已 code_done） |
| **风险** | 极低——纯删除/标停写，不新增代码路径 |
| **验证** | `npm run lint && npm run typecheck && npm run build && npm run doctor` |

### 任务 2：M2-11 Gate 0 看板 + Owner 周记模板

| 维度 | 详情 |
|------|------|
| **状态** | `todo` |
| **内容** | 周任务数 / 发布 / 雷达采用 / 结构编辑 / 复制导出 / 回填 / chatgpt_fallback 次数+原因 的可视化面板；Owner 每周自检模板 |
| **依赖** | M2-02（数据模型已 code_done）+ M2-09（工作台基本可用） |
| **风险** | 低——纯前端指标面板 + 静态模板，无 AI 调用 |
| **验证** | `npm run lint && npm run typecheck && npm run build` |

### 任务 3：M2-16 官网落地页

| 维度 | 详情 |
|------|------|
| **状态** | `in_progress`（已建 /、/pricing、/blog、/docs 骨架） |
| **内容** | 基于 laper.ai 骨架 + v3.17 暖纸白令牌完善页面内容、响应式、CTA 文案（v3 定位"结构生成系统"，不写未实现能力） |
| **依赖** | 无（无 AI/DB 依赖） |
| **风险** | 低——纯 UI 工作，文案约束已明确 |
| **验证** | `npm run lint && npm run typecheck && npm run build` |

---

## 7. 必须等待 Codex / Claude Code 恢复额度后处理的事项

| 排序 | 票/事项 | 原因 |
|------|---------|------|
| **1** | **M2-09 Codex review** | Step 1–4 代码已完成但未经架构审查，存在两套生成路径（`/api/render` vs `/api/content/derive`）并行风险，必须 Codex 审查后才能合入或调整 |
| **2** | **M2-04 真实验收** | 需 Owner 在模型环境可用时走通 `/login` → `/workspace` 完整用户路径，不能被自动化替代 |
| **3** | **M2-12 发布后回填 → account memory** | 依赖 M2-05 account memory 模型 + M2-11 看板上线；涉及 AI 生成链路，需 Claude Code 改代码 |
| **4** | **M2-13 ChatGPT baseline eval** | 需设计强 baseline prompt + A/B 评测流程 + judgment 记录，需 Codex 定方案后 Claude Code 实现 |
| **5** | **M2-14 Gate 0 验收包** | 需 M2-11/M2-12/M2-13 全部完成 + Owner 走 4 周真实路径后方可归档，当前无法启动 |

---

## 附录：审查文件清单

本次审查读取了以下文件（只读，未修改）：

- `AGENTS.md`
- `CLAUDE.md`
- `docs/PRD-M1.md`
- `docs/UIUX-M1.md`
- `docs/DATA-SCHEMA.md`
- `docs/API-CONTRACT.md`
- `docs/DECISIONS.md`
- `docs/archive/PROJECT-STATUS.md`
- `docs/roadmap/roadmap.json`
- `package.json`