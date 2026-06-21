# ForgeNote Project Status

## 当前里程碑
M1

## 当前票
M1 Preview / 部署环境验收（进行中 → **Blocked**，见 docs/acceptance/Preview-M1.md）。代码侧 I-08~I-17 已全部 Done 且本地验收全绿；Preview 因 Vercel Deployment Protection 无法访问，未转 Ready。

## 当前分支
i-01-forge-workspace

## 当前 PR
PR #1 Draft：https://github.com/LSTOST/ForgeNote/pull/1

## 方向变更：v5 选择性折叠（2026-06-21，待技术负责人 Codex 确认）

**变化**：产品方向调整为「国际 + 图文卡片/carousel + 多语言」（放弃大陆），但 M1 **保留 v4 小红书已建代码不推翻**，只做 additive 选择性折叠。

**权威记录**：`DECISIONS.md`「v5 选择性折叠」D-06 / D-07 / D-08；`TICKETS.md` I-15 / I-16；`PRD-M1.md` §2、§4.3。

**边界（review / 验收须守住）**
- I-12 / I-13 / I-14（Batch D）+ I-17（i18n 资源 scaffold）已完成；M1 计划票全部交付。
- login / forge / recipes 已建代码不动。
- **D-01 不变**：`content_package` 冻结，M1 不改名 `carousel_package`。
- M1 不收费；Stripe / 去小红书化 / taxonomy 改名延后（D-08）。

**现在折叠（D-07，additive）**：I-15 产品文案 / UI 表述收敛、I-16 `output_locale` 预留、§4.3 商业化定位。

**已判定**
1. taxonomy / `content_package` 改名延后，D-01 不变。
2. I-15 已先于 I-11 完成产品表述收敛；原 i18n 资源文件外化另立 I-17，不抢占 I-11。
3. I-16 作为单独 migration 完成：nullable / additive / 不改 RLS / 不 default / 不 enum / 不 backfill。

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

## 已完成（I-15 — v5 选择性折叠文案 / 产品表述收敛）
- 产品定位文案从「只做小红书」收敛为「图文卡片 / carousel 内容工作台」（additive，保留小红书为适用场景之一，不推翻 v4 实现）
- `src/lib/constants.ts`：`PRODUCT_NAME`=「ForgeNote 图文卡片内容工作台」、`SLOGAN`=「把模糊想法，锻造成可发布的图文卡片内容包」；新增 `POSITIONING`（点明 carousel + 小红书/Instagram/LinkedIn carousel 场景，并声明 M1 不做自动发布、不做多语言生成）；`IDEA_PLACEHOLDER` 去小红书化；`EXAMPLE_IDEAS` 保留 1 个小红书示例 + 补 Instagram carousel / 通用图文卡片示例
- `src/app/layout.tsx` metadata title/description 同步；`/forge` header 增加 `POSITIONING` 副标题；`OutcomePanel` 正文区 label 与复制全文标题「小红书正文」→「发布正文」（纯 UI 文案，无行为变化）
- login / forge header 通过 `PRODUCT_NAME` / `SLOGAN` 常量自动收敛；`/recipes`、`/recipes/[id]` 既有文案已中性，无冲突
- 边界：不改 schema / RLS / 字段 / `content_package` / D-01；不做 `output_locale` / locale selector / 多语言生成 / prompt 改造；不改保存 / 删除 / rerun 业务逻辑；不引入新依赖。`xiaohongshu_note` intent 标签、`generate.ts` prompt 与 mock-generator 中的“小红书”属平台特定/生成链路，按边界不在 I-15 改动
- 自动验证：lint/typecheck/build（路由表不变）/doctor/smoke:api 全通过
- 登录态验收：真实 Chrome 登录态下 `/forge` 首屏定位已收敛为图文卡片 / carousel 工作台、示例含 Instagram carousel 场景、生成按钮空/非空态正常、`/recipes` 与 `/recipes/[id]` 文案无冲突、保存/删除/rerun 未因文案回归（见 docs/acceptance/I-15.md）

## 已完成（I-16 — output_locale 数据与生成链路支持）
- migration `0002_output_locale.sql`：`sessions` 增 `output_locale text` —— nullable、无 default、无 enum/check、不 backfill、不改 RLS；仅 sessions（recipes 本票不加）
- 类型：`ForgeGenerationRequest.outputLocale?: string | null`（可选、nullable，不是 enum，不与国家/平台绑定）
- API：`POST /api/forge`、`POST /api/recipes/:id/rerun` 可选 `outputLocale`（trim，空串→null，≤120 字，超长 → `VALIDATION_FAILED`，鉴权顺序不变）；写入新 session；`GET /api/sessions/:id` 返回 `outputLocale`
- 生成链路：仅当 `outputLocale` 非空时向生成请求追加最小输出语言/表达偏好约束；无 locale 时输出行为完全不变
- 非破坏保障：route 仅在 `outputLocale` 非空时写 `output_locale` 列（条件 spread），未指定 locale 的既有流程即使 0002 未应用也不依赖该列、不回归
- UI：`/forge`（ForgeWorkbench）与 `/recipes/[id]`（RecipeRerun）各增「输出语言 / 表达偏好（可选）」自由文本输入（非下拉枚举，maxLength 120）；成功后若 session 有 outputLocale 在结果 meta 区轻量展示；`/forge?session=` 预载回填
- 边界：不做 I-11 / Profile 偏好 / UI 多语言切换 / i18n 资源文件外化 / 自动翻译 / locale 下拉 / 国家平台绑定；不改 `content_package`、不改 intent enum、不改 RLS、不重写 prompt、不引入依赖
- 自动验证：lint/typecheck/build（路由表不变）/doctor/smoke:api 全通过；匿名边界：forge/rerun 带 outputLocale → 401 AUTH_REQUIRED（schema 后鉴权）、超长 outputLocale → 400 VALIDATION_FAILED、不传 outputLocale → 旧行为不变
- 登录态验收：真实 Chrome 登录态下新输入控件渲染正常；无 locale 生成 200 成功（既有流程未回归）；migration 0002 已通过 Supabase SQL Editor 应用并由 `information_schema` 确认；带 locale 生成成功落 session 并回填；`/forge?session=` 回填 outputLocale；recipe rerun 带 locale 成功落新 session，原 recipe 未覆盖，`usage_count` 1→2（见 docs/acceptance/I-16.md）

## 已完成（I-11 — 偏好页 /profile：edited assumptions 写入并下次带出）
- 新增受保护 `/profile` 页面：Server Component 鉴权，未登录 → `/login`；按 RLS 读取当前用户 `profile_preferences`
- 偏好 CRUD：`GET`/`POST(upsert)` `/api/profile/preferences` + `PUT`/`DELETE` `/api/profile/preferences/:id`；他人/不存在/非法 id 统一 `PREFERENCE_NOT_FOUND`；不绕过 RLS
- `/profile` UI：新增（内容类型 + 维度名 + 维度 key + 值，upsert 覆盖）/ 行内编辑值 / 删除防误触 / 空态 / 刷新态 / 保存中 / 成功反馈 / 错误态
- 写入路径（edited assumptions 写入）：`/forge` AssumptionPanel 每条假设加「记住为偏好」（★）按钮 → upsert profile_preferences，含「已记住」反馈
- 带出路径（下次带出）：`/forge` Server Component 按 RLS 读取 content_package 偏好，映射为 `source="profile"` 假设作为初始种子注入 ForgeWorkbench；生成时随假设提交并落入 session.assumptions；AssumptionPanel 显示「来自偏好」标签
- 无 migration（`profile_preferences` 表与 RLS 在 0001 已存在）；不改 `content_package` / `output_locale` / prompt / RLS；不做自动学习 / F-16 / i18n
- back-compat：无偏好时 `/forge` 与 `/api/forge` 行为完全不变（空种子 = 旧行为）
- 自动验证：lint/typecheck/build（新增 `/profile`、`/api/profile/preferences`、`/api/profile/preferences/[id]`）/doctor/smoke:api 全通过；匿名边界：GET/POST/PUT/DELETE prefs → 401 `AUTH_REQUIRED`，非法 body/intent → 400 `VALIDATION_FAILED`，未登录 `/profile` → 307 `/login`

## 已完成（Batch D — I-12 表现回填 / I-13 eval 门禁 / I-14 观测 scaffold）
- I-12：新增 `POST /api/sessions/:id/performance`（API-CONTRACT §5.13）——必须登录、partial 更新自己的 session（RLS + user_id）、区间枚举校验、至少一项、他人/不存在→`SESSION_NOT_FOUND` 不泄露存在性、best-effort `usage_events.performance_filled`；`GET /api/sessions/:id` 增 `performance` 读回；`OutcomePanel` 增折叠「记录发布表现」入口（展开 GET 预填）。无 migration（F-16 列在 0001 已存在）。真实 Chrome 登录态：生成→回填 200「已记录表现」→ `/forge?session=` 重开预填回 `[11-50,51-100,1-10,0]`+复盘，持久化确认（见 docs/acceptance/I-12.md）
- I-13：`eval:forge` 纳入 npm；safe-mode——无 `FORGENOTE_AUTH_COOKIE` / `MODEL_NOT_CONFIGURED` → 明确 SKIP exit 0（不计失败、不打印 secret），cookie 失效 → FAIL，用例未过 → FAIL；doctor 纳入 `eval:forge` 检查；RUNBOOK 文档化运行方式 / 判定语义 / 为何不进 PR CI。eval **不进 PR CI**（避免缺 key/登录态无意义失败）。（见 docs/acceptance/I-13.md）
- I-14：`src/lib/observability.ts` 零依赖 no-op 观测 scaffold（`captureServerError` / `trackClientEvent`，未配 env 全 no-op、不引 SDK、不硬连、不采集输入全文）；`.env.example` 增可选 `SENTRY_DSN` / `NEXT_PUBLIC_POSTHOG_KEY` / `_HOST`；doctor 以 `info` 级别提示可选观测 env（不计 fail/warn）；DEPLOYMENT 增启用说明与安全约束。无 key 时 build / 运行不受影响。（见 docs/acceptance/I-14.md）
- 自动验证：lint/typecheck/build（新增 `ƒ /api/sessions/[id]/performance`，其余路由不变）/doctor（0 failed / 0 warnings）/smoke:api 全通过；`eval:forge` 无 cookie SKIP exit 0。

## 已完成（I-17 — UI copy resource extraction scaffold）
- 新增 `src/lib/copy/`：`zh-Hans`（规范源，current 文案逐字迁移）+ `en`（scaffold）+ `index`（`copy` 默认 zh-Hans / `dictionaries` / `getCopy(locale)`）；`Copy = typeof zhHans` + `en: Copy` 编译期保证 en/zh **key 不漂移**
- 代表性接线（live）：`TopNav`（导航标签 + 退出）、`/recipes` 页头（标题/描述/新建配方）、`/profile` 页头（标题/描述）；默认 zh-Hans，UI 文案逐字一致、行为不变
- 资源覆盖分组：nav / login / forge / recipes / recipeDetail / profile / outcome / recipePanel / assumptions；其余为 scaffold-only（增量采纳）
- 边界：不引入 i18n 依赖、不做运行时语言切换 / locale 路由 / 偏好持久化 / output_locale 联动 / 自动翻译；不改 prompt/DB/RLS/API；不改 Batch D / I-11；不重构组件结构；`constants.ts` 产品级文案不重复纳入
- 自动验证：lint/typecheck（en/zh key parity）/build（路由表不变）/doctor/smoke:api 全通过；Chrome smoke：`/recipes`、`/profile`、`/forge` 文案正确、无 raw key / undefined / [object Object]（见 docs/acceptance/I-17.md）

## 进行中
- M1 计划票全部交付（I-08~I-17，含 Batch D）。后续：真正多语言运行时切换 / scaffold-only 文案逐组接线（需另立票）；部署 / 观测 SDK 接入（I-14 后续）按技术负责人排期

## 已通过验收
- I-17：UI copy 资源 scaffold（en/zh key parity 编译期保证 + 代表性接线 + Chrome smoke）通过，进入 Done
- Batch D：I-12 表现回填（含真实 Chrome 登录态回填/读回）、I-13 eval 门禁（safe-mode 实测）、I-14 观测 scaffold（no-op / build 不破）均通过自动验证，进入 Done
- I-11：偏好页 `/profile` CRUD + `/forge` 偏好带出 + edited assumptions「记住为偏好」通过自动验证、匿名边界与真实 Chrome 登录态验收，进入 Done
- I-16：output_locale 数据与生成链路通过自动验证、匿名边界与真实 Chrome 登录态验收；migration 0002 已应用，带 locale 生成 / `/forge?session=` 回填 / rerun 带 locale / `usage_count` 增量均通过，进入 Done
- I-15：v5 选择性折叠文案 / 产品表述收敛通过自动验证与真实 Chrome 登录态验收，进入 Done
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
- Google provider 是否已配置未确认（Magic Link 已通；Google OAuth 待 Owner 确认；Preview 上受保护未验）
- **Vercel Preview 验收 Blocked**（见 docs/acceptance/Preview-M1.md）：集成在跑、HEAD `3e5a012` Preview 构建 success，但 Preview 受 **Deployment Protection** 保护——未认证 curl 401(SSO)、本机浏览器过 SSO 后 404(未授权)，本环境无 Vercel CLI/token/bypass，**无法访问 app 路由完成 Preview 功能验收**（未绕过）。Vercel env 存在性亦无法核验。解除方式见该文档。
- **GitHub Actions CI（npm ci）红 → 已修**：根因为 **npm 大版本不一致**——本机 node25/npm11 vs CI node20/npm10，lockfile 缺 npm10 期望的 `@emnapi/runtime@1.11.1` / `@emnapi/core@1.11.1`（`@tailwindcss/oxide-wasm32-wasi` wasm 回退嵌套 optional 依赖）。本机 npm11 重生成无效（CI 仍红）；改用 `npx npm@10 install --package-lock-only` 重生成（匹配 CI），`npx npm@10 ci --dry-run` exit 0；lockfileVersion 仍 3、root deps 未变、无源码改动。初判 flake 有误，已更正。
- Codex GitHub App 未确认

## 下一张唯一任务
（待技术负责人定）M1 计划票 I-08~I-17 已全部交付。候选后续：① 真正多语言运行时切换（locale 检测/选择/持久化 + scaffold-only 文案逐组接线）；② I-14 观测真实 SDK 接入；③ 部署 / Preview 验收（DEPLOYMENT 清单）。均需另立票。

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
2026-06-21 (CI 修复 v2：真因为 npm 版本不一致（本机 npm11 vs CI npm10），lockfile 缺 npm10 期望的 @emnapi/*@1.11.1 顶层节点；本机 npm11 重生成无效，改用 npx npm@10 install --package-lock-only 重生成、npm@10 ci --dry-run exit 0。Preview 仍受 Deployment Protection（401 SSO），验收维持 Blocked、不转 Ready)
2026-06-21 (M1 Preview/部署验收：Vercel 集成在跑、HEAD 3e5a012 Preview 构建 success，但 Preview 受 Deployment Protection → 未认证 401(SSO)/浏览器 404，无 Vercel CLI/token，app 路由不可达 → 验收 Blocked、不转 Ready；CI 本次红为 npm ci 瞬时失败（本地 npm ci exit 0，建议重跑）；本地 lint/typecheck/build/doctor/smoke/eval 全绿。详见 docs/acceptance/Preview-M1.md)
2026-06-21 (I-17 完成：src/lib/copy en+zh-Hans 资源 scaffold + typed helper（Copy=typeof zhHans，en:Copy 编译期保证 key 不漂移）；接线 TopNav / /recipes / /profile 页头；默认 zh-Hans 行为不变；不引 i18n 依赖、不做运行时切换；lint/typecheck/build/doctor/smoke + Chrome smoke 通过。M1 计划票 I-08~I-17 全部交付)
2026-06-21 (Batch D 完成：I-12 表现回填 lite（POST /api/sessions/:id/performance + GET 读回 + OutcomePanel 入口，无 migration，真实 Chrome 回填/读回通过）、I-13 eval 门禁（eval:forge npm + safe-mode SKIP，不进 PR CI）、I-14 观测 scaffold（零依赖 no-op + 可选 env + doctor info）；lint/typecheck/build/doctor/smoke 全通过；下一张唯一任务 I-17)
2026-06-21 (I-11 偏好页 /profile 完成：profile_preferences CRUD API（GET/POST upsert/PUT/DELETE）+ 受保护 /profile 页 + /forge 按 RLS 带出 source=profile 偏好假设 + AssumptionPanel「记住为偏好」写入；无 migration（表/RLS 已存在）；back-compat 无偏好不变；自动验证、匿名边界与真实 Chrome 登录态验收通过；下一张唯一任务 I-12)
2026-06-21 (I-16 output_locale 完成：migration 0002 已应用到 Supabase；sessions.output_locale=text nullable/default NULL；forge/rerun/session API 串通、生成链路最小约束、UI 自由文本输入；带 locale 生成、/forge?session= 回填、rerun 带 locale、usage_count 1→2 通过；下一张唯一任务 I-11)
2026-06-21 (I-15 v5 选择性折叠文案 / 产品表述收敛完成；产品定位收敛为图文卡片 / carousel 内容工作台，保留小红书为场景之一，additive 不改 schema/RLS/prompt/生成链路；真实 Chrome 登录态验收通过；下一张唯一任务 I-16)
2026-06-21 (I-10 配方详情 + 换输入重跑完成；真实 Chrome 登录态下进入详情、空/超长禁用、新主题重跑成功落到 /forge?session= 呈现新结果、usage_count 0→1、原 recipe 未覆盖；下一张唯一任务 I-15)
2026-06-21 (I-09 配方库列表 / 搜索 / 筛选 / 删除完成；真实 Chrome 登录态下删除一条重复配方后刷新确认当前用户仅可见 1 条；下一张唯一任务 I-10)
2026-06-21 (记录「v5 选择性折叠」方向变更：保留 v4 代码，新增 Backlog I-15/I-16，待 Codex 确认 I-15 排期；详见本文件「方向变更」节与 DECISIONS)
