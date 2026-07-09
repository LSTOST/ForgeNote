# ForgeNote Project Status

> 最后更新：2026-07-08（GEB Lite 初始化）

## 当前里程碑

**M2 · 结构生成脊椎 + 工作台**（M1 已完成，详情见 `docs/archive/`）

## 当前分支

`feat/m2-09-workspace`

## 未提交文件

| 文件 | 状态 |
|------|------|
| `docs/design/redefine-2026-07/CODEX-CODE-REVIEW-M2.md` | 未跟踪 |

无staged或已修改文件。工作区干净。

## 启动与校验命令

| 目的 | 命令 |
|------|------|
| 开发服务器 | `npm run dev` |
| Lint | `npm run lint` |
| 类型检查 | `npm run typecheck` |
| 构建 | `npm run build` |
| 健康检查 | `npm run doctor` |
| 进度面板 | `npm run progress` |
| RLS 测试 | `npm run db:test-rls` |

## 最近完成事项（最近 10 次提交）

| 提交 | 票 | 说明 |
|------|-----|------|
| `de1e6e0` | M2-09 Step4 | 从主内容派生多平台（底栏改派生，不再从结构直渲） |
| `3decc6b` | M2-09 Step3 | 右栏 token 骨架 → 可读轻控制 + 账号记忆 |
| `8bc4e0b` | M2-09 | Step1/2 完成，3/4 待办 |
| `228b00a` | M2-09 Step2 | 中区改为可读内容（提纲 → 可编辑正文/卡片/脚本），弃 token 槽位 |
| `d87ca5e` | M2-09 Step1 | 主内容引擎层（平台无关可读内容） |
| `4b8bd2b` | M2-16 | 官网质感/密度/动效三层打磨 |
| `3a42b54` | M2-15 | 退役旧 /recipes + 清死脚本 |
| `45d61ec` | M2-04 | 删除旧 /forge 整块，引用改指 /workspace |
| `fd72d3c` | M2-09 | 工作台输出语言选择 |
| `f8c5a85` | M2-16 | 官网落地页——laper.ai 骨架 + v3.17 暖纸白 |

## 票状态总览

| 票 | 状态 | 阶段 | 说明 |
|----|------|------|------|
| M2-00 | accepted | 脊椎 | 冲突裁决（3 项 Owner 裁决落地） |
| M2-01 | code_done | 脊椎 | Structure Token Registry v0 |
| M2-02 | code_done | 脊椎 | 结构核心数据模型 |
| M2-03 | code_done | 脊椎 | Renderer 契约 + golden-test 骨架 |
| M2-04 | in_progress | 壳与UI | 登录落点切到 /workspace |
| M2-05 | accepted | AI核心 | 首屏账号接入 |
| M2-06 | code_done | AI核心 | 选题雷达 |
| M2-07 | code_done | AI核心 | 结构生成 + 稳定性判定 |
| M2-08 | code_done | AI核心 | 三 renderer |
| **M2-09** | **in_progress** | 壳与UI | **四区工作台（Step 1–4 代码完成，未通过 Codex review）** |
| M2-10 | code_done | 学习验证 | RecipeSchema 保存/换输入复用 |
| M2-11 | code_done | 学习验证 | Gate 0 看板 + Owner 周记模板 |
| M2-12 | code_done | 学习验证 | 发布后回填 → 写回 account memory |
| M2-13 | code_done | 学习验证 | ChatGPT baseline eval harness |
| M2-14 | todo | 学习验证 | Gate 0 验收包 |
| M2-15 | in_progress | 学习验证 | 清理旧 /recipes、旧 eval、旧 copy |
| M2-16 | in_progress | 壳与UI | 官网落地页 |

## 当前风险

1. **M2-09 Step 1–4 尚未通过 Codex review**：引擎主内容层、中区可读内容、右栏轻控制、派生均已提交但未经审查。
2. **M2-04 登录落点已切但标记 in_progress**：已删除旧 `/forge`（页面+API+8组件），登录/重跑等引用改指 `/workspace`，但仍需 Owner 以真实账号走通 `/login` → `/workspace` 完整流程。
3. **GATE0 尚未启动**：gate 状态 `todo`；M2-11 看板代码已落地，但专用 `check:gate0` 尚未跑通，仍需 Owner 真实周路径。

## 下一步任务优先级

| 排序 | 票 | 任务 | 推荐执行方 |
|------|-----|------|------------|
| **1** | M2-09 | Codex review Step 1–4（引擎主内容→中区可读→右栏→派生） | Codex（必须先审） |
| **2** | M2-15 | ⚡ 清理旧产物（死文案/旧 copy/旧 DB 表停写） | 低风险执行 Agent |
| **3** | M2-11 | ⚡ Gate 0 看板 + Owner 周记模板 | 低风险执行 Agent |
| **4** | M2-16 | ⚡ 官网落地页完善（/、/pricing、/blog、/docs） | 低风险执行 Agent |
| **5** | M2-12 | 发布后回填 → 写回 account memory | 待 M2-11 完成 |
| **6** | M2-14 | Gate 0 验收包 | 待 M2-11/M2-12/M2-13 完成 |

> ⚡ = 可由低风险执行 Agent 处理的任务（有明确 spec、无 AI/模型依赖、低 blast radius、状态/依赖已就绪）。

## M2-09 详细状态

Owner 2026-07-06 定稿：中区必须是**可读可编辑内容**（内容方向+提纲→正文/卡片/脚本），结构是幕后引擎不是 UI。四步已按 A 方案 1→4 顺序完成：

| 步骤 | 内容 | 提交 | 验证脚本 |
|------|------|------|----------|
| ① | 引擎主内容层 (`src/lib/content/main-content.ts` + `outline.ts` + `POST /api/content/main`) | `d87ca5e` | `check:main-content` 19 项绿 |
| ② | 中区改可读内容（提纲→可编辑正文/卡片/脚本，弃 token） | `228b00a` | mock 预览 0 token/4 可编辑段 |
| ③ | 右栏轻控制（原型+结构顺序+待裁决+语言+账号记忆，去 token） | `3decc6b` | 常驻对话助手占位态 |
| ④ | 从主内容派生 (`src/lib/content/derive.ts` + `POST /api/content/derive`) | `de1e6e0` | `check:derive` 绿 |

> **⚠ 尚未 Codex review**。需 Codex 审查后 Owner 真实路径验收（登录→生成→编辑→派生，需模型 env）。

## 当前技术状态

| 类别 | 详情 |
|------|------|
| **框架** | Next.js 16.2.9 + React 19.2.4 + TypeScript 5 |
| **样式** | Tailwind CSS 4 + @base-ui/react + shadcn/ui 4 + lucide-react |
| **后端/DB** | Supabase SSR (Auth + RLS + Postgres) |
| **模型网关** | OpenRouter (单模型，`OPENROUTER_API_KEY` + `OPENROUTER_MODEL` env) |
| **校验** | Zod 4 |
| **测试** | Playwright |
| **部署** | Vercel |

**当前页面路由：** `/`, `/login`, `/workspace`, `/radar`, `/profile`, `/first-run`, `/pricing`, `/blog`, `/docs`, `/reset-password`

**当前 API 路由：** `/api/account/intake`, `/api/radar/generate`, `/api/structure/generate`, `/api/structure/[id]/slot`, `/api/structure/[id]/decision`, `/api/content/main`, `/api/content/derive`, `/api/profile/preferences`, `/api/sessions/*`

**当前功能库：** `account/`, `radar/`, `structure/`, `content/`, `render/`, `recipe/`, `ai/`, `supabase/`, `copy/`

**已删除（M2）：** `/forge` 页面+API+8组件、`/recipes` 页面+API

**GEB Lite 认知系统：** 2026-07 初始化，以 `AGENTS.md` 为唯一主入口。

## 当前 UX 方向

ForgeNote 体验关键词：**内容工作台感、可读可编辑、结构幕后化**。

M2-09 工作台设计要点：
- 中区 = 可读可编辑内容（内容方向 + 提纲 → 正文/卡片/脚本），非 token 槽位
- 右栏 = 人类可读的控制面板（原型/顺序/待裁决/语言/记忆），非 raw token slider
- 结构生成是幕后引擎，不在 UI 直接暴露
- 底栏 = 平台派生（小红书/Threads/图片 prompt）
- 避免：冷 dashboard 感、token 视觉、多余空面板、avatar 重复

## 已知问题

1. **~~旧文档与 M2 脱节~~（2026-07-08 已修复）**：M1 文档已移至 `docs/archive/m1/` 并加 `ARCHIVED-` 前缀。新建 `docs/PRD-M2.md`、`docs/UIUX-M2.md`、`docs/DATA-SCHEMA-M2.md`、`docs/API-CONTRACT-M2.md` 和 `docs/README.md`。
2. **~~两套生成路径并行~~（2026-07-08 已修复）**：旧 `/api/render` 路由已删除。生成管线统一为 structure → main-content → derive。
3. **~~登录落点引用不统一~~（2026-07-08 已修复）**：`/auth/callback` 代码注释已改为 `/workspace`；各源文件中 `/forge` 历史引用已清理。
4. **M2-09 未经 Owner 验收**：Step 1–4 代码完成但未经过 Codex review 和 Owner 真实验收路径。

## 文档定位

- GEB Lite 主入口：`AGENTS.md`（根目录）
- 文档索引：`docs/README.md`
- 当前 M2 产品/UI/数据/API 规格：`docs/PRD-M2.md`、`docs/UIUX-M2.md`、`docs/DATA-SCHEMA-M2.md`、`docs/API-CONTRACT-M2.md`
- 进度事实源：`docs/roadmap/roadmap.json`
- 决策记录：`docs/DECISIONS.md`
- M2 构建计划：`docs/design/redefine-2026-07/M2-BUILD-PLAN.md`
- M1 归档：`docs/archive/m1/`（带 `ARCHIVED-` 前缀，仅用于历史背景）
