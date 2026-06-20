# ForgeNote Project Status

## 当前里程碑
M1

## 当前票
Batch C — 假设条编辑器 + 结果操作区最小闭环（Codex 验收通过）

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
- QA-01：现代化恢复工程工具链（基于当前 HEAD，不回滚 I-02B）——`scripts/doctor.mjs`（只查存在性、不打印 secret）、`scripts/smoke-forge-api.mjs`（匿名期待 AUTH_REQUIRED）、`scripts/test-rls.mjs`、`scripts/eval-forge.mjs` + `eval/cases/content-package.json`（I-13 种子，未纳入 npm/CI）；`docs/RUNBOOK.md`、`docs/DEPLOYMENT.md`、`docs/TICKETS.md`、`docs/acceptance/Batch-C.md`、`.github/pull_request_template.md`；package.json 增 `doctor`/`smoke:api`/`db:test-rls`；CI 增 Doctor step

## 进行中
- `/recipes` 与 `/profile` 仍是占位链接，尚未交付配方库 / Profile

## 已通过验收
- Batch C：Codex 验收通过；登录态真实浏览器验收通过
- Batch B：Codex 验收通过
- B-Verify：登录闭环 + RLS + draft 落库，真实 Supabase env 下通过
- G-Verify：OpenRouter 真实生成 `status=completed` 落库通过（真实 session 示例：`bd456b28-2ebd-46ad-ad6c-594f64335dba`）

## 已完成（Batch C — 假设条编辑器 + 结果操作区）
- 新增 `src/components/forge/AssumptionPanel.tsx`：假设条显示 / 行内编辑 value / dismiss / restore / 全部恢复 / 应用并重新生成（UIUX §6）
- `ForgeWorkbench`：假设条客户端状态机（首次成功后注入 UIUX §6.1 默认种子；客户端为唯一真相，保留 dismissed 以便恢复）；重新生成只提交 state != dismissed 的假设
- `OutcomePanel`：操作区 — 复制全文 / 复制正文 / 复制卡片 Prompt / 复制话题 / 重新生成 / 新建（轻量「已复制」反馈，不引 toast 库）
- `RecipePanel`：复制配方摘要 + 「保存配方（下一批开放）」禁用占位
- 边界：不接 profile_preferences、不做偏好记忆、不做 question 流程、不新增 API / migration / 依赖、不真正保存 recipes

## 文档/契约冲突（仅记录，不自行扩范围）
- UIUX §6.2 将 `source` 列为 `inferred / profile / edited`，但 `AssumptionSource` 类型为 `inferred / profile / manual / recipe`（无 `edited`）；`edited` 实为 `state`。本批以类型/DATA-SCHEMA 为准：编辑时设 `state="edited"`、`source` 不变。待后续统一文档措辞。

## 已完成（Batch B）
- 浏览器端 Supabase 客户端 helper（`src/lib/supabase/client.ts`，anon key，不含 service role）
- `/login` 页（UIUX §4）：产品名 / slogan / Google 登录 / 邮箱 Magic Link，含登录中/失败/已发送状态；env 缺失显示明确「未配置」提示，不白屏
- `/auth/callback`：PKCE code 交换 session，成功跳 `/forge`，失败跳 `/login?error=`
- `/auth/signout`：POST 清 cookie，跳 `/login`；TopNav 提供原生表单退出入口
- `/forge` 受保护：未登录（或未配置）→ `/login`；已登录 `/login` → `/forge`
- TopNav 显示当前用户 email + 退出按钮
- `/api/forge` 仍必须登录（未改动，AUTH_REQUIRED 兜底保留）

## 阻塞项
- Google provider 是否已配置未确认（Magic Link 已通；Google OAuth 待 Owner 确认）
- Vercel Preview 未确认
- Codex GitHub App 未确认

## 下一张唯一任务
待定（候选：配方保存/配方库、Profile/偏好）

## 最近一次验收结果（Batch C）
- npm run lint：通过
- npm run typecheck：通过
- npm run build：通过（路由表不变：`/`、`/_not-found` 静态；`/api/forge`、`/api/sessions/[id]`、`/auth/callback`、`/auth/signout`、`/forge`、`/login` 均为 ƒ 动态）
- 登录态真实浏览器验收：通过
- edited assumption 落库：通过
- dismissed assumption 不提交：通过
- restore 后重新提交：通过
- 复制操作（全文/正文/卡片 Prompt/话题/配方摘要）与新建清空：通过

## 最后更新时间
2026-06-20 (Batch C 通过验收 + QA-01 工具链现代化恢复：doctor/smoke/RLS 检查 + RUNBOOK/DEPLOYMENT/TICKETS/PR 模板 + CI Doctor step；lint/typecheck/build/doctor/smoke:api 通过)
