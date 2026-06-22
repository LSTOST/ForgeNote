# ForgeNote Tickets

> 执行层唯一任务板。`PRD-M1.md` 定义产品，`PROJECT-STATUS.md` 记录当前快照，本文件负责把 M1 拆成可推进、可验收、可追踪的票。
> 基线：当前 HEAD（Batch A/B/C 后）。**不回滚到 I-02B 旧状态。**

## 状态定义

| 状态 | 含义 |
|---|---|
| Backlog | 未开始，边界可调整 |
| Ready | 边界、依赖、验收标准已清楚 |
| In Progress | 正在实现 |
| Review | 已实现，待 Codex 切换 QA Agent 做真实用户路径验收 |
| Blocked | 被外部条件卡住 |
| Done | 通过自动验证、真实用户路径验收，并补齐验收证据后合入 |

## 更新规则

1. 每次只允许一个「下一张唯一任务」。
2. 每张票必须写清楚：目标、范围外、验收标准、验证命令、涉及文档。
3. 状态变更必须同步 `docs/PROJECT-STATUS.md`。
4. 设计 / API / 数据决策冲突时，以 `docs/DECISIONS.md` 为准。
5. 用户可见票必须按 `docs/OPERATING-MODEL.md` 的 Gate 3 写真实用户路径验收。
6. 票完成后，补一条验收记录到对应 `docs/acceptance/*.md`。

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
| I-11 | Done | 偏好页 `/profile`：edited assumptions 写入并下次带出（profile_preferences CRUD + /forge 带出 + 「记住为偏好」，无 migration） | `docs/acceptance/I-11.md` |
| I-12 | Done | F-16 表现回填 lite（`POST /api/sessions/:id/performance` + GET 读回 + OutcomePanel 入口，无 migration） | `docs/acceptance/I-12.md` |
| I-13 | Done | eval 门禁接入（`eval:forge` npm + safe-mode SKIP；手动/本地，不进 PR CI） | `docs/acceptance/I-13.md` |
| I-14 | Done | PostHog / Sentry 基础观测（零依赖 no-op scaffold + 可选 env + 文档） | `docs/acceptance/I-14.md` |
| I-17 | Done | UI copy resource extraction scaffold（src/lib/copy en+zh-Hans + typed helper，代表性接线，不改行为） | `docs/acceptance/I-17.md` |
| I-18 | Done | 补齐 UI copy 资源覆盖（活跃页面剩余硬编码 chrome 文案收敛到 `src/lib/copy/{zh-Hans,en}.ts`，承接 I-17，默认 zh-Hans 行为不变） | `docs/acceptance/I-18.md` |

> I-18 已 squash merge 到 `main`（`b56cfa0`，PR #2），远端分支 `i-18-copy-coverage` 已删除；验收文档 `docs/acceptance/I-18.md` 已在 `main`。

## 下一张唯一任务

| 票号 | 状态 | 目标 | 范围外 | 依赖 |
|---|---|---|---|---|
| I-19 | Ready | Production 上线就绪 + 首批真实用户路径验收 + DB 指标读出（不接第三方观测 SDK） | runtime i18n；PostHog/Sentry SDK；任何新产品功能；改 schema/RLS/prompt/API | M1 全部 Done（已满足）；Owner 配置 Vercel Production env / Supabase Production OAuth |

> **拍板**：Owner 已批准 I-19（2026-06-22），并明确**延后** runtime i18n 与观测 SDK。Codex 判断依据：M1 功能闭环已完整，瓶颈不是功能而是「没有真实用户能访问的 Production，也就拿不到任何『有人持续用』的证据」（见 `docs/OPERATING-MODEL.md` 目标与 Gate 4）。首批用户的 6 个指标可直接用 SQL 从现有表（`sessions` / `recipes.usage_count` / `usage_events` / sessions 的 performance 列）读出，无需先接 PostHog——故观测 SDK 延后、不进 I-19。

### I-19 执行票（Codex 写给 Claude Code）

```text
票号：I-19
状态：Ready
目标：把 M1 推到真实用户可登录使用的 Production，并按 OPERATING-MODEL Gate 3/4 拿到第一份真实使用证据；
      产出一个只读指标脚本，能从现有库表直接算出 M1 验证闭环的 6 个指标（无需第三方 SDK）。

范围内（Claude Code 实现，不触碰 Owner secret）：
1. 新增 scripts/metrics.mjs（只读）：连 DATABASE_URL（与 db:test-rls 同款连接方式），聚合输出
   - activation_rate：有 status='completed' session 的用户 / 有任意 session 的用户
   - assumption_edit_rate：session.assumptions 中存在 state='edited' 的占比（按 completed session）
   - recipe_save_rate：完成生成后产生 recipe 的占比
   - recipe_rerun_rate：source_recipe_id 非空的 session 占比 / 或 recipes.usage_count>0 占比
   - return_session_rate：同一 user 跨 >1 个自然日有 session 的占比
   - performance_fill_rate：completed session 中 performance 列非空的占比
   仅输出聚合计数/比率，**不 select 任何输入全文 / outcome / 复盘正文**；不打印 secret；无 DATABASE_URL → 明确 SKIP exit 0（对齐 db:test-rls / eval 的 safe-mode 语义）。
2. package.json 增 "metrics" script；scripts/doctor.mjs 增对 scripts/metrics.mjs 存在性检查。
3. docs/DEPLOYMENT.md 补「Production 上线段」：env 分区落实、Supabase Production redirect URL + Google OAuth（含 Client Secret，呼应 Preview 期 blocker 根因）、migration 0001+0002 应用确认、Deployment Protection 对真实用户的开放/ bypass 决策、上线前自动验证清单、回滚。
4. 新增 docs/acceptance/I-19.md：按 Gate 3 模板预置（环境=Production、用户身份、真实用户路径、预期、实测、证据、残余风险）。
5. docs/RUNBOOK.md 增 metrics 运行方式与判定语义（SKIP/读出）。

范围外（守边界）：
- 不引入 PostHog / Sentry SDK、不改 observability.ts 行为、不做 runtime i18n / locale 切换。
- 不加任何产品功能、不改 schema / migration / RLS / prompt / API / 既有路由。
- metrics 脚本不写库、不删数据、不绕过 RLS（只读聚合；用 service role 或直连只读账号由 DEPLOYMENT 说明，脚本本身不内嵌任何 key）。

涉及文件：
- 新增：scripts/metrics.mjs、docs/acceptance/I-19.md
- 修改：package.json（+metrics）、scripts/doctor.mjs、docs/DEPLOYMENT.md、docs/RUNBOOK.md
- 状态同步：docs/PROJECT-STATUS.md、docs/TICKETS.md

验收标准（Gate 2 实现正确性）：
- metrics 脚本：无 DATABASE_URL → SKIP exit 0、不报错、不打印 secret；有库时输出 6 个指标聚合，且 SQL 只取计数/布尔，不取输入全文。
- doctor / lint / typecheck / build 全通过；不新增运行时路由、不新增生产依赖（脚本可用现有 pg 依赖链，若需新依赖须先回 Codex 评估）。

验证命令：
  npm run doctor
  npm run lint && npm run typecheck && npm run build
  DATABASE_URL='postgres://...' npm run metrics   # 有库时
  npm run metrics                                  # 无库时期望 SKIP exit 0

手工验收步骤（Gate 3 真实用户路径，Production）：
  真实用户登录 → /forge 输入模糊想法 → 看懂/改一条假设 → 成功生成内容包 → 保存配方
  → 刷新后仍能找回结果 → 配方详情换输入重跑 → 记录发布表现 → 回看时表现仍在
  证据写入 docs/acceptance/I-19.md；并贴 npm run metrics 对 Production DB 的首批读出。

风险：
- Owner 侧 Production env / Supabase OAuth 未就绪会阻塞 Gate 3（与 Preview 期 Client Secret 同类）；Claude Code 先交付可验证的脚本/文档部分，Gate 3 待 Owner 配置后补证据。
- 指标定义在小样本下噪声大；I-19 只要求「能读出」，不要求达标阈值。

下一步：
- Claude Code 实现范围内 1–5，跑自动验证；Codex 切 QA Agent 复核脚本只读性与边界。
- Owner 完成 Production 配置后执行 Gate 3，补 docs/acceptance/I-19.md。
- I-19 Done 后再由 Codex/Owner 决定是否进入「观测 SDK 接入」或「runtime i18n」（仍需指标证据支撑）。
```
> 注（I-13 决策）：eval 为**手动 / 本地门禁**，**不进 PR CI**（真实模型调用 + 需登录态，进 CI 会因缺 key/登录态无意义失败）；CI 仍只跑 doctor / lint / typecheck / build。`npm run eval:forge` 无 cookie 时 SKIP exit 0。
> 注（I-14 决策）：观测为**零依赖 no-op scaffold**，未配 env 不影响 build / 运行；真实 SDK 接入留作后续票（`observability.ts` TODO）。
> 注（I-17 决策）：i18n 仅 **scaffold**（en/zh 资源 + typed helper + 代表性接线），默认 zh-Hans 行为不变；运行时切换 / 偏好持久化 / output_locale 联动留作后续票。

## M1 剩余执行队列

> M1 计划票（I-08~I-18）已全部交付。当前唯一在途票为 **I-19（Ready）**：Production 上线就绪 + 真实用户路径验收 + DB 指标读出。runtime i18n / 观测 SDK 接入仍为候选，**待 I-19 拿到指标证据后**由 Codex/Owner 再定，不默认采纳。

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
