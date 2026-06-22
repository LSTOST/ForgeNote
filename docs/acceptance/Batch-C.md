# Batch C + QA-01 Acceptance

> 票：Batch C（假设条编辑器 + 结果操作区）已由 Codex + 真实浏览器验收通过（见 `docs/PROJECT-STATUS.md`）。
> 本文件额外记录 **QA-01**：基于当前 HEAD 现代化恢复工程工具链与流程文档（不回滚到 I-02B 旧状态、不恢复 stash 本身）。

## QA-01 范围内

- 流程文档：`docs/RUNBOOK.md`、`docs/DEPLOYMENT.md`、`docs/TICKETS.md`、本验收记录。
- 工程脚本：`scripts/doctor.mjs`、`scripts/smoke-forge-api.mjs`、`scripts/test-rls.mjs`、`scripts/eval-forge.mjs`（+ `eval/cases/content-package.json` 种子）。
- npm scripts：`doctor`、`smoke:api`、`db:test-rls`（`eval` 未纳入——见范围外）。
- CI：在 doctor 适配当前仓库后，新增 Doctor step。
- `.github/pull_request_template.md`。

## QA-01 范围外（明确丢弃 / 不恢复）

- 不 `git stash pop/drop/apply`，不整文件照抄 stash。
- 不恢复 `docs/.obsidian/**`（编辑器本地配置）。
- 不恢复旧迁移 `supabase/migrations/202606200001_initial_m1_schema.sql`（当前迁移为 `0001_init.sql`）。
- 不纳入 `eval` 的 npm 入口：Batch A 后 `/api/forge` 必须登录，匿名 eval 一律 `AUTH_REQUIRED`，无法在 CI 匿名跑绿；脚本作为 I-13 种子保留，运行方式见脚本头注释。
- 未恢复 stash 中的 `scripts/db-reset.mjs` / `scripts/seed-dev.mjs` / `supabase/seed/dev.sql`（超出本票范围，且需未安装的 Supabase CLI；留待数据库票按需引入）。
- 不改任何产品功能 / 页面代码 / 迁移。

## 适配当前事实（与 I-02B 旧状态的关键差异）

| 事实 | 工具链适配 |
|---|---|
| `POST /api/forge` 必须登录，鉴权早于输入校验 | `smoke:api` 匿名断言改为：合法 body → `AUTH_REQUIRED`；非法 JSON / 缺 `rawInput` → `VALIDATION_FAILED`（不再期待 `INPUT_EMPTY` / `INPUT_TOO_LONG`） |
| 迁移为 `supabase/migrations/0001_init.sql` | `doctor` 与 `test-rls` 指向 `0001_init.sql`；旧 `202606...` 迁移不恢复、不检查 |
| `/login`、`/auth/callback`、`/auth/signout`、`/api/sessions/[id]` 已存在 | RUNBOOK / DEPLOYMENT 记录登录闭环；doctor 检查现有文档集合 |
| `/recipes`、`/profile` 未交付 | TICKETS 标记为剩余队列（I-08~I-11），不假定已存在 |
| `.env.local` 存在但不可打印 | doctor 只做 env 存在性判断（`process.env` 或 `.env.local` 同名非空赋值），永不读取/打印其值 |

## 自动验证（QA-01）

| 命令 | 结果 | 备注 |
|---|---|---|
| `npm run doctor` | 通过 | 0 failed / 0 warnings（本机 `.env.local` 四项 env 齐全；CI 缺 env 时对应项为 warn，不阻断）；全程只输出「已配置」，不打印任何值 |
| `npm run lint` | 通过 | — |
| `npm run typecheck` | 通过 | — |
| `npm run build` | 通过 | 路由表不变：`/`、`/_not-found` 静态；`/api/forge`、`/api/sessions/[id]`、`/auth/callback`、`/auth/signout`、`/forge`、`/login` 动态 |
| `npm run smoke:api` | 通过 | 本地 dev server（`http://localhost:3000`）；匿名 4 用例全绿：合法 body → `AUTH_REQUIRED`，非法 JSON / 缺 `rawInput` → `VALIDATION_FAILED` |
| `npm run db:test-rls` | 未运行（脚本就绪） | 本机 `.env.local` 仅有 Supabase REST URL + anon key，无 psql 连接串；脚本安全地报错退出并提示。提供 `DATABASE_URL` 后可跑（只读系统目录，不写数据） |

## 后续建议

- 之后可 `git stash drop stash@{0}`（仅建议，不在本票执行）：有价值资产已现代化吸收，其余为旧状态 / 本地配置。
- I-13 实装登录态 eval runner 后，将 `scripts/eval-forge.mjs` 正式纳入 npm 与 CI。
