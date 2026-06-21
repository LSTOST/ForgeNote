# ForgeNote Tickets

> 执行层唯一任务板。`PRD-M1.md` 定义产品，`PROJECT-STATUS.md` 记录当前快照，本文件负责把 M1 拆成可推进、可验收、可追踪的票。
> 基线：当前 HEAD（Batch A/B/C 后）。**不回滚到 I-02B 旧状态。**

## 状态定义

| 状态 | 含义 |
|---|---|
| Backlog | 未开始，边界可调整 |
| Ready | 边界、依赖、验收标准已清楚 |
| In Progress | 正在实现 |
| Review | 已实现，待人工 / Codex 验收 |
| Blocked | 被外部条件卡住 |
| Done | 通过验收并合入 |

## 更新规则

1. 每次只允许一个「下一张唯一任务」。
2. 每张票必须写清楚：目标、范围外、验收标准、验证命令、涉及文档。
3. 状态变更必须同步 `docs/PROJECT-STATUS.md`。
4. 设计 / API / 数据决策冲突时，以 `docs/DECISIONS.md` 为准。
5. 票完成后，补一条验收记录到对应 `docs/acceptance/*.md`。

## 已完成（当前 HEAD）

| 批次 | 状态 | 目标 | 验收文档 |
|---|---|---|---|
| I-01 | Done | Next.js 骨架 + 静态 `/forge` + CI | — |
| I-02A | Done | OpenRouter 接入契约 + 类型 + mock | — |
| I-02B | Done | OpenRouter 真实调用 + `POST /api/forge` + `/forge` 渲染 | `docs/acceptance/I-02B.md` |
| Batch A | Done | `/api/forge` 必须登录 + session 持久化 + `0001_init.sql` + RLS | `docs/acceptance/Batch-C.md` |
| Batch B | Done | Supabase 登录闭环（`/login`、`/auth/callback`、`/auth/signout`、受保护 `/forge`） | `docs/acceptance/Batch-C.md` |
| Batch C | Done | 假设条编辑器 + 结果操作区（复制 / 重生成 / 新建） | `docs/acceptance/Batch-C.md` |
| QA-01 | Done | 工具链与流程文档现代化恢复（doctor / smoke / RLS 检查 / RUNBOOK / DEPLOYMENT / PR 模板） | `docs/acceptance/Batch-C.md` |
| I-08 | Done | 保存配方最小闭环（`POST /api/recipes` + RecipePanel 命名/保存/反馈） | `docs/acceptance/I-08.md` |
| I-09 | Done | 配方库 `/recipes` 列表、搜索、类型筛选、删除 | `docs/acceptance/I-09.md` |
| I-10 | Done | 配方详情 `/recipes/[id]` + 换输入重跑（`POST /api/recipes/:id/rerun`） | `docs/acceptance/I-10.md` |

## 下一张唯一任务

| 票号 | 状态 | 目标 | 范围外 | 依赖 |
|---|---|---|---|---|
| I-15 | Backlog | i18n 文案外化（UI 文案抽资源文件，en + zh-Hans 脚手架，不改行为） | 多 UI locale 全量翻译、繁中调优、生成语言切换 | Batch C；DECISIONS D-07(a) |

> **下一张唯一任务**：I-15（v5 选择性折叠 additive）。只做 i18n 文案外化脚手架，不抢做 I-16 `output_locale`、不做 I-11 偏好页。
> 注：I-15 / I-16 的票面定义随「v5 选择性折叠」战略文档（DECISIONS D-06/07/08、PRD §2/§4.3、本文件 M1 队列 I-15/I-16）一同维护，该批战略文档改动为既有未提交工作树状态，未纳入 I-10 功能提交，待技术负责人处理。

## M1 剩余执行队列

| 票号 | 状态 | 目标 | 范围外 | 依赖 |
|---|---|---|---|---|
| I-11 | Backlog | 偏好页 `/profile`：edited assumptions 写入并下次带出 | 自动学习（M2） | Batch A / Batch C |
| I-12 | Backlog | F-16 表现回填 lite（`POST /api/sessions/:id/performance`） | perf_score、自动抓取 | I-09 |
| I-13 | Backlog | eval 门禁接入真实样例集（含登录态 runner，把 `scripts/eval-forge.mjs` 正式纳入 npm/CI） | 自动内容评分模型 | I-02B |
| I-14 | Backlog | PostHog / Sentry 基础观测 | 完整增长分析 | 部署环境 |
| I-15 | Backlog | i18n 文案外化（UI 文案抽资源文件，en + zh-Hans 脚手架，不改行为） | 多 UI locale 全量翻译、繁中调优、生成语言切换 | Batch C；DECISIONS D-07(a) |
| I-16 | Backlog | output_locale 字段与假设维度（sessions/recipes 增 nullable 列 + assumption 维度，additive） | perf 排序、繁简内容调优、按 locale 禁用词表 | Batch A；DATA-SCHEMA；DECISIONS D-07(b) |

> 说明：`/recipes` 列表与 `/recipes/[id]` 详情 + 换输入重跑均已交付；`/profile` 仍未交付。
> I-15 / I-16 为 v5 选择性折叠（DECISIONS「v5 选择性折叠」）的 additive 票，**不抢占当前唯一任务 I-10**，按队列推进。

## 每票模板

```text
票号：
状态：
目标：
范围内：
范围外：
涉及文件：
验收标准：
验证命令：
手工验收步骤：
风险：
下一步：
```
