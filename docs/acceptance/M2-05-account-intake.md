# M2-05 Acceptance — Account Intake（首屏账号接入）

## 结论

- Status: Pass（Owner 浏览器验收通过）
- Date: 2026-07-04
- Scope implemented: 账号接入完整垂直——`/first-run` 页 + `AccountIntake` 组件 → `POST /api/account/intake` →
  反编造生成账号记忆（M2-05 域核心）→ 写 `account_memory_items`（RLS）→ 展示账号大脑。
  顺带落地纸感 tokens（globals.css，M2-09 down-payment）。
- Scope not touched: 结构生成/渲染/配方路由（M2-07/08/10 路由）、`/workspace` 工作台 UI、
  选题雷达、Gate 0 埋点、旧 `/forge` `/recipes`（M2-15 才清理）。

## 实现验收

- `/first-run` 为 Server Component，未登录 → `redirect("/login")`（DAL 纵深防护，与路由 RLS 双层）。
- `POST /api/account/intake`：zod 校验 → `getAuthenticatedContext` 鉴权 → `generateAccountMemory` →
  批量写 `account_memory_items`（`user_id` 由登录用户，RLS 生效）；无用户绝不调 OpenRouter/不落库。
- 反编造：只持久化通过过滤的 items（来源在 ledger 内 + 有证据），`dropped` 不落库。
- UI 展示账号大脑：kind 中文标签 + 来源标签 + 证据数；body 结构化键值。

## 自动验证（Claude Code 已执行）

```bash
npm run typecheck        # ✓
npm run lint             # ✓
npm run check:intake     # ✓ 保留3/丢弃4，无效来源/未知类别/无证据/仅正文全拦截
# 真实模型验证（gpt-4o-mini）：账号接入 prompt→模型→解析→反编造 端到端
#   结果：保留 5 条、0 丢弃、覆盖全部 5 类（受众/声音/规律/主题/视觉偏好），反编造无误伤
# dev server + curl：/api/account/intake 非法JSON→400、未登录→401（auth 门控先于业务校验）
#   /first-run 未登录→307 /login、编译无错、重定向后 200
# migration 0003 已 apply 到 live 库；7 表 + RLS 经 PostgREST(443) 确认
```

## Owner 浏览器验收（真实用户路径）

- 登录后访问 `/first-run`，粘贴真实 profile / 近期内容 / 表现数据。
- 点「生成账号大脑」→ 账号记忆卡片正常生成并展示（来源标签 + 证据数）。
- 账号记忆持久化到 `account_memory_items`（RLS 隔离到本人）。
- 视觉：纸感暖色 + 橙色主按钮，符合冻结设计基调。

## 备注

- 未由本机执行的验证：DDL 迁移（直连 5432 被本机代理挡，走 SQL Editor）、
  写库 happy-path 与浏览器交互（需登录会话，由 Owner 完成）。
- 本验收针对 M2-05 切片；不等同于产品级 Gate 0（Owner 连续 4 周真实周更）。
