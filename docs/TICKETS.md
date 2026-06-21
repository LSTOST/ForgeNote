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
| I-15 | Done | v5 选择性折叠文案 / 产品表述收敛（图文卡片 / carousel 方向，additive） | `docs/acceptance/I-15.md` |
| I-16 | Done | output_locale 数据与生成链路（sessions 增 nullable text 列 + forge/rerun/session API + 生成约束 + UI 自由文本输入，additive） | `docs/acceptance/I-16.md` |

## 下一张唯一任务

| 票号 | 状态 | 目标 | 范围外 | 依赖 |
|---|---|---|---|---|
| I-11 | Backlog | 偏好页 `/profile`：edited assumptions 写入并下次带出 | 自动学习（M2）；F-16（I-12） | Batch A / Batch C |

> **下一张唯一任务**：I-11（偏好页 `/profile`）。只做 edited assumptions 持久化 + 下次带出，不做自动学习、不做 F-16、不抢做观测 / eval。
> 注（I-16 落地说明）：migration `0002_output_locale.sql` 仅 `sessions` 增 nullable text 列（additive，不 default / 不 enum / 不 backfill / 不改 RLS）；`recipes` 与 assumption 维度本票未做（见 DECISIONS D-07(b) 实现结果）。该 migration 已应用到 Supabase，带 locale 的 forge / rerun 写入、`/forge?session=` 回填与 recipe `usage_count` 增量已通过登录态复测。
> 注（I-15/I-17 范围澄清）：I-15 已交付产品表述收敛；原 D-07(a) 的「i18n 文案抽资源文件 + en/zh-Hans 脚手架」工程化外化未做，另立 Backlog 票 I-17，不阻塞 I-11。

## M1 剩余执行队列

| 票号 | 状态 | 目标 | 范围外 | 依赖 |
|---|---|---|---|---|
| I-11 | Backlog | 偏好页 `/profile`：edited assumptions 写入并下次带出 | 自动学习（M2） | Batch A / Batch C |
| I-12 | Backlog | F-16 表现回填 lite（`POST /api/sessions/:id/performance`） | perf_score、自动抓取 | I-09 |
| I-13 | Backlog | eval 门禁接入真实样例集（含登录态 runner，把 `scripts/eval-forge.mjs` 正式纳入 npm/CI） | 自动内容评分模型 | I-02B |
| I-14 | Backlog | PostHog / Sentry 基础观测 | 完整增长分析 | 部署环境 |
| I-17 | Backlog | UI copy resource extraction scaffold（i18n 文案抽资源文件，en + zh-Hans 脚手架，不改行为） | 多 UI locale 全量翻译、繁中调优、生成语言切换 | I-15；DECISIONS D-07(a) |

> 说明：`/recipes` 列表 + `/recipes/[id]` 详情 / 换输入重跑已交付；产品表述已按 v5 收敛（I-15 Done）；`output_locale` 数据/生成链路已交付且 migration 已应用（I-16 Done）；`/profile` 仍未交付。
> I-17（i18n 资源文件外化，原 D-07(a)）为后续 Backlog，不抢占 I-11。

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
