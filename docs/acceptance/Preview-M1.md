# M1 Preview / 部署环境验收

> 范围：PR #1（`i-01-forge-workspace`）的 Vercel Preview / 部署环境验收。仅部署与环境验证，不写业务功能。
> **状态：通过（2026-06-22）。** CI 绿；Vercel framework 404 已修；Preview 必需 env 已配置并重新部署；未登录页面/API 边界通过；Supabase Google provider 配置补全后，登录态主路径与全套登录态验收通过。

## 当前部署

- **HEAD**：`029d112 docs(deploy): record supabase google provider blocker`（部署所用代码 HEAD；本次解除仅为 Supabase 外部配置变更，无代码改动）
- **GitHub Actions**：run `27906078732` → `success`
- **PR Preview deployment**：`dpl_2VVEQQoLH1MHv1kSnbJGb1YgJmJs` → `READY`
- **Preview URL**：`https://forge-note-bg0nw95o2-lstosts-projects.vercel.app`
- **分支别名**：`https://forge-note-git-i-01-forge-workspace-lstosts-projects.vercel.app`
- **Vercel env**：Preview 环境已存在 4 个必需键，值均为 Encrypted，未打印任何 secret：
  - `OPENROUTER_API_KEY`
  - `OPENROUTER_MODEL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 已确认

### 1. Vercel framework 404 已修

- 旧问题：Vercel project `framework: null`，READY 部署仍对 `/`、`/login`、`/forge` 返回 Vercel 级 404。
- 修复：commit `045e6f6` 新增 repo 侧 `vercel.json`：

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs"
}
```

- 现状：`/login` 返回 Next.js 200；`/api/forge` GET 返回 405；route handler 与 App Router 已由 Next 接管。

### 2. Preview env 已配置并生效

- Owner 已授权把本地 `.env.local` 中 4 个必需键写入 Vercel Preview env。
- 已通过 `vercel env ls preview` 确认变量存在，值显示为 `Encrypted`。
- 已 redeploy PR Preview；最新分支别名 deployment：`dpl_2VVEQQoLH1MHv1kSnbJGb1YgJmJs`。
- 分支别名 `/login` 已渲染真实登录表单：Google 登录按钮、邮箱输入、发送登录链接按钮；不再显示「Supabase 未配置」。

### 3. 未登录 Preview 验收通过

| 场景 | 预期 | 实测 |
|---|---|---|
| `/login` | 渲染登录页 | 通过，登录表单出现 |
| 未登录 `/forge` | → `/login` | 通过，最终渲染登录页 |
| 未登录 `/recipes` | → `/login` | 通过，最终渲染登录页 |
| 匿名 `POST /api/forge` 合法 body | 401 `AUTH_REQUIRED` | 通过 |
| 匿名 `POST /api/forge` 非法 JSON | 400 `VALIDATION_FAILED` | 通过 |

> 说明：Deployment Protection 仍开启；未认证公网访问会得到 Vercel Authentication 401，这是预期保护行为。验收使用 Vercel 授权 fetch / `vercel curl` / 临时 share URL 完成，未公开 bypass URL。

### 4. 本地/自动验收仍绿

| 命令 | 结果 |
|---|---|
| `npm ci` | 通过 |
| `npm run lint` | 通过 |
| `npm run typecheck` | 通过 |
| `npm run build` | 通过 |
| `npm run doctor` | 0 failed / 0 warnings |
| `npm run smoke:api` | 通过 |
| `npm run eval:forge` | 无 cookie SKIP exit 0 |

## blocker 根因与解除（2026-06-22）

### 根因（已修正为精确诊断）

- Supabase Dashboard → Authentication → Providers → Google：`Enable Sign in with Google` 已开、`Client IDs` 已填，但 **`Client Secret (for OAuth)` 为空**。
- 直连真实 authorize URL 复测对应表现：
  - `GET https://tsqgetxhyitltgztxymd.supabase.co/auth/v1/authorize?provider=google`
  - → `400 validation_failed` / `Unsupported provider: missing OAuth secret`
- 即：provider 已启用、Client ID 已填，唯一缺口是 Client Secret 未写入/未保存。不是 ForgeNote 代码、Vercel framework、Preview env 或 Deployment Protection 问题。

### 解除动作

1. 在 Supabase → Authentication → Providers → Google 填入对应 Google OAuth Client 的 **Client Secret** 并保存（Owner 本人在控制台完成，未打印 secret）。
2. URL Configuration → Redirect URLs 已确认包含 Preview 回调：
   `https://forge-note-git-i-01-forge-workspace-lstosts-projects.vercel.app/auth/callback`（无需新增）。
3. 复测同一 authorize URL：
   - `GET .../auth/v1/authorize?provider=google` → **HTTP 302**，重定向到 `accounts.google.com/o/oauth2/v2/auth`，携带正确 `client_id` 与 `redirect_uri=...supabase.co/auth/v1/callback`。`missing OAuth secret` 错误消失。

## 登录态 Preview 验收（通过）

> 真实 Chrome（Owner 已登录 Google `dennisliu1225@gmail.com`）在 Preview 分支别名上完成。

| 场景 | 预期 | 实测 |
|---|---|---|
| Preview `/login` 点「使用 Google 登录」 | 跳 Google OAuth | 通过，进入 Google 账户选择 → 同意页（scope：name/profile/email） |
| 完成 OAuth 同意 → `/auth/callback` | 回调登录并进 `/forge` | 通过，回调直接落 `/forge`，TopNav 显示 `dennisliu1225@gmail.com` + 退出 |
| `/forge` 生成 | 成功生成并落库 | 通过，session `939ec634-dddd-410d-98eb-78128f5eab9f`；Outcome（定位/标题/正文/卡片 Prompt×6/话题/评论引导）完整，假设条可见 |
| session 可回看 | `?session=` 回填 | 通过，`/forge?session=939ec634-...` 回填内容 |
| `/recipes` | 登录态可访问 | 通过，配方库页渲染（搜索/筛选/新建/空态） |
| `/profile` | 登录态可访问 | 通过，偏好页渲染（新增偏好表单/空态） |
| I-12 表现回填写入 | 保存成功 | 通过，填入 点赞 `11-50`/收藏 `51-100`/评论 `1-10`/涨粉 `0` + 一句话复盘 → 「✓ 已记录表现」 |
| I-12 表现回填读回 | 重开预填 | 通过，`/forge?session=` 重开表现面板预填回 `11-50 / 51-100 / 1-10 / 0` |

## 结论

- Preview / 部署环境验收：**通过**。
- 已解决：CI、Vercel framework 404、Preview 必需 env、PR Preview redeploy、未登录页面/API 边界、Supabase Google provider（补 Client Secret）、登录态主路径与全套登录态验收。
- 残余说明：Deployment Protection 仍开启（未认证公网访问得到 Vercel 401 为预期保护）；登录态验收经 Owner 已认证的浏览器完成，未公开 bypass URL。
- PR #1 登录态主路径已完整通过，可考虑从 Draft 转 Ready（按 Owner 决定）。
