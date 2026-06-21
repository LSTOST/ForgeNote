# M1 Preview / 部署环境验收

> 范围：PR #1（`i-01-forge-workspace`，HEAD `3e5a012`）的 Vercel Preview / 部署环境验收。仅部署与环境验证，不写新功能。
> **状态：Blocked（关键路径受阻）。** Vercel 集成在跑、Preview 构建成功，但 Preview 受 **Deployment Protection** 保护、本环境无 Vercel CLI/token，**无法访问 app 路由完成 Preview 功能验收**。不绕过安全策略，不转 Ready。

## 已确认

- **Vercel 集成在运行**：仓库已接 Vercel，PR 每次提交都产出 Preview 部署（GitHub deployments 共 17 条）。
- **HEAD `3e5a012` Preview 构建成功**：GitHub commit status `Vercel = success`；`vercel[bot]` 已在 PR #1 评论 Preview 链接。
- **Preview URL**：
  - 部署 URL：`https://forge-note-h3m09t8hn-lstosts-projects.vercel.app`
  - 分支别名：`https://forge-note-git-i-01-forge-workspace-lstosts-projects.vercel.app`
- **本地验收命令全绿**（HEAD `3e5a012`，`npm ci` 后）：

  | 命令 | 结果 |
  |---|---|
  | `npm ci` | ✅ exit 0（lockfile 与 package.json 同步） |
  | `npm run lint` | ✅ |
  | `npm run typecheck` | ✅ |
  | `npm run build` | ✅ |
  | `npm run doctor` | ✅ 0 failed / 0 warnings |
  | `npm run smoke:api` | ✅ |
  | `npm run eval:forge` | ✅ 无 cookie SKIP exit 0 |

## Blocked 项与原因

### 1. Preview 受 Deployment Protection 保护 → app 路由不可达
- 未认证 `curl` 访问 Preview（`/`、`/login`）→ **HTTP 401**，带 `_vercel_sso_nonce`（Vercel SSO 挑战）。
- 用本机 Chrome（当前会话）访问 → 过 SSO 后落到 Vercel **404 NOT_FOUND**（该浏览器未以项目所属 Vercel 账号授权）。
- 结论：未认证与当前浏览器会话**都进不到应用本身**，因此以下 Preview 验收**未能执行**：
  - 页面可打开 / `/login` 可打开
  - 未登录 `/forge`、`/recipes`、`/profile` → `/login`
  - Preview 上 `/api/forge` 匿名边界（AUTH_REQUIRED / VALIDATION_FAILED）
  - 登录态：`/forge` 生成主路径、`/recipes`、`/profile`、I-12 表现回填入口
- **未绕过**保护（无 CLI / 无 protection-bypass token / 浏览器未授权）。

### 2. Vercel 环境变量存在性 → 无法核验
- 本环境无 Vercel CLI、无 Vercel token、无 `.vercel/project.json`，无法读取 Vercel 项目 env 列表。
- 仅能间接推断：Preview 构建 `success` 说明构建期未因 env 硬失败；但**运行期 env 是否齐全（下列）未核验**：
  - 必需：`OPENROUTER_API_KEY` / `OPENROUTER_MODEL` / `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - 可选：`SENTRY_DSN` / `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST`
- 变量名清单见 `.env.example` / `docs/DEPLOYMENT.md`；**值不在此打印**。

### 3. Google OAuth provider / callback（Preview）→ 未确认
- 受 1 影响，无法在 Preview 上验证 Google 登录与 `/auth/callback`。本地此前 Magic Link 通、Google 待 Owner 确认（PROJECT-STATUS 阻塞项既有项）。

### 4. GitHub Actions CI red → 实为 lockfile 不同步（已修）
- CI（`Doctor / Lint / Typecheck / Build`）失败步骤为 **Install dependencies（`npm ci`）**，非 lint/typecheck/build。
- **重跑 attempt 2 仍 red**（非 flake）。读取 CI 日志，真因：
  - `npm error EUSAGE … package.json and package-lock.json … not in sync`
  - `Missing: @emnapi/runtime@1.11.1 from lock file` / `Missing: @emnapi/core@1.11.1 from lock file`
- 根因：`@tailwindcss/oxide-wasm32-wasi` 的 wasm 回退所需嵌套 optional 依赖（`@emnapi/*`、`@napi-rs/wasm-runtime`、`@tybys/wasm-util`、`tslib`）在 `package-lock.json` 缺失。本机（darwin/arm64）`npm ci` 恰好可满足、Vercel 安装也过，故只在 CI 的 linux runner 暴露——**初判「瞬时 flake」有误**。
- 修复：`npm install --package-lock-only` 补齐缺失条目（**仅 +45 行 lockfile 元数据，无应用源码 / 无版本 churn**），与历史 `b9b77b8`（“complete lockfile for npm ci”）同类。已随本次提交合入并重跑 CI。

## 解除 Blocked 的可选方式（Owner 任选其一）

1. 在 Vercel 项目设置中对 Preview **关闭 Deployment Protection**（或仅保护 Production）。
2. 提供 Vercel **Protection Bypass for Automation** token（我用 `x-vercel-protection-bypass` 头做 Preview 验收，不打印 token）。
3. 在本机 Chrome **以项目所属 Vercel 账号登录**，使浏览器会话能过 SSO，我再用浏览器跑 Preview 验收。
4. Owner 本人按 `docs/DEPLOYMENT.md`「Preview 验收」清单手测。
5. （CI）已修：本次提交补齐 lockfile 的 wasm optional 依赖，重跑 CI 转绿后即解除 CI red。

## 结论

- Preview / 部署环境验收：**Blocked**（Deployment Protection + 无 Vercel 访问凭据）。CI 的 `npm ci` red 已定位为 lockfile 不同步并修复（非 flake）。
- **不建议转 Ready**：Preview 关键路径（未登录重定向、登录态生成、API 边界）未能在 Preview 上验证。
- 代码侧 M1（I-08~I-17）本地验收全绿；Preview 验收是唯一未决项。
