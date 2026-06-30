# ForgeNote Deployment

> Vercel Preview / Production 发布检查表。基线：当前 HEAD（Batch A/B/C 后，已含登录闭环）。

## 环境变量

必须在 Vercel Project Settings 中配置（Preview / Production 分开）：

```text
OPENROUTER_API_KEY            # 仅服务端读取，绝不进客户端 bundle
OPENROUTER_MODEL
NEXT_PUBLIC_SUPABASE_URL      # 公开配置，受 RLS 保护
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

可选（仅离线/管理任务，请求路径不使用）：

```text
SUPABASE_SERVICE_ROLE_KEY    # 绕过 RLS，绝不可在客户端暴露
```

可选观测（I-14，全部可选；不配置则观测 scaffold 为 no-op，应用照常运行、build 不受影响）：

```text
SENTRY_DSN                   # 服务端错误上报（非公开，仅服务端读取）
NEXT_PUBLIC_POSTHOG_KEY      # 前端事件（公开配置）
NEXT_PUBLIC_POSTHOG_HOST     # 可选，自托管 PostHog 时用
```

启用说明（I-14 现状）：
- 当前为 **scaffold + no-op**：`src/lib/observability.ts` 提供稳定调用点（`captureServerError` / `trackClientEvent`），未配置 env 时全部 no-op，**不引入 Sentry / PostHog SDK、不硬连服务**。
- 配置上述 env 后，仍需后续票接入真实 SDK（在 `observability.ts` 的 TODO 处）才会真正上报；只填 env 不会自动外发。
- 安全：观测**不采集用户输入全文**（rawInput / outcome / 复盘正文等不上报）；secret 不进客户端、不打印。

规则：

- Preview 和 Production 分开配置。
- 真实 key 不允许提交到仓库、不允许打印到日志。
- 客户端代码只读 `NEXT_PUBLIC_*`；模型 key 只在服务端 route handler 读取。
- `/api/forge`、`/api/sessions/:id` 以「anon key + 用户 Auth cookie」身份读写，靠 RLS 隔离用户，不使用 service role。

## 数据库迁移

- 当前 schema：`supabase/migrations/0001_init.sql`（五张业务表 + RLS）+ `supabase/migrations/0002_output_locale.sql`（I-16：`sessions.output_locale`，nullable additive）。
- 部署到新环境后，**按序应用 0001 → 0002**，确认迁移已应用，并跑 RLS 检查：

```bash
DATABASE_URL='postgres://...' npm run db:test-rls
```

## Preview 验收

1. Vercel build 通过。
2. 打开 Preview URL。
3. 完成登录（邮箱密码主路径 / Google 备选），进入 `/forge`。
4. 输入一条真实样例：

```text
想做一组小红书卡片，主题是第一次独居备用金清单
```

5. 确认：
   - 未登录访问 `/forge` 会跳 `/login`，无白屏。
   - 登录后 `/api/forge` 不返回 `AUTH_REQUIRED`。
   - 配好模型 env 时不返回 `MODEL_NOT_CONFIGURED`。
   - Outcome / Recipe 字段完整，Verification 可见。
   - 生成失败时错误态清楚，输入与假设保留（D-04 草稿）。

## Production 上线就绪清单（I-19）

> 目标：把 M1 推到真实用户可登录使用的 Production，拿到第一份真实使用证据（Gate 3/4）。
> 角色：以下「Owner 配置」项需在 Vercel / Supabase 控制台操作，代码侧不内嵌任何 key、不代为操作。

**1. Vercel Production env（与 Preview 分开配置）**

```text
OPENROUTER_API_KEY            # 仅服务端
OPENROUTER_MODEL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
# 可选观测（不配则 no-op）：SENTRY_DSN / NEXT_PUBLIC_POSTHOG_KEY / NEXT_PUBLIC_POSTHOG_HOST
```

**2. Supabase Auth（Production）**

- Site URL / Redirect URLs 加入 Production 域名的 `/auth/callback`。
- Redirect URLs 同时确认允许 `/auth/callback?next=/login/reset` 回跳，用于密码重置后设置新密码。
- Google provider：enabled + Client ID + **Client Secret 必须填**（Preview 期 blocker 根因即 Client Secret 为空 → `400 validation_failed` / `missing OAuth secret`，见 `docs/PROJECT-STATUS.md`）。
- Email provider：确认注册确认邮件与密码重置邮件可发送。当前产品不再暴露 Magic Link 登录入口。
  - Production/Preview 不应长期依赖 Supabase 默认邮件发送；QQ / 企业邮箱可能拦截默认系统邮件。
  - 上真实用户前必须配置可靠自定义 SMTP（如 Resend/Postmark/SendGrid 或 Owner 已验证的 SMTP），并至少用一个 QQ 邮箱 + 一个非 QQ 邮箱实测注册确认与密码重置送达。
  - 代码侧只负责 `signUp` / `auth.resend(type="signup")` / `resetPasswordForEmail` 调用和恢复入口；邮件送达率属于 Supabase Auth 发信配置。
- Auth session / refresh token 策略需与 30 天登录承诺一致；代码侧 Auth cookie maxAge 为 30 天。

**3. 数据库迁移（Production DB）**

- 按序应用 `0001_init.sql` → `0002_output_locale.sql`。
- 跑 RLS 检查：`DATABASE_URL='postgres://...' npm run db:test-rls`（五表 RLS + policy）。

**4. Deployment Protection 决策**

- 若要真实用户直接访问：关闭 Deployment Protection，或提供 bypass / 自定义域名。
- 未认证公网返回 401(SSO) 属保护开启时的预期；真实用户验收前必须确认入口可达。

**5. 上线前自动验证**

```bash
npm run doctor
npm run lint
npm run typecheck
npm run build
```

**6. 真实用户路径验收（Gate 3）**

- 真实用户在 Production 跑通主路径，证据写入 `docs/acceptance/I-19.md`（环境=Production、用户身份、路径、实测、证据、残余风险）。

**7. 指标读出（Gate 4）**

- 用只读脚本从 Production DB 读出首批 6 个验证指标（不接第三方 SDK；不取输入全文/不打印 secret）：

```bash
DATABASE_URL='postgres://...' npm run metrics
```

## Production 上线前

```bash
npm run doctor
npm run lint
npm run typecheck
npm run build
```

如果 Preview 已配置真实模型，可对 Preview 跑匿名冒烟（验证鉴权边界）：

```bash
FORGENOTE_BASE_URL=https://your-preview-url.vercel.app npm run smoke:api
# 期望：合法 body → AUTH_REQUIRED；非法 JSON → VALIDATION_FAILED
```

> 登录态成功路径与 eval 需带 Auth cookie，属手工/`node scripts/eval-forge.mjs` 范畴（I-13）。

## 回滚

1. Vercel Dashboard 找到上一个稳定 deployment。
2. Promote / Rollback 到稳定版本。
3. 在 `docs/PROJECT-STATUS.md` 记录：回滚时间 / 原因 / 影响范围 / 后续修复票号。

## 发布记录模板

```text
版本：
日期：
提交：
Preview URL：
Production URL：
变更：
验证命令：
人工验收：
风险：
回滚方案：
```
