# M1 Preview / 部署环境验收

> 范围：PR #1（`i-01-forge-workspace`）的 Vercel Preview / 部署环境验收。仅部署与环境验证，不写业务功能。
> **状态：Blocked（仅登录态受阻）。** CI 绿；Vercel framework 404 已修；Preview 必需 env 已配置并重新部署；未登录页面/API 边界通过。唯一剩余 blocker：当前 Chrome 环境拦截 Supabase Auth 域名，导致 Google 登录/回调和登录态主路径无法完成。

## 当前部署

- **HEAD**：`c18394a docs(deploy): record preview env blocker`
- **GitHub Actions**：run `27906078732` → `success`
- **PR Preview redeploy**：`dpl_HYpjff1BTpP76ncWZCoVoEF3oNVQ` → `READY`
- **Preview URL**：`https://forge-note-jr6g1qo0n-lstosts-projects.vercel.app`
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
- 已 redeploy PR Preview：`dpl_HYpjff1BTpP76ncWZCoVoEF3oNVQ`。
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
- 当前 Chrome 环境显示：`ERR_BLOCKED_BY_CLIENT` / `tsqgetxhyitltgztxymd.supabase.co 已被屏蔽`。
- 判断：这是浏览器扩展/内容拦截器阻断 Supabase Auth 域名，不是 ForgeNote 代码、Vercel framework、Preview env 或 Supabase 配置缺失。

因此以下登录态验收未完成：

- Google OAuth / `/auth/callback`
- `/forge` 登录态生成主路径
- `/recipes`
- `/profile`
- I-12 表现回填入口

## 解除 Blocked

1. 在 Chrome 中允许 `tsqgetxhyitltgztxymd.supabase.co`，或临时关闭拦截该域名的扩展。
2. 重新从 Preview 登录页点击 Google 登录。
3. 完成登录后按 `docs/DEPLOYMENT.md` 的 Preview 验收清单跑：
   - `/forge` 生成成功
   - session 落库/可回看
   - `/recipes` 可访问
   - `/profile` 可访问
   - I-12 表现回填入口可写入/读回
4. 全部通过后，PR #1 才能考虑从 Draft 转 Ready。

## 结论

- Preview / 部署环境验收：**部分通过，登录态 Blocked**。
- 已解决：CI、Vercel framework 404、Preview 必需 env、PR Preview redeploy、未登录页面/API 边界。
- 未解决：Chrome 环境拦截 Supabase Auth 域名，登录态主路径无法验收。
- **不建议转 Ready**。
