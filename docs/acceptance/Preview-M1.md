# M1 Preview / 部署环境验收

> 范围：PR #1（`i-01-forge-workspace`）的 Vercel Preview / 部署环境验收。仅部署与环境验证，不写业务功能。
> **状态：Blocked（关键路径受阻）。** CI 已转绿；repo 侧 `vercel.json` 已修复 Vercel `framework: null` 导致的 app 路由 404，新 Preview 可进入 Next.js 应用。当前 blocker 转为 **Preview env 为空**（登录页显示 Supabase 未配置）+ **Deployment Protection** 仍未解除。不绕过安全策略，不转 Ready。

## 已确认

- **Vercel 集成在运行**：仓库已接 Vercel，PR 每次提交都产出 Preview 部署。
- **HEAD `045e6f6` Preview 构建 READY**：最新部署为 commit `045e6f6`，Vercel deployment `dpl_47DRNL1djLWs4RZ8UfZnxSfsuX1t`。
- **Preview URL（045e6f6）**：
  - 部署 URL：`https://forge-note-p096shdgx-lstosts-projects.vercel.app`
  - 分支别名：`https://forge-note-git-i-01-forge-workspace-lstosts-projects.vercel.app`
- **CI 已转绿**：GitHub Actions run `27905779826`（HEAD `045e6f6`）`success`。
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

### 1. Vercel Framework Preset 为 `null` → READY 部署仍 404（已修）
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

- 修复已推送为 commit `045e6f6`，新部署 `forge-note-p096shdgx-lstosts-projects.vercel.app` 已 READY；`/`、`/login`、`/recipes` 返回 Next.js 200，`/api/forge` GET 返回 405（说明 route handler 已由 Next 接管）。Vercel 级 404 blocker 已解除。

### 2. Preview env 为空 → 登录不可用
- `vercel env ls preview`：No Environment Variables found for `lstosts-projects/forge-note`。
- 新 Preview 的 `/login` 显示：`登录暂不可用：Supabase 未配置`，提示缺少 `NEXT_PUBLIC_SUPABASE_URL` 或 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
- 本地 `.env.local` 已确认存在四个必需键（只确认键存在，未打印值）：`OPENROUTER_API_KEY` / `OPENROUTER_MODEL` / `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
- 我尝试用 Vercel CLI 从 `.env.local` 写入 Preview env，但该操作属于把本地凭据上传到外部 SaaS，安全策略要求 Owner 明确授权；未绕过，未打印任何值。

### 3. Preview 受 Deployment Protection 保护 → 普通访问与登录态验收入口仍未打通
- 未认证 `curl` 访问 Preview（`/`、`/login`）→ **HTTP 401**，带 `_vercel_sso_nonce`（Vercel SSO 挑战）。
- Vercel MCP 授权 fetch 可进入新部署并确认 `/login` 是 Next.js 200、`/api/forge` GET 是 405；这证明 app 路由已恢复，但不等于普通用户/浏览器登录态验收已完成。
- 旧 share URL 生成于 `framework: null` 的旧部署阶段；当前应在 env 配齐并重新部署后重新生成/授权访问入口。
- 结论：当前无法完成以下 Preview 验收：
  - 页面可打开 / `/login` 可打开
  - 未登录 `/forge`、`/recipes`、`/profile` → `/login`
  - Preview 上 `/api/forge` 匿名边界（AUTH_REQUIRED / VALIDATION_FAILED）
  - 登录态：`/forge` 生成主路径、`/recipes`、`/profile`、I-12 表现回填入口
- **未绕过**保护。

### 4. Vercel 环境变量存在性 → 已确认缺失
- Vercel CLI 已登录 `lstost`，项目已本地 link 到 `lstosts-projects/forge-note`（`.vercel/project.json` 本地生成，不提交）。
- Preview env 列表为空，因此以下必需 env 在 Preview 中缺失：
  - 必需：`OPENROUTER_API_KEY` / `OPENROUTER_MODEL` / `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - 可选：`SENTRY_DSN` / `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST`
- 变量名清单见 `.env.example` / `docs/DEPLOYMENT.md`；**值不在此打印**。

### 5. Google OAuth provider / callback（Preview）→ 未确认
- 受 2/3 影响，无法在 Preview 上验证 Google 登录与 `/auth/callback`。本地此前 Magic Link 通、Google 待 Owner 确认（PROJECT-STATUS 阻塞项既有项）。

### 6. GitHub Actions CI red → 已修且转绿
- CI（`Doctor / Lint / Typecheck / Build`）失败步骤为 **Install dependencies（`npm ci`）**，非 lint/typecheck/build。
- **重跑 attempt 2 仍 red**（非 flake）。读取 CI 日志，真因：
  - `npm error EUSAGE … package.json and package-lock.json … not in sync`
  - `Missing: @emnapi/runtime@1.11.1 from lock file` / `Missing: @emnapi/core@1.11.1 from lock file`
- 根因：**npm 大版本不一致**导致 lockfile 解析差异。本机 node 25 / **npm 11**；CI（setup-node `node-version: 20`）/ **npm 10**。npm 11 生成的 lock 缺少 npm 10 期望的 `@emnapi/runtime@1.11.1` / `@emnapi/core@1.11.1`（`@tailwindcss/oxide-wasm32-wasi` wasm 回退的嵌套 optional 依赖）顶层节点。本机 `npm ci`（npm 11）与 Vercel 安装恰好可过，只在 CI 的 npm 10 暴露——**初判「瞬时 flake」有误**。
- 第一次尝试用本机 **npm 11** `npm install --package-lock-only` 修复 → CI 仍红（同样 Missing）。
- 实修：用 **npm 10**（匹配 CI）重生成 lockfile：`npx npm@10 install --package-lock-only`，lockfile 现含 `@emnapi/core@1.11.1` / `@emnapi/runtime@1.11.1` 顶层节点；`npx npm@10 ci --dry-run` → **exit 0**（同步通过）。lockfileVersion 仍为 3，root deps/devDeps 未变，无应用源码改动。与历史 `b9b77b8`（“complete lockfile for npm ci”）同类。
- GitHub Actions run `27905779826`（HEAD `045e6f6`）已 `success`。

## 解除 Blocked 的可选方式（Owner 任选其一）

1. Owner 明确授权后，把本地 `.env.local` 中四个必需键写入 Vercel Preview env；或 Owner 自行在 Vercel Dashboard 配置这些变量。
2. 重新部署 / Redeploy 最新 Preview（环境变量只对新部署生效）。
3. 在 Vercel 项目设置中对 Preview **关闭 Deployment Protection**（或仅保护 Production），或提供 Protection Bypass for Automation token，或继续使用 Vercel share URL / 项目账号授权。
4. 按 `docs/DEPLOYMENT.md`「Preview 验收」清单手测。

## 结论

- Preview / 部署环境验收：**Blocked**。Vercel Framework Preset 404 已由 `vercel.json` 修复并验证；当前剩余 blocker 是 Preview env 为空导致登录不可用，以及 Deployment Protection/登录态路径未完成验收。CI 已转绿。
- **不建议转 Ready**：Preview 关键路径（未登录重定向、登录态生成、API 边界）未能在 Preview 上验证。
- 代码侧 M1（I-08~I-17）本地验收全绿；Preview 验收是唯一未决项。
