# ForgeNote Runbook

> 日常开发、排障、验收的执行手册。别把命令记在脑子里。
> 基线：当前 HEAD（Batch A/B/C 后）。`/api/forge` 已必须登录；Supabase 登录闭环已上线。

## 常用命令

```bash
npm run doctor      # 工程环境自检（只查存在性，不打印任何 secret）
npm run dev
npm run lint
npm run typecheck
npm run build
```

## 本地启动

1. 安装依赖：

```bash
npm install
```

2. 创建 `.env.local`：

```bash
cp .env.example .env.local
```

3. 填入（值不要提交、不要打印到日志）：

```text
OPENROUTER_API_KEY=          # 模型网关，仅服务端读取
OPENROUTER_MODEL=
NEXT_PUBLIC_SUPABASE_URL=    # 公开配置，受 RLS 保护
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

4. 启动：

```bash
npm run dev
```

5. 打开（建议用 `localhost` 而非 `127.0.0.1`，避免 Next 16 `allowedDevOrigins` 警告）：

```text
http://localhost:3000/forge
```

> 未登录访问 `/forge` 会重定向到 `/login`；缺 Supabase env 时 `/login` 显示「未配置」提示，不白屏。

## 每票开发前

1. 看 `docs/DECISIONS.md`（冲突时它是权威）。
2. 看 `docs/OPERATING-MODEL.md`，明确本票经过哪条真实用户路径验收。
3. 看当前票对应的 `docs/acceptance/*.md`。
4. 涉及 Next.js API、路由、缓存或运行时，先读 `node_modules/next/dist/docs/` 对应文档（本仓库 Next 与训练数据有出入）。
5. 确认 `docs/TICKETS.md` 中当前票状态。

## 每票提交前

```bash
npm run doctor
npm run lint
npm run typecheck
npm run build
```

涉及 `/api/forge` 时（先 `npm run dev` 起本地 server）：

```bash
npm run smoke:api      # 匿名冒烟：合法 body → AUTH_REQUIRED；非法 JSON → VALIDATION_FAILED
```

涉及数据库 / RLS 时（需 `DATABASE_URL` 为 Postgres 连接串 + 本机 psql）：

```bash
DATABASE_URL='postgres://...' npm run db:test-rls
```

涉及模型 prompt、输出结构、验收逻辑时（eval gate，I-13 已纳入 npm，**手动 / 本地命令，不进 PR CI**）：

```bash
npm run eval:forge        # 安全默认：未设 FORGENOTE_AUTH_COOKIE → 明确 SKIP（exit 0），不计失败、不打印 secret

# 真实跑分（需登录态 + 模型 env）：先 `npm run dev`，再从已登录浏览器复制整段 Cookie 头
FORGENOTE_AUTH_COOKIE='sb-...=...; ...' npm run eval:forge
# 可选参数：--base-url http://localhost:3000 --cases eval/cases/content-package.json
```

## 每票验收前

Codex 必须切换为 QA Agent。不要只做代码 review。

用户可见票必须在 `docs/acceptance/*.md` 写清楚：

- 验收环境：本地 / Preview / Production。
- 用户身份：匿名 / 新用户 / 已登录用户。
- 用户路径：按真实点击、输入、刷新、跨页面回看顺序写。
- 验收结果：Pass / Conditional Pass / Fail / Blocked。
- 证据：命令摘要、Preview URL、session id、截图或录屏说明。
- 残余风险：没验到的路径必须明说。

M1 主路径基线：

```text
新用户进入 Forge Workspace
→ 输入模糊想法
→ 看懂假设条
→ 修改一项默认假设
→ 成功生成内容包
→ 保存配方
→ 刷新页面后仍能找到结果
→ 从配方详情换输入重跑
→ 记录发布表现
→ 回看时表现数据仍在
```

判定语义：

- **SKIP（exit 0）**：未提供 `FORGENOTE_AUTH_COOKIE`，或模型未配置（`MODEL_NOT_CONFIGURED`）——视为跳过，不当失败。
- **FAIL（exit 1）**：cookie 无效/过期（`AUTH_REQUIRED`），或某用例的检查项未通过（逐项打印检查名）。
- **PASS（exit 0）**：全部用例检查通过。

> 为什么不进每次 PR CI：eval 需真实模型调用（成本 + 需登录态），强行进 CI 会因缺 key / 缺登录态无意义失败。eval 作为**手动 / 本地门禁**运行；CI 仍只跑 doctor / lint / typecheck / build（`.github/workflows/ci.yml`）。`npm run eval:forge` 的 SKIP 语义保证它即使被无 key 环境调用也安全退 0、不打印 secret。

## 验证指标读出（I-19）

从现有库表只读算出 OPERATING-MODEL「指标闭环」的 6 个指标，首批用户样本下无需第三方 SDK。连接方式与 `db:test-rls` 同款（`DATABASE_URL` + 本机 psql，零生产依赖）。

```bash
# 有库（如对 Production 只读读出首批数值）：
DATABASE_URL='postgres://...:5432/postgres' npm run metrics
# 无库：
npm run metrics        # SKIP exit 0
```

输出 6 个指标：`activation_rate` / `assumption_edit_rate` / `recipe_save_rate` / `recipe_rerun_rate` / `return_session_rate` / `performance_fill_rate`，每个显示 `命中/分母 (百分比)`。

判定语义：

- **SKIP（exit 0）**：未提供 `DATABASE_URL` / `SUPABASE_DB_URL`——视为跳过，不当失败。
- **读出（exit 0）**：连库成功，打印 6 个指标聚合。

安全约束：

- 只 SELECT 计数 / 布尔聚合，**绝不取** `raw_input` / `outcome` / `recipe_snapshot` / `performance_note` 等输入全文或生成正文；跨进程的只有整数。
- 不打印连接串、不打印 secret；脚本不内嵌任何 key；只读，不写库、不绕过 RLS。
- 小样本噪声大：脚本只负责「能读出」，不设达标阈值。

## 排障

| 问题 | 先查 |
|---|---|
| `/forge` 一直跳 `/login` | 是否登录、Supabase env 是否配置、Auth cookie 是否有效 |
| `/api/forge` 401 `AUTH_REQUIRED` | 当前请求是否带登录 cookie（匿名调用本就返回 401，符合预期） |
| `/api/forge` 503 `MODEL_NOT_CONFIGURED` | `.env.local` 是否有 `OPENROUTER_API_KEY` 和 `OPENROUTER_MODEL` |
| `/api/forge` 500 `GENERATION_FAILED` | OpenRouter 状态、模型是否支持 JSON 输出、响应是否可解析（失败仍落 D-04 草稿） |
| `npm run db:test-rls` 报缺连接串 | `NEXT_PUBLIC_SUPABASE_URL` 是 REST 端点，不是 psql 连接串；需用 Postgres 连接串 |
| build 失败 | Next 16 文档、server/client 边界、类型契约 |
| 数据看不到 | RLS policy、当前 user_id、表是否启用 RLS（`npm run db:test-rls`） |
| Preview 不一致 | Vercel env 是否配置到对应环境（Preview / Production 分开） |

## 状态同步

完成任何一张票后，必须同步：

- `docs/PROJECT-STATUS.md`
- `docs/TICKETS.md`
- 对应 `docs/acceptance/*.md`
- 必要时同步 `docs/DECISIONS.md`
