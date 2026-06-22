# M1 Preview / 部署环境验收

> 范围：PR #1（`i-01-forge-workspace`）的 Vercel Preview / 部署环境验收。仅部署与环境验证，不写业务功能。
> **状态：Blocked（仅登录态受阻）。** CI 绿；Vercel framework 404 已修；Preview 必需 env 已配置并重新部署；未登录页面/API 边界通过。唯一剩余 blocker：Supabase Auth 的 Google provider 未启用，导致 Google 登录/回调和登录态主路径无法完成。

## 当前部署

- **HEAD**：`45ab379 docs(deploy): record preview auth retry blocker`
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

## 仍 Blocked

### 登录态 Preview 验收

- Chrome 打开 Preview 登录页正常。
- 点击「使用 Google 登录」后跳到 Supabase Auth authorize URL：
  - `https://tsqgetxhyitltgztxymd.supabase.co/auth/v1/authorize?...`
- 2026-06-22 复测修正：Chrome/内置浏览器的表现曾误判为客户端拦截；用同一真实 authorize URL 直接请求 Supabase Auth 后，返回：
  - `400 validation_failed`
  - `Unsupported provider: provider is not enabled`
- 判断：根因是 Supabase Auth project 尚未启用 Google provider（或 Google OAuth client 未配置完成），不是 ForgeNote 代码、Vercel framework、Preview env 或 Deployment Protection 问题。

因此以下登录态验收未完成：

- Google OAuth / `/auth/callback`
- `/forge` 登录态生成主路径
- `/recipes`
- `/profile`
- I-12 表现回填入口

## 解除 Blocked

1. 在 Supabase Dashboard → Authentication → Providers 中启用 Google。
2. 配置 Google OAuth Client ID / Client Secret，并确认 Google OAuth redirect URI 使用 Supabase 项目的 callback URL（形如 `https://tsqgetxhyitltgztxymd.supabase.co/auth/v1/callback`）。
3. 保持 ForgeNote Preview 的 app callback：`https://forge-note-git-i-01-forge-workspace-lstosts-projects.vercel.app/auth/callback` 可被 Supabase 作为 `redirect_to` 接受。
4. 重新从 Preview 登录页点击 Google 登录。
5. 完成登录后按 `docs/DEPLOYMENT.md` 的 Preview 验收清单跑：
   - `/forge` 生成成功
   - session 落库/可回看
   - `/recipes` 可访问
   - `/profile` 可访问
   - I-12 表现回填入口可写入/读回
6. 全部通过后，PR #1 才能考虑从 Draft 转 Ready。

## 结论

- Preview / 部署环境验收：**部分通过，登录态 Blocked**。
- 已解决：CI、Vercel framework 404、Preview 必需 env、PR Preview redeploy、未登录页面/API 边界。
- 未解决：Supabase Auth Google provider 未启用，登录态主路径无法验收。
- **不建议转 Ready**。
