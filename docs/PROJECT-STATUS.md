# ForgeNote Project Status

## 当前里程碑
M1

## 当前票
Batch B — Supabase Auth 登录闭环（Codex 验收通过）

## 当前分支
i-01-forge-workspace

## 当前 PR
PR #1（待 GitHub 确认）

## 已完成
- I-01：Next.js 项目骨架
- `/forge` 静态页面
- 输入框与 8000 字限制
- 示例想法填充
- Outcome / Recipe 空态
- GitHub Actions CI 已配置
- lint / typecheck / build 已通过
- I-02A：OpenRouter 接入规则文档（docs/MODEL-INTEGRATION.md）
- I-02A：`.env.example`
- I-02A：AI 生成类型契约（src/lib/ai/types.ts）
- I-02A：mock generator（src/lib/ai/mock-generator.ts）
- I-02A 契约修正补丁：Assumption source/state/valueType 对齐 DATA-SCHEMA；Verification 改为 overallPassed + checks；Outcome 命名对齐（titles/cardStructure/cardPrompts 等）；失败草稿补 intentType/assumptions/errorCode（D-04）

## 进行中
- Batch B Codex 验收通过，待 Supabase env 可用环境复验真实登录：Supabase Auth 登录闭环（Magic Link + Google OAuth）+ 受保护 `/forge`
- 真实登录路径（真实 OAuth / Magic Link / callback 写 cookie / 登录后写库）仍待 Supabase env + provider 复验
- `/recipes` 与 `/profile` 仍是占位链接，本批未交付配方库 / Profile

## 已完成（Batch B）
- 浏览器端 Supabase 客户端 helper（`src/lib/supabase/client.ts`，anon key，不含 service role）
- `/login` 页（UIUX §4）：产品名 / slogan / Google 登录 / 邮箱 Magic Link，含登录中/失败/已发送状态；env 缺失显示明确「未配置」提示，不白屏
- `/auth/callback`：PKCE code 交换 session，成功跳 `/forge`，失败跳 `/login?error=`
- `/auth/signout`：POST 清 cookie，跳 `/login`；TopNav 提供原生表单退出入口
- `/forge` 受保护：未登录（或未配置）→ `/login`；已登录 `/login` → `/forge`
- TopNav 显示当前用户 email + 退出按钮
- `/api/forge` 仍必须登录（未改动，AUTH_REQUIRED 兜底保留）

## 阻塞项
- OpenRouter 真实 API Key 尚未配置
- Supabase env（NEXT_PUBLIC_SUPABASE_URL / ANON_KEY）+ Google provider 待配置后做真实登录复验
- Vercel Preview 未确认
- Codex GitHub App 未确认

## 下一张唯一任务
待定（Batch B 已通过 Codex 验收；候选：假设条编辑器、配方保存/配方库、Profile/偏好）

## 最近一次验收结果（Batch B）
- npm run lint：通过
- npm run typecheck：通过
- npm run build：通过（路由：`/forge`、`/login`、`/auth/callback`、`/auth/signout` 均为 ƒ 动态；`/api/forge`、`/api/sessions/[id]` 为 ƒ 动态）
- Codex 验收：通过，已复验 lint / typecheck / build 通过；build 在联网环境通过
- 仍待 Supabase env + provider 复验：真实 OAuth / Magic Link / callback 写 cookie / 登录后写库
- 范围说明：`/recipes`、`/profile` 仍为占位链接，本批未交付配方库 / Profile

## 最后更新时间
2026-06-20 (Batch B 通过 Codex 验收，自动校验通过，待 Supabase env 复验真实登录)
