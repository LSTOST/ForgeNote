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
| —（待 Owner 拍板 / Codex 定义） | — | M1 计划票 I-08~I-18 已全部 Done；下一张票尚未确定 | 不默认进入 runtime i18n；不擅自开产品功能票 | — |

> **状态**：M1 计划票全部 Done（含 I-18）。下一张唯一任务由 Codex 判断、Owner 拍板后写入，不在本票自行开启。候选后续票（均需另立、不默认采纳）：真正多语言运行时切换（locale 检测/选择/持久化 + scaffold-only 文案逐组接线）；I-14 观测真实 SDK 接入；部署 / Preview 验收（见 `docs/DEPLOYMENT.md`）。
> 注（I-13 决策）：eval 为**手动 / 本地门禁**，**不进 PR CI**（真实模型调用 + 需登录态，进 CI 会因缺 key/登录态无意义失败）；CI 仍只跑 doctor / lint / typecheck / build。`npm run eval:forge` 无 cookie 时 SKIP exit 0。
> 注（I-14 决策）：观测为**零依赖 no-op scaffold**，未配 env 不影响 build / 运行；真实 SDK 接入留作后续票（`observability.ts` TODO）。
> 注（I-17 决策）：i18n 仅 **scaffold**（en/zh 资源 + typed helper + 代表性接线），默认 zh-Hans 行为不变；运行时切换 / 偏好持久化 / output_locale 联动留作后续票。

## M1 剩余执行队列

> M1 计划票（I-08~I-18）已全部交付，执行队列清空。后续票按上「下一张唯一任务」候选另立，由 Codex/Owner 确定后才进入队列。

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
