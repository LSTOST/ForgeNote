# M1 Preview / 部署环境验收

> 范围：PR #1（`i-01-forge-workspace`）的 Vercel Preview / 部署环境验收。仅部署与环境验证，不写业务功能。
> **状态：Blocked（关键路径受阻）。** CI 已转绿；Vercel 最新 Preview 构建 READY，但项目 Framework Preset 为 `null` 导致 app 路由 Vercel 级 404。已新增 repo 侧 `vercel.json` 指定 `framework: "nextjs"`，待新部署验证。Preview 仍受 **Deployment Protection** 保护，不绕过安全策略，不转 Ready。

## 已确认

- **Vercel 集成在运行**：仓库已接 Vercel，PR 每次提交都产出 Preview 部署。
- **HEAD `6bbbb3b` Preview 构建 READY**：最新部署为 commit `6bbbb3b`，Vercel deployment `dpl_8n3YDDmz6HqnEBYQaHf5o2B9ajGf`。
- **Preview URL（6bbbb3b）**：
  - 部署 URL：`https://forge-note-ctu8u65j7-lstosts-projects.vercel.app`
  - 分支别名：`https://forge-note-git-i-01-forge-workspace-lstosts-projects.vercel.app`
- **CI 已转绿**：GitHub Actions run `27901508356`（HEAD `6bbbb3b`）`success`。
- **本地验收命令全绿**（M1 代码侧）：

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

### 1. Vercel Framework Preset 为 `null` → READY 部署仍 404
- Vercel project `forge-note`：`framework: null`，`nodeVersion: 24.x`。
- 最新部署 `forge-note-ctu8u65j7-lstosts-projects.vercel.app` 状态 `READY`，commit `6bbbb3b`，但 `/`、`/login`、`/forge` 全部返回 Vercel 级 **404 NOT_FOUND**。
- 结论：这不是应用内路由 404，而是 Vercel 没按 Next.js 项目处理输出。
- 修复：新增 `vercel.json`：

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs"
}
```

- 该修复需推送后触发新 Preview 部署，再验证 app 路由是否可达。

### 2. Preview 受 Deployment Protection 保护 → 未授权访问仍被挡
- 未认证 `curl` 访问 Preview（`/`、`/login`）→ **HTTP 401**，带 `_vercel_sso_nonce`（Vercel SSO 挑战）。
- 用本机 Chrome（当前会话）访问 → 过 SSO 后落到 Vercel **404 NOT_FOUND**（该浏览器未以项目所属 Vercel 账号授权）。
- Vercel MCP 已生成临时 share URL（有效期至 2026-06-22 12:18:58），但在 `framework: null` 的部署上，具体 app 路由仍为 Vercel 级 404，无法完成应用验收。
- 结论：未认证与当前浏览器会话**都进不到应用本身**，因此以下 Preview 验收**未能执行**：
  - 页面可打开 / `/login` 可打开
  - 未登录 `/forge`、`/recipes`、`/profile` → `/login`
  - Preview 上 `/api/forge` 匿名边界（AUTH_REQUIRED / VALIDATION_FAILED）
  - 登录态：`/forge` 生成主路径、`/recipes`、`/profile`、I-12 表现回填入口
- **未绕过**保护。

### 3. Vercel 环境变量存在性 → 无法核验
- 本环境无 Vercel CLI、无 Vercel token、无 `.vercel/project.json`，无法读取 Vercel 项目 env 列表。
- 仅能间接推断：Preview 构建 `success` 说明构建期未因 env 硬失败；但**运行期 env 是否齐全（下列）未核验**：
  - 必需：`OPENROUTER_API_KEY` / `OPENROUTER_MODEL` / `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - 可选：`SENTRY_DSN` / `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST`
- 变量名清单见 `.env.example` / `docs/DEPLOYMENT.md`；**值不在此打印**。

### 4. Google OAuth provider / callback（Preview）→ 未确认
- 受 1/2 影响，无法在 Preview 上验证 Google 登录与 `/auth/callback`。本地此前 Magic Link 通、Google 待 Owner 确认（PROJECT-STATUS 阻塞项既有项）。

### 5. GitHub Actions CI red → 已修且转绿
- CI（`Doctor / Lint / Typecheck / Build`）失败步骤为 **Install dependencies（`npm ci`）**，非 lint/typecheck/build。
- **重跑 attempt 2 仍 red**（非 flake）。读取 CI 日志，真因：
  - `npm error EUSAGE … package.json and package-lock.json … not in sync`
  - `Missing: @emnapi/runtime@1.11.1 from lock file` / `Missing: @emnapi/core@1.11.1 from lock file`
- 根因：**npm 大版本不一致**导致 lockfile 解析差异。本机 node 25 / **npm 11**；CI（setup-node `node-version: 20`）/ **npm 10**。npm 11 生成的 lock 缺少 npm 10 期望的 `@emnapi/runtime@1.11.1` / `@emnapi/core@1.11.1`（`@tailwindcss/oxide-wasm32-wasi` wasm 回退的嵌套 optional 依赖）顶层节点。本机 `npm ci`（npm 11）与 Vercel 安装恰好可过，只在 CI 的 npm 10 暴露——**初判「瞬时 flake」有误**。
- 第一次尝试用本机 **npm 11** `npm install --package-lock-only` 修复 → CI 仍红（同样 Missing）。
- 实修：用 **npm 10**（匹配 CI）重生成 lockfile：`npx npm@10 install --package-lock-only`，lockfile 现含 `@emnapi/core@1.11.1` / `@emnapi/runtime@1.11.1` 顶层节点；`npx npm@10 ci --dry-run` → **exit 0**（同步通过）。lockfileVersion 仍为 3，root deps/devDeps 未变，无应用源码改动。与历史 `b9b77b8`（“complete lockfile for npm ci”）同类。
- GitHub Actions run `27901508356`（HEAD `6bbbb3b`）已 `success`。

## 解除 Blocked 的可选方式（Owner 任选其一）

1. 推送 `vercel.json` 修复，等待新 Preview 部署 READY，确认 project/deployment framework 为 `nextjs` 且 `/login` 不再 Vercel 级 404。
2. 在 Vercel 项目设置中对 Preview **关闭 Deployment Protection**（或仅保护 Production）。
3. 提供 Vercel **Protection Bypass for Automation** token（我用 `x-vercel-protection-bypass` 头做 Preview 验收，不打印 token）。
4. 使用 Vercel share URL / 本机 Chrome 项目账号授权后，按 `docs/DEPLOYMENT.md`「Preview 验收」清单手测。

## 结论

- Preview / 部署环境验收：**Blocked**（Vercel Framework Preset `null` 导致 app 路由 404；repo 侧修复待部署验证；Deployment Protection 仍需可访问入口）。CI 已转绿。
- **不建议转 Ready**：Preview 关键路径（未登录重定向、登录态生成、API 边界）未能在 Preview 上验证。
- 代码侧 M1（I-08~I-17）本地验收全绿；Preview 验收是唯一未决项。
