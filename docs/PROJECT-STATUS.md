# ForgeNote Project Status

## 当前里程碑
M1

## 当前票
I-10 — 配方详情 `/recipes/[id]` + 换输入重跑（Done）

## 当前分支
i-01-forge-workspace

## 当前 PR
PR #1 Draft：https://github.com/LSTOST/ForgeNote/pull/1

## 方向变更：v5 选择性折叠（2026-06-21，待技术负责人 Codex 确认）

**变化**：产品方向调整为「国际 + 图文卡片/carousel + 多语言」（放弃大陆），但 M1 **保留 v4 小红书已建代码不推翻**，只做 additive 选择性折叠。

**权威记录**：`DECISIONS.md`「v5 选择性折叠」D-06 / D-07 / D-08；`TICKETS.md` I-15 / I-16；`PRD-M1.md` §2、§4.3。

**边界（review / 验收须守住）**
- 当前唯一任务仍是 **I-10**；I-15 / I-16 为 Backlog，**不抢占 I-10**。
- login / forge / recipes 已建代码不动。
- **D-01 不变**：`content_package` 冻结，M1 不改名 `carousel_package`。
- M1 不收费；Stripe / 去小红书化 / taxonomy 改名延后（D-08）。

**现在折叠（D-07，additive）**：I-15 i18n 文案外化、I-16 `output_locale` 预留、§4.3 商业化定位。

**待 Codex 判定**
1. 折叠拆分（i18n 现在 / taxonomy 延后）是否技术合理、有无更优切法。
2. **I-15 排期**：i18n 文案外化越晚越贵（已有中文文案写死在组件里），是否应排在 I-11 `/profile` 等更多 UI 页面之前、甚至紧跟 I-10？
3. I-16 `output_locale` 列：并进下一次 migration 还是单独一张？确认 additive 不影响现有 RLS / 契约。

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

## 已完成（I-08 — 保存配方最小闭环）
- 新增 `POST /api/recipes`（必须登录；`{ sessionId, name }`）：name trim 非空、RLS 校验 session 归属、要求 recipe_snapshot、写入 recipes（fields=快照、acceptance/variables/negative_rules 拆出、source_session_id 关联），同名允许不覆盖
- `RecipePanel` 成功态启用「保存配方」：命名 UI（默认值=配方名）/ 名称空禁用 / 保存中 loading / 「已保存到配方库」/ 失败 inline error 不清空结果
- `ForgeWorkbench` 透传 `sessionId` 给 `RecipePanel`，并以 `key={sessionId}` 重挂重置保存态
- 边界：不做 /recipes 列表、详情、重跑、偏好记忆、F-16，不改模型 prompt
- 自动验证：lint/typecheck/build/doctor/smoke:api 通过；匿名 `POST /api/recipes` → 401 AUTH_REQUIRED 实测通过
- 登录态验收：真实 Chrome 登录态下完成生成→保存→Supabase SQL Editor 核对；同一 session 保存同名两次得到 2 条 recipes，且 user_id/source_session_id/intent_type/fields/acceptance/variables/negative_rules 全部匹配；空名称 UI 禁用保存。认证态 API 负例受浏览器自动化无法导出 cookie/发任意 XHR 限制，未直接 HTTP 执行，已按 route 代码路径核对并记录为残余风险（见 docs/acceptance/I-08.md）

## 已完成（I-09 — 配方库列表 / 搜索 / 筛选 / 删除）
- 新增受保护 `/recipes` 页面：Server Component 鉴权，未登录 → `/login`；登录后用 Auth cookie 绑定 Supabase client 直接读取 recipes，依赖 RLS + `deleted_at is null` 只展示当前用户可见记录
- 列表展示：名称、`intent_type`、从 `fields` 提取的摘要、`created_at`、`updated_at`、`usage_count`、`source_session_id`
- 搜索 / 筛选：URL 参数 `q` 按 name 搜索；`intentType` 仅接受 M1 canonical intent；无结果空态与筛选 loading 状态齐全
- 删除：新增 `DELETE /api/recipes/:id`，鉴权后按 UUID + `user_id` + `deleted_at is null` 软删除；他人 / 不存在 / 已删除统一 `RECIPE_NOT_FOUND`
- UI 删除防误触：先进入“确认删除？”态，取消不改变列表；确认后显示删除中 / 成功反馈并更新列表
- 自动验证：lint/typecheck/build/doctor/smoke:api 通过；未登录 `/recipes` → 307 `/login`、未登录 DELETE → 401 `AUTH_REQUIRED`
- 登录态验收：真实 Chrome 登录态下 `/recipes` 初始 2 条 → 搜索“备用金”命中 → 筛选 content_package 命中 → 无结果空态 → 删除一条重复配方 → 刷新后当前用户仅可见 1 条（见 docs/acceptance/I-09.md）

## 已完成（I-10 — 配方详情 + 换输入重跑）
- 新增受保护 `/recipes/[id]` 详情页：Server Component 鉴权，未登录 → `/login`；按 RLS + `deleted_at is null` 读取当前用户可见 recipe；非法 UUID / 他人 / 不存在 / 已删除统一渲染「配方不存在或不可见」态，不泄露存在性
- 详情展示：`name`、`intent_type`、`created_at`、`updated_at`、`usage_count`、`source_session_id`、核心 `fields`（受众/目标/语气/视觉规范）、`structure`、`variables`、`negative_rules`、`acceptance`、`schema` 摘要
- 列表进入详情：`/recipes` 每条 recipe 的名称与「查看详情」均链接到 `/recipes/[id]`；删除防误触逻辑保留
- 换输入重跑：详情页新输入 textarea，空 / 超 8000 字 disabled（对齐现有上限）；提交 `POST /api/recipes/:id/rerun` 沿用配方生成新 session，成功后跳 `/forge?session=<新 sessionId>` 查看结果
- 新增 `POST /api/recipes/:id/rerun`：鉴权 → body 校验 → UUID → 输入空/超长 → RLS 读 recipe；沿用 recipe `fields` 派生 `source="recipe"` 假设喂入生成；新 session 记 `source_recipe_id=recipe.id`，原 recipe 不被覆盖；成功后 `usage_count + 1`；失败落 D-04 草稿。错误码对齐 API-CONTRACT（AUTH_REQUIRED / RECIPE_NOT_FOUND / INPUT_EMPTY / INPUT_TOO_LONG / GENERATION_FAILED / MODEL_NOT_CONFIGURED / DATABASE_ERROR / VALIDATION_FAILED）
- `/forge` 最小改造：可选读取 `?session=<id>`，按 RLS 预载该 session 并复用 OutcomePanel/RecipePanel 呈现（completed→成功态；draft/失败→回填输入 + 错误态）
- 边界：不做多版本 diff / 高表现排序 / Profile 偏好 / I-11 / I-15 / I-16；不改 `content_package` 命名、不引入 `output_locale`、不改模型 prompt、不改 I-08/I-09 逻辑
- 自动验证：lint/typecheck/build/doctor/smoke:api 通过；匿名 `POST /api/recipes/:id/rerun` → 401 AUTH_REQUIRED、非法 JSON → 400 VALIDATION_FAILED、未登录 `/recipes/[id]` → 307 `/login`
- 登录态验收：真实 Chrome 登录态下进入详情 → 字段可见 → 空/超 8000 字禁用重跑 → 输入新主题重跑成功 → 落到 `/forge?session=` 呈现新结果（沿用配方假设）→ `usage_count` 0→1 → 原 recipe 未被覆盖（见 docs/acceptance/I-10.md）

## 进行中
- `/profile` 偏好页尚未交付（I-11）；v5 选择性折叠 I-15 / I-16 为 Backlog

## 已通过验收
- I-10：配方详情 + 换输入重跑通过自动验证与真实 Chrome 登录态验收，进入 Done
- I-09：配方库列表、搜索、类型筛选、删除通过自动验证与真实 Chrome 登录态验收，进入 Done
- I-08：保存配方最小闭环通过登录态核心验收，进入 Done
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
I-15 — i18n 文案外化（UI 文案抽资源文件，en + zh-Hans 脚手架，不改行为；不抢做 I-16 / I-11）

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
2026-06-21 (I-10 配方详情 + 换输入重跑完成；真实 Chrome 登录态下进入详情、空/超长禁用、新主题重跑成功落到 /forge?session= 呈现新结果、usage_count 0→1、原 recipe 未覆盖；下一张唯一任务 I-15)
2026-06-21 (I-09 配方库列表 / 搜索 / 筛选 / 删除完成；真实 Chrome 登录态下删除一条重复配方后刷新确认当前用户仅可见 1 条；下一张唯一任务 I-10)
2026-06-21 (记录「v5 选择性折叠」方向变更：保留 v4 代码，新增 Backlog I-15/I-16，待 Codex 确认 I-15 排期；详见本文件「方向变更」节与 DECISIONS)
