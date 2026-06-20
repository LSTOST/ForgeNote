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

规则：

- Preview 和 Production 分开配置。
- 真实 key 不允许提交到仓库、不允许打印到日志。
- 客户端代码只读 `NEXT_PUBLIC_*`；模型 key 只在服务端 route handler 读取。
- `/api/forge`、`/api/sessions/:id` 以「anon key + 用户 Auth cookie」身份读写，靠 RLS 隔离用户，不使用 service role。

## 数据库迁移

- 当前 schema：`supabase/migrations/0001_init.sql`（五张业务表 + RLS）。
- 部署到新环境后，确认迁移已应用，并跑 RLS 检查：

```bash
DATABASE_URL='postgres://...' npm run db:test-rls
```

## Preview 验收

1. Vercel build 通过。
2. 打开 Preview URL。
3. 完成登录（Google / 邮箱 Magic Link），进入 `/forge`。
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
