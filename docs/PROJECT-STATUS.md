# ForgeNote Project Status

## 当前里程碑
M1

## 当前票
当前唯一票：**V-01 Ready**。V-01-FIX-06 已随 PR #20 合入主线：`/login` 底部「登录后可保存配方和偏好。」不再渲染。下一步恢复 Production 真实用户验证；非 Google 用户测试前，仍需一个已确认邮箱密码账号跑 `/login` → `/forge`。

## 当前分支
当前代码基线：`main` / `origin/main` = `0875aaa`（PR #20 / V-01-FIX-06 已 squash merge）。`/login` footer note 微修已进入主线；不改 API / prompt / DB / RLS。

## 当前 PR
PR #10：`https://github.com/LSTOST/ForgeNote/pull/10` 已 squash merge。PR #11：`https://github.com/LSTOST/ForgeNote/pull/11` 已 squash merge。PR #12：`https://github.com/LSTOST/ForgeNote/pull/12` 已 squash merge。PR #13：`https://github.com/LSTOST/ForgeNote/pull/13` 已 squash merge。PR #15：`https://github.com/LSTOST/ForgeNote/pull/15` 已 squash merge。PR #16：`https://github.com/LSTOST/ForgeNote/pull/16` 已 squash merge。PR #17：`https://github.com/LSTOST/ForgeNote/pull/17` 已 squash merge。PR #18：`https://github.com/LSTOST/ForgeNote/pull/18` 已 squash merge。PR #19：`https://github.com/LSTOST/ForgeNote/pull/19` 已 squash merge。PR #20：`https://github.com/LSTOST/ForgeNote/pull/20` 已 squash merge。

## 方向变更：v5 选择性折叠（2026-06-21，待技术负责人 Codex 确认）

**变化**：产品方向调整为「国际 + 图文卡片/carousel + 多语言」（放弃大陆），但 M1 **保留 v4 小红书已建代码不推翻**，只做 additive 选择性折叠。

**权威记录**：`DECISIONS.md`「v5 选择性折叠」D-06 / D-07 / D-08；`TICKETS.md` I-15 / I-16；`PRD-M1.md` §2、§4.3。

**边界（review / 验收须守住）**
- I-12 / I-13 / I-14（Batch D）+ I-17（i18n 资源 scaffold）+ I-18（UI copy 资源覆盖补齐）+ I-19（Production 就绪 + 指标读出）已完成；M1 计划票 I-08~I-23 全部 Done。
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

## 已完成（I-18 — UI copy 资源覆盖补齐）
- 承接 I-17 scaffold：把 M1 活跃页面剩余硬编码 UI chrome 文案收敛到 `src/lib/copy/{zh-Hans,en}.ts`，默认 zh-Hans 行为不变
- 扩展 copy 分组：`common` / `intentTypes` / `login` / `idea` / `forge` / `outcome` / `recipePanel` / `assumptions` / `performance` / `recipes` / `recipeDetail` / `profile`；`en: Copy` 编译期同构，typecheck 保证 en/zh key 不漂移；含 `{n}`/`{max}`/`{label}`/`{date}`/`{count}` 占位符的值在调用处 `.replace(...)` 注入（copy 值保持纯 string）
- 接线（消费 `copy.*`）：`LoginForm`、`IdeaInput` / `ExampleIdeas` / `ForgeWorkbench`、`OutcomePanel`（含复制全文/卡片导出标题、section 标题、空/错误/登录态）、`RecipePanel`、`AssumptionPanel`（含 aria/title）、`PerformancePanel`、`RecipesLibrary`、`RecipeRerun`、`/recipes/[id]`、`ProfilePreferences`；intent 标签集中到 `copy.intentTypes` 三处复用去重
- 边界：不做运行时语言切换 / locale route / middleware / cookie / 偏好持久化；不联动 `output_locale`；不改 prompt / DB / RLS / API；不做视觉 redesign；`constants.ts` 产品级文案保留单一来源不复制；`DEFAULT_ASSUMPTIONS` 作为种子数据/内容保留，非 UI chrome
- 自动验证：lint/typecheck（en/zh key parity）/build（路由表不变）/doctor（0 failed/0 warnings）/smoke:api 全通过；本地登录态 Chrome smoke：`/login`、`/forge`、`/recipes`、`/recipes/[id]`、`/profile` 无 undefined / raw key / [object Object] / 未替换占位符（见 docs/acceptance/I-18.md）

## 当前执行边界
- **V-01（Ready）**：小范围真实用户验证。让 1-3 个非构建者用户在 Production 走完首次生成 → 假设条理解/编辑 → 保存配方 → 配方详情重跑，并记录指标与阻塞点。不要再把 Owner dry run 当作真实用户验证。拉非 Google 用户前，先用一个已确认邮箱密码账号补跑 Production `/login` → `/forge`。
- **V-01-FIX-06（Done）**：删除 `/login` 底部文案「登录后可保存配方和偏好。」。范围只限登录页前端渲染；不删除 copy key，不改 Google、邮箱密码、注册切换、Magic Link、Supabase、`/auth/callback`、业务 API、DB、RLS、prompt、Forge 工作台。`lint` / `typecheck` / `build` / `git diff --check` / 本地匿名 `/login` HTML 检查通过；PR #20 Preview 匿名 `/login` 与 GitHub CI / Vercel 通过；PR #20 已合入。残余风险：未做浏览器点击交互；邮箱密码真实登录到 `/forge` 仍需一个已确认邮箱密码测试账号。
- **V-01-FIX-05（Done）**：修复 `/login` 邮箱模块过度复杂。范围只限登录页前端与 copy：删掉大号“登录 / 注册”切换和虚线备用链接模块，保留邮箱 + 密码主路径，把注册/登录链接降为小号文字入口，把 Magic Link 降为次级文字入口；不改 Supabase 策略、`/auth/callback`、业务 API、DB、RLS、prompt、Forge 工作台。`doctor` / `lint` / `typecheck` / `build` / `smoke:api` / `git diff --check` 通过；PR #19 Preview 匿名 `/login` 与 Preview `smoke:api` 通过；PR #19 已合入。残余风险：未用已确认邮箱密码账号真实登录到 `/forge`，Magic Link sent-state 未用浏览器工具实点。
- **V-01-FIX-04（Done / Conditional Pass）**：修复非 Google 用户登录摩擦。范围只限 `/login` 前端：邮箱 + 密码变成主路径，Magic Link 降级为备用；不新增 OAuth/MFA/passkey/忘记密码，不改 `/auth/callback`、业务 API、DB、RLS、prompt。`doctor` / `lint` / `typecheck` / `build` / `smoke:api` / `git diff --check` 通过；PR #18 Preview 匿名 `/login` 与 Preview `smoke:api` 通过；PR #18 已合入。残余风险：未用已确认邮箱密码账号真实登录到 `/forge`。
- **V-01-FIX-03（Done）**：修复 `/forge` 页面形态错位。范围只限把现有功能重排成左=账号/内容资产，中=当前任务与内容方案，右=方向假设/生成控制/配方，底=当前 session/复用/表现连续性的最小工作台壳；不改生成链路、prompt、API、DB、RLS、资产库、视觉渲染。Gate 2 + Preview Gate 3 已通过，PR #17 已合入。
- **V-01-FIX-02（Done）**：修复 Owner 二次 dry run 暴露的 `/forge` 入口理解阻塞。范围只限首屏清晰度、方向确认的输入反馈、按钮/图标一致性；不改生成链路、prompt、API、DB、RLS、资产库、视觉渲染。`doctor` / `lint` / `typecheck` / `build` / `smoke:api` 通过；PR #16 Preview Gate 3 通过。
- **V-01-FIX-01（Done）**：修复 V-01 前置入口阻塞。范围只限 `/forge` 首屏状态文案、第一步按钮语义、方向确认滚动露出、输出语言/表达偏好可见性与快捷选项；不改 API / prompt / DB / RLS。`doctor` / `lint` / `typecheck` / `build` / `smoke:api` 通过；Preview Gate 3 通过。
- **I-23（Done）**：保存配方后的复用证据链。PR #12 已 squash merge 到 `main`（`c62065f`）。保存成功 → `/recipes/<id>` → 换输入重跑 → 新 `/forge?session=` 的连续性证据已在 Preview Gate 3 通过；`usage_count` 0→1，I-22 结构保留。
- **I-22（Done）**：PR #10 已 squash merge 到 `main`（`a9c0f44`）；实现包含生成契约/prompt 最小升级、逐页卡片文案与配图方向、发布前检查、保存配方前价值判断。`doctor` / `lint` / `typecheck` / `build` / `smoke:api` 通过，Preview Gate 3 通过。
- **I-21（Done）**：生成成功后把返回的 `sessionId` 写入 `/forge?session=`；生成失败但草稿已落库时也写入草稿 session URL；「新建」与重新定方向会清理旧 session query，避免刷新丢失刚生成结果。
- **I-20（Done）**：DSN-01 最小实现已完成并通过自动验证 + 登录态 UI 验收 + 真实生成路径。Owner 恢复 ForgeNote runtime OpenRouter key 后，`OPENROUTER_MODEL=openai/gpt-4o-mini` 生成成功，session `63ec12d9-2f8c-4b76-9ed1-6474b837e5a4`。
- **DSN-01（Done）**：Open Design POC 原型已落 `docs/design/dsn-01-open-design/prototype.html`，handoff/review 已补齐；Codex review Conditional Pass，允许 I-20 只落地 onboarding-first `/forge` shell + account-level assumption chips。
- **产品方向已修订并合入 main**（`docs/ForgeNote_修订版方向.md`，PR #7 `7e41bf7`）：护城河=过程层不做视觉渲染；M1 重定义为三支柱（假设条 / 内容包 / 配方复用），学习闭环 / 观测 SDK / runtime i18n 延后；冷启动「第一次怎么赢」。V-01 曾因前提不成立挂起；I-20/I-22/I-23 串起主路径后已恢复为当前唯一任务。
- M1 计划票 I-08~I-23 全部 Done；I-23 已并入 `main`（`c62065f`）。

## 已通过验收
- I-23：自动验证 `doctor` / `lint` / `typecheck` / `build` / `smoke:api` 通过；PR #12 Preview Gate 3 真实登录态 `dennisliu1225@gmail.com` 下完成生成 → 保存配方 → 出现“查看配方”链接 → 进入 `/recipes/a59217cf-efbf-423e-965d-016f00c26d4e` → 换输入重跑 → 落 `/forge?session=ff4e94aa-4c1c-4395-9e62-e6938f7be132`，新结果仍含发布正文、5 页卡片文案、配图方向、发布前检查 `全部通过`；回详情页 `usage_count` 0→1。PR #12 已合并，状态 Done。
- I-22：自动验证 `doctor` / `lint` / `typecheck` / `build` / `smoke:api` 通过；Preview Gate 3 真实登录态 `dennisliu1225@gmail.com` 下输入 → 方向确认 → 编辑受众「新手父母」→ 生成成功 session `ee77c9d6-55d5-407e-a990-e7b9164520fc`。结果含发布正文、5 页逐页卡片文案、每页配图方向、发布前检查 `全部通过`、复制逐页卡片文案、保存配方前价值判断；刷新 `/forge?session=` 后完整恢复。PR #10 已合并，状态 Done。
- I-21：自动验证 `lint` / `typecheck` / `build` 通过；Preview 登录态实测：`/forge` 渲染登录用户 `dennisliu1225@gmail.com`，输入 → 方向确认 → 编辑「受众」为「新手父母」→ `已确认 1/3`。Preview env refresh 后成功生成 session `5f6278be-0eae-4d5c-ae61-92d614cba15f`，URL 写入 `/forge?session=5f6278be-0eae-4d5c-ae61-92d614cba15f`，刷新后恢复完成结果、发布正文、配方区、受众与 session id。见 `docs/acceptance/I-21.md`。状态 Done。
- I-20：自动验证 `doctor` / `lint` / `typecheck` / `build` 通过；真实 Chrome 登录态 `/forge` UI 路径通过：输入模糊想法 → 方向确认 → 三条假设（受众 / 内容形式 / 表达角度）→ 编辑「受众」为「新手父母」→ `已确认 1/3`。Owner 恢复 ForgeNote runtime OpenRouter key 后，`OPENROUTER_MODEL=openai/gpt-4o-mini` 真实生成成功，session `63ec12d9-2f8c-4b76-9ed1-6474b837e5a4`；见 `docs/acceptance/I-20.md`。状态 Done。
- DSN-01：Open Design BYOK 使用 OpenRouter / `deepseek/deepseek-chat` 跑通；最终 accepted artifact 为 `docs/design/dsn-01-open-design/prototype.html`；`handoff.md` 与 `codex-review.md` 已落库。Codex review: Conditional Pass，允许拆 I-20；不允许直接复用 Open Design HTML/CSS/JS。
- I-19：Production 上线就绪 + 只读指标读出。Gate 2 实现正确性通过（自动验证 + 本地一次性库实证只读）；Production 配置（Vercel env→Production / Deployment Protection 关 / Supabase redirect+Google）完成并冒烟；生产 Google OAuth 登录往返实测通过；Gate 4 经 SQL Editor 从生产库读出 6 指标（2026-06-23，测试账号样本）；用户内容路径以 Preview 同码已验为依据由 Owner 接受 **Conditional Pass**，进入 Done（见 `docs/acceptance/I-19.md`）。残余风险：Production 上尚无外部真实用户内容路径证据
- I-18：UI copy 资源覆盖补齐（en/zh key parity 编译期保证 + 活跃页面接线 + 本地登录态 Chrome smoke 无泄漏）通过自动验证，进入 Done；已随 PR #2 squash merge 进 `main`（`b56cfa0`），远端分支 `i-18-copy-coverage` 已删除
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

## 阻塞项（已全部解除）
- ~~Google provider / callback 在 Preview 上未验完~~ **已解除（2026-06-22）**：精确根因为 Supabase Google provider 已 enabled、Client ID 已填，但 **Client Secret 为空**（authorize 直连返回 `400 validation_failed` / `Unsupported provider: missing OAuth secret`）。Owner 在 Supabase 控制台补填 Client Secret 并保存后，authorize 直连返回 `302` 重定向 Google，OAuth 流程恢复。
- ~~**Vercel Preview：登录态 Blocked**~~ **已解除**：真实 Chrome 登录态下完成 Google 登录 → `/forge` 生成（session `939ec634-dddd-410d-98eb-78128f5eab9f` 落库）→ `?session=` 回看 → `/recipes` → `/profile` → I-12 表现回填写入「✓ 已记录表现」并重开预填回 `11-50/51-100/1-10/0`。Deployment Protection 仍开启（未认证公网 401 为预期），未公开 bypass URL。
- **GitHub Actions CI（npm ci）红 → 已修**：根因为 **npm 大版本不一致**——本机 node25/npm11 vs CI node20/npm10，lockfile 缺 npm10 期望的 `@emnapi/runtime@1.11.1` / `@emnapi/core@1.11.1`（`@tailwindcss/oxide-wasm32-wasi` wasm 回退嵌套 optional 依赖）。本机 npm11 重生成无效（CI 仍红）；改用 `npx npm@10 install --package-lock-only` 重生成（匹配 CI），`npx npm@10 ci --dry-run` exit 0；lockfileVersion 仍 3、root deps 未变、无源码改动。初判 flake 有误，已更正。
- Codex GitHub App 未确认

## 下一步收口
M1 计划票 I-08~I-23 全部 Done；DSN-01 已 Done；PR #10 / PR #11 / PR #12 / PR #13 / PR #14 / PR #15 / PR #16 / PR #17 / PR #18 / PR #19 / PR #20 已合并。当前唯一任务恢复 V-01 Production 真实非构建者用户主路径验证。不要把视觉渲染、资产库、自动学习塞进下一步。

## 最近一次验收结果（I-19 Production 收口，2026-06-23）
- Gate 2：`doctor`（0/0）/ `lint` / `typecheck` / `build` 全通过；`npm run metrics` 无 DB → SKIP exit 0；本地一次性 PG 库实证只读（6 指标比对手算一致、跑前后行数不变、删库收尾）。
- Production 配置（浏览器实操，Owner 逐项授权）：Vercel 4 env → Production；Deployment Protection 关；Supabase Production redirect URL 加 `forge-note-gold.vercel.app/auth/callback`；Google provider Enabled + Client Secret 已填（Owner 确认）。
- 生产冒烟：`/login` 渲染正常；`/forge` 未登录重定向 `/login`；**Google OAuth 登录往返实测通过**（登录为 dennisliu1225@gmail.com）。
- Gate 4：经 Supabase SQL Editor 从生产库读出 6 指标（测试账号样本）——activation 2/2、assumption_edit 2/12、recipe_save 1/12、recipe_rerun 1/1、return_session 1/2、performance_fill 2/12。
- Gate 3 用户内容路径：Conditional Pass（Preview 同码已验，Owner 接受）；不由代理模拟以免伪造真实用户结论。
- 结论：**I-19 Done。** 残余风险：Production 上尚无外部真实用户内容路径证据。

## 最后更新时间
2026-06-29 (PR #20 已 squash merge 到 `main`（`0875aaa`），V-01-FIX-06 进入主线。当前唯一任务恢复 V-01：Production 真实非构建者用户主路径验证；非 Google 用户测试前仍需一个已确认邮箱密码账号 `/login` → `/forge` 证据。)
2026-06-29 (V-01-FIX-06 Preview Gate 3 Pass：PR #20 Preview `https://forge-note-git-codex-v-01-fix-06-login-ed66ea-lstosts-projects.vercel.app/login` 匿名渲染已删除「登录后可保存配方和偏好。」；仍显示 Google 登录、邮箱、密码、主按钮、小号创建账号入口和 Magic Link 入口。GitHub CI / Vercel 绿。残余风险：未做浏览器点击交互；邮箱密码真实登录 `/login` → `/forge` 仍需已确认邮箱密码测试账号。)
2026-06-29 (V-01-FIX-06 进入 Review：删除 `/login` 底部文案「登录后可保存配方和偏好。」；未删除 copy key，未改 Google、邮箱密码、注册切换、Magic Link、Supabase、`/auth/callback`、业务 API、DB、RLS、prompt、Forge 工作台。`lint` / `typecheck` / `build` / `git diff --check` 通过；本地匿名 `/login` HTML 检查确认目标文案 absent，Google/email/password/sign-in/create-account/Magic Link 文案 present。Draft PR 阶段，合入前 V-01 仍不标 Done。)
2026-06-29 (PR #19 已 squash merge 到 `main`（`2aa2209`），V-01-FIX-05 进入主线。当前唯一任务恢复 V-01：Production 真实非构建者用户主路径验证；非 Google 用户测试前仍需一个已确认邮箱密码账号 `/login` → `/forge` 证据。)
2026-06-29 (V-01-FIX-05 Preview Gate 3 Pass：PR #19 Preview `https://forge-note-git-codex-v-01-fix-05-login-fea4d2-lstosts-projects.vercel.app/login` 匿名渲染出 Google 登录、邮箱/密码/一个主按钮、小号「没有账号？创建账号」和「不想用密码？发送登录链接」；未渲染大号「登录 / 注册」segmented control、确认密码、虚线备用模块、旧备用提示。Preview `smoke:api` 通过，GitHub CI / Vercel 均绿。残余风险：未用已确认 email-password 测试账号跑 `/login` → `/forge`；Magic Link 点击后的 sent-state 未用浏览器工具实点。)
2026-06-29 (V-01-FIX-05 进入 Review / Gate 2 Pass：`/login` 保留 Google；邮箱区域删除大号“登录 / 注册”切换、确认密码和虚线备用卡片，默认只展示邮箱、密码、一个主按钮；注册/返回登录与 Magic Link 均为小号文字入口；Magic Link 成功为轻量状态提示。未改 Supabase 策略、`/auth/callback`、业务 API、DB、RLS、prompt、Forge 工作台。`doctor` / `lint` / `typecheck` / `build` / `smoke:api` / `git diff --check` 通过；本地 `/login` HTML 检查通过。Preview Gate 3 待跑。)
2026-06-29 (Owner dry run 指出 PR #18 后 `/login` 邮箱模块仍过度复杂：登录/注册切换、密码、备用链接同时暴露，用户第一眼被迫做选择题。Codex 判定切 V-01-FIX-05：只改 `/login` 前端复杂度，把邮箱区域收成邮箱 + 密码 + 一个主按钮；注册/返回登录和 Magic Link 均降级为次级文字入口；不改 Supabase 策略、`/auth/callback`、业务 API、DB、RLS、prompt、Forge 工作台。)
2026-06-28 (PR #18 已 squash merge 到 `main`（`b222b5f`），V-01-FIX-04 进入主线。当前唯一任务恢复 V-01：Production 真实非构建者用户主路径验证；非 Google 用户测试前先补一个已确认邮箱密码账号 `/login` → `/forge` 证据。)
2026-06-28 (V-01-FIX-04 Preview Gate 3 Conditional Pass：PR #18 Preview `https://forge-note-git-codex-v-01-fix-04-email-fe8145-lstosts-projects.vercel.app/login` 匿名渲染出 Google 登录、邮箱密码主路径、文案“确认过邮箱后，下次直接输入密码，不用每次去邮箱点链接”、Magic Link 备用入口“备用：发送登录链接”、备用提示“它仍需要打开邮箱”。Preview `smoke:api` 通过，CI/Vercel 绿。残余风险：缺已确认 email-password 测试账号，未跑真实邮箱密码登录到 `/forge`。)
2026-06-28 (V-01-FIX-04 进入 Review / Gate 2 Pass：`/login` 保留 Google 登录；邮箱区域改为“登录 / 注册”切换、邮箱、密码、注册确认密码；已确认邮箱用户可走 `signInWithPassword` 后进 `/forge`；新用户走 `signUp`，若 Supabase 要求邮箱确认，页面说明“首次确认一次，之后用密码直接登录”；Magic Link 降级为备用入口并明确仍需打开邮箱。未改 `/auth/callback`、业务 API、DB、RLS、prompt。`doctor` / `lint` / `typecheck` / `build` / `smoke:api` / `git diff --check` 通过。Local visual acceptance 未计入：Playwright 被 macOS sandbox 阻止，Chrome 本地导航被当前工具额度阻止；Preview Gate 3 待跑。)
2026-06-28 (真实用户反馈登录方式不人性化：没有 Google 账号时每次登录都要去邮箱点确认。Codex 判定 V-01 被登录入口摩擦阻塞，切 V-01-FIX-04：只改 `/login` 前端，把邮箱 + 密码作为非 Google 用户主路径，Magic Link 降级为备用；不改业务 API / DB / RLS / prompt。)
2026-06-28 (PR #17 已 squash merge 到 `main`（`47da359`），V-01-FIX-03 进入主线。当前唯一任务恢复 V-01：Production 真实非构建者用户主路径验证。)
2026-06-28 (V-01-FIX-03 Preview Gate 3 通过：PR #17 Preview `https://forge-note-git-codex-v-01-fix-03-workbe-c68956-lstosts-projects.vercel.app`，Google OAuth 用户 `nb19870729@gmail.com` 回到 Preview `/forge`。宽屏下左栏显示当前任务/配方库/账号偏好与资产说明，中区承载输入和内容方案，右栏承载输出语言/方向假设/生成控制/保存配方，底栏显示版本/复用/表现。输入 `first cat budget checklist carousel` → `先确认方向` 后右栏出现 compact 方向假设 → `生成内容方案` 成功，落 `/forge?session=e83a0f3d-24f7-4350-b62a-af756ab07ca5`，结果含内容定位、标题备选、发布正文、5 页卡片、配图方向、发布前检查、话题、评论区引导；右栏出现保存配方区；未见可见应用错误。V-01-FIX-03 结论 Pass，当前唯一任务恢复 V-01。)
2026-06-28 (V-01-FIX-03 进入 Review / Gate 2 Pass：桌面 `/forge` 已改为左=账号/内容资产入口，中=当前任务输入与内容方案，右=输出语言/方向假设/生成控制/保存配方，底=当前 session/复用/表现状态条；移动端自然纵向降级；DirectionPanel 增 compact 右栏模式。未改 API / prompt / DB / RLS。`doctor` / `lint` / `typecheck` / `build` / `smoke:api` 通过；登录态布局目视需 PR Preview Gate 3。)
2026-06-28 (Owner 以真实用户视角试用后指出：当前 `/forge` UI 形态和工作流仍是上到下的纵向形式，不是此前讨论的左 / 中 / 右 / 底工作台布局。Codex 判定 V-01 继续被页面形态阻塞，切 V-01-FIX-03：只把现有 `/forge` 功能重排为左=账号/内容资产、中=当前任务与内容方案、右=方向假设/生成控制/配方、底=当前 session/复用/表现连续性的最小工作台壳；不改 API / prompt / DB / RLS，不做资产库/视觉渲染/自动学习。)
2026-06-28 (V-01-FIX-02 Preview Gate 3 通过：PR #16 Preview `https://forge-note-git-codex-v-01-fix-02-entry-clarity-lstosts-projects.vercel.app`，真实登录态 `dennisliu1225@gmail.com` 下完成 `/forge` 输入 → 先确认方向 → 方向区显示「本次想法：想做一组第一次养猫预算清单的图文卡片」→ 三条方向均围绕该主题 → 生成内容方案成功，落 `/forge?session=4b73c107-f22e-42e3-b156-624704b7b109`。空态无「新建」；有输入后显示「清空重写」；粘贴过往帖入口为剪贴板图标；主 CTA/生成按钮为暖色动作样式；浏览器 console 无 error/exception。V-01-FIX-02 结论 Pass，当前唯一任务恢复 V-01。)
2026-06-28 (V-01-FIX-02 进入 Review / Gate 2 Pass：空态隐藏无意义「新建」，有草稿/结果后显示「清空重写」；主标题降到工作台级字号；方向确认区新增「本次想法」并让三条默认方向围绕当前输入生成；粘贴过往帖入口改用粘贴语义图标；主 CTA/生成按钮/输出偏好快捷项改暖色动作样式。未改 API / prompt / DB / RLS。`doctor` / `lint` / `typecheck` / `build` / `smoke:api` / `git diff --check` 通过；本地浏览器登录态受 Supabase Auth 保护，Preview Gate 3 待跑。)
2026-06-28 (Owner 二次 dry run 发现 V-01-FIX-01 后 `/forge` 仍有入口理解阻塞：首屏大输入框旁「新建」意义不明；主文案过大；输入后点「先确认方向」虽然跳到方向区，但三条方向看起来仍是内置模板；温暖文字风与冷 SaaS 按钮割裂；“贴一条你发过的帖”使用附件/上传感图标造成心理落差。Codex 判定切 V-01-FIX-02：只修 `/forge` 前端入口理解与方向反馈，不改 API / prompt / DB / RLS，不做视觉重设计。)
2026-06-28 (V-01 FIX-01 上线后 Production 就绪复核（Claude Code，未写产品代码）：确认 PR #15 / V-01-FIX-01 已 squash merge 到 `main`（HEAD `cf9d631`「Fix Forge entry path for V-01」），入口修复文案已在 `src/lib/copy/zh-Hans.ts`（空态「输入一个想法开始」、第一步 CTA「先确认方向」），随 Vercel 主线自动部署到 Production。复核：`npm run doctor` 0/0；Production `smoke:api` 全通过；`/login` 200、`/forge`/`/recipes`/`/recipes/<uuid>` 均 307→`/login`（鉴权闸正常）。`metrics` 仍须 Owner 走 SQL Editor（V-01.md 已备 SQL）。残余风险：登录态入口文案匿名不可见，未由 Claude Code 目视确认部署后文案，请首个真实用户登录时顺带确认。**V-01 仍未 Done**，唯一缺口=至少 1 名真实非构建者用户在 Production 跑完主路径并记录证据；`docs/acceptance/V-01.md` 已备 Owner 执行清单。结论：继续收集用户。)
2026-06-28 (V-01-FIX-01 Done：PR #15 Preview `https://forge-note-git-codex-v-01-forge-entry-fix-lstosts-projects.vercel.app`，Google 登录为 `dennisliu1225@gmail.com` 后回到 Preview `/forge`。空态显示“输入一个想法开始”；输出语言/表达偏好默认可见；点击“中文”填入 `zh-Hans`；输入「想做一组第一次养猫预算清单的图文卡片」后首屏 CTA 为“先确认方向”；点击后方向确认区出现，第二步“生成内容方案”可见；生成成功落 `/forge?session=c9a89de2-149a-401f-b6c8-cc689f9e7ae7`，结果含发布正文、5 页卡片文案、配图方向、发布前检查、全部通过与 locale meta `zh-Hans`；浏览器 console 无 error/warning。当前唯一任务恢复 V-01。)
2026-06-28 (V-01-FIX-01 进入 Review / Gate 2 Pass：`/forge` idle 文案改为“输入一个想法开始”；首屏 CTA 改为“先确认方向”；点击后自动滚到方向确认区；输出语言/表达偏好默认可见并提供中文 / English / Instagram carousel / LinkedIn carousel / 清空快捷项。未改 API / prompt / DB / RLS。`doctor` / `lint` / `typecheck` / `build` / `smoke:api` 通过；Preview Gate 3 待跑。)
2026-06-28 (Owner dry run 发现 V-01 前置阻塞：Production `/forge` 输入想法后，首屏按钮写“生成内容方案”但实际只进入方向确认；顶部 idle 文案写“正在写这次的想法”；输出语言/表达偏好被折叠且无快捷选项，用户感知为没有可选、输入没反应。Codex 判定当前唯一任务切到 V-01-FIX-01，只修 `/forge` 入口交互，不改 API / prompt / DB / RLS。)
2026-06-28 (V-01 技术就绪复核（Claude Code，未写产品代码）：`npm run doctor` 0/0；Production `/login` 200、`/forge` 未登录 307→`/login`、`FORGENOTE_BASE_URL=https://forge-note-gold.vercel.app npm run smoke:api` 全通过——平台层（可达/登录页/鉴权闸/匿名 API 边界）已具备真实用户测试条件。`npm run metrics` 本地 SKIP（无 DATABASE_URL）；直连 Production 库被本机代理 fake-ip + Claude Code guardrail 双重挡住，指标读出仍须 Owner 走 Supabase SQL Editor（`docs/acceptance/V-01.md` 已备好等价只读 SQL）。**V-01 不能由 Claude Code 自证通过**：仍缺至少 1 名真实非构建者用户证据（Owner 安排）+ 指标读出（Owner SQL Editor）。结论：平台就绪、等待真实用户与指标；非代码阻塞，无可修的最大技术阻塞。V-01 维持 Ready，待 Owner 决策点拍板。)
2026-06-25 (PR #12 已 squash merge 到 `main`（`c62065f`），I-23 → Done。`docs/TICKETS.md` 已把下一张唯一任务切到 V-01，`docs/acceptance/V-01.md` 已准备测试脚本和记录模板：1-3 个非构建者用户在 Production 走完首次生成、保存配方、配方详情重跑，并读出 activation / assumption_edit / recipe_save / recipe_rerun 指标。继续写功能不是最短路径；当前最短路径是证明主闭环有没有真实用户能跑通。)
2026-06-25 (I-23 Preview Gate 3 通过：先在 Supabase Auth Redirect URLs 加 `https://forge-note-git-*-lstosts-projects.vercel.app/auth/callback` wildcard，确认 Total URLs=6，OAuth 正确回 PR #12 Preview。真实 Preview 登录态 `dennisliu1225@gmail.com` 下跑通：输入「想做一组第一次独居备用金清单的图文卡片」→ 编辑受众「新手父母」→ 生成 source session `5acdcb82-7956-4f89-aba9-3abe9a63890c`，结构含发布正文/5 页卡片/配图方向/发布前检查/全部通过；保存后出现“查看配方”链接 `/recipes/a59217cf-efbf-423e-965d-016f00c26d4e` 和复用提示；详情页来源 session 与 usage_count=0 可见；换输入「想做一组第一次给孩子准备家庭应急金的图文卡片」重跑后落 `/forge?session=ff4e94aa-4c1c-4395-9e62-e6938f7be132`，结构仍完整且全部通过；回详情页 usage_count=1。随后 PR #12 已合并。)
2026-06-25 (I-23 进入 Review / Gate 2 Pass：`codex/i-23-recipe-reuse-proof` 最小实现已落，`RecipePanel` 保存成功后保留 `recipeId` 并显示 `/recipes/<id>`“查看配方”入口，提示用户去配方详情换输入重跑；无 API / DB / RLS / prompt 改动。`doctor` / `lint` / `typecheck` / `build` / `smoke:api` 通过，Preview Gate 3 待验证。)
2026-06-25 (PR #10 已 squash merge 到 `main`（`a9c0f44`），I-22 → Done。下一张唯一任务拆为 I-23：保存配方后的复用证据链，只补保存成功后进入配方详情、换输入重跑、返回 `/forge?session=` 后仍保留 I-22 结构化结果；继续排除资产库、视觉渲染、视觉配方、自动学习、DB schema/RLS 改动。)
2026-06-25 (I-22 Preview Gate 3 通过：Supabase Redirect URL 修复后，真实 Preview 登录态 `dennisliu1225@gmail.com` 下跑通：输入「想做一组第一次独居备用金清单的图文卡片」→ 方向确认 → 编辑受众「新手父母」→ `已确认 1/3` → 生成成功 session `ee77c9d6-55d5-407e-a990-e7b9164520fc`。结果含发布正文、5 页逐页卡片文案、每页配图方向、发布前检查 `全部通过`、复制逐页卡片文案成功写入剪贴板、保存配方前价值判断；刷新 `/forge?session=` 后完成结果/受众/正文/卡片/配图方向/检查/配方判断/session id 均恢复。)
2026-06-25 (I-22 Preview 登录 blocker 更新：Owner 在精确 PR #10 Preview `https://forge-note-git-codex-i-22-content-plan-eee8bc-lstosts-projects.vercel.app/forge` 登录后被重定向到 Production `https://forge-note-gold.vercel.app/forge`。代码复核：`LoginForm` 使用 `window.location.origin + /auth/callback`，无生产域名硬编码。结论：Supabase Auth Redirect URLs 缺 PR #10 Preview callback；需添加 `https://forge-note-git-codex-i-22-content-plan-eee8bc-lstosts-projects.vercel.app/auth/callback` 或 Preview wildcard 后再跑 Gate 3。)
2026-06-25 (I-22 Draft PR #10 已开：`https://github.com/LSTOST/ForgeNote/pull/10`。CI/Vercel 绿；Preview alias `https://forge-note-git-codex-i-22-content-plan-eee8bc-lstosts-projects.vercel.app` 可达，`/login` 200，`/forge` 未登录 307 到 `/login`。Chrome 自动点击 Google 登录被浏览器安全策略拒绝，不能绕过；登录态 Gate 3 待 Owner 手动登录 Preview 后继续。)
2026-06-25 (PR #9 已 squash merge 到 `main`，新建 `codex/i-22-content-plan-usability` 执行 I-22。当前实现：`cardPrompts` 兼容扩展 `body` / `visualDirection`；prompt 要求 5-8 页逐页卡片文案与配图方向；结果区重组为发布正文 / 逐页卡片文案 / 配图方向 / 发布前检查；保存配方区展示将被复用的判断。`doctor` / `lint` / `typecheck` / `build` / `smoke:api` 通过；本地浏览器 `/forge` 因 localhost 无登录态停在 `/login`，登录态 Gate 3 待分支 PR Preview 补证据。)
2026-06-25 (PR #9 Preview Gate 3 通过：Owner 修复 Vercel Preview `OPENROUTER_API_KEY` 后，Codex 以空提交触发 redeploy；CI/Vercel 绿。真实 Preview 登录态 `dennisliu1225@gmail.com` 下跑通：输入「想做一组第一次独居备用金清单的图文卡片」→ 方向确认 → 编辑受众「新手父母」→ `已确认 1/3` → 生成成功 session `5f6278be-0eae-4d5c-ae61-92d614cba15f` → URL 写入 `/forge?session=` → 刷新后完成结果/正文/配方/受众/session id 均恢复。PR #9 可转 Ready。)
2026-06-25 (Preview 登录态 Gate 3 进展：Supabase redirect 修正后，PR Preview `/forge` 已显示登录用户 `dennisliu1225@gmail.com`。实测输入「想做一组第一次独居备用金清单的图文卡片」→ 方向确认 → 编辑受众「新手父母」→ `已确认 1/3` → 最终生成。Preview runtime 返回 `OpenRouter 401`，但 I-21 草稿 session URL 行为通过：`/forge?session=46470ef0-eb43-459d-8d19-f060d35d0cd7`，刷新恢复输入/假设/错误态。剩余阻塞转为 Vercel Preview `OPENROUTER_API_KEY`。)
2026-06-25 (Preview Google OAuth 根因收敛：Owner 点击 Google 登录后落到 `localhost` 并报 `ERR_CONNECTION_REFUSED`。复核代码：`LoginForm` 对 Google/Magic Link 均使用 `window.location.origin + /auth/callback`，无 localhost 硬编码。结论：Supabase Auth URL Configuration 未放行 PR Preview callback，导致回退到 Supabase Site URL（localhost）。需在 Supabase Auth Redirect URLs 添加 `https://forge-note-git-codex-dsn-01-design-brief-lstosts-projects.vercel.app/auth/callback` 或 Preview wildcard 后再验。)
2026-06-25 (Preview 登录入口复核：Owner 反馈无法打开登录入口后，重新验证 PR Preview。`/login` HTTP 200，`/forge` HTTP 307 到 `/login`；生成 Vercel share URL 后访问 `/forge` 仍落到应用 `/login`。结论：不是 Vercel Deployment Protection 或部署不可达，仍是 Supabase 应用登录态缺失。PR #9 保持 Draft。)
2026-06-24 (Preview Gate 3 继续推进：Owner 批准 `forgenote-pr9` Botmail，已创建 `forgenote-pr9@thebrownpig.org`；Preview email login 成功发送 Supabase 确认邮件并已收到。阻塞更新：Botmail 只暴露纯文本正文，未暴露 HTML 按钮 URL；本地无 `SUPABASE_SERVICE_ROLE_KEY`，无法 admin 生成等价 Magic Link。PR #9 仍 Draft，不转 Ready。)
2026-06-24 (大目标重定：目标从“继续补小票”调整为“PR #9 可合并收口 + I-22 大票边界”。PR #9 最新 head `2576793` checks/Vercel 全绿，但 Preview `/forge` hosted Gate 3 复测在 Chrome 中转 `/login` 后被 Google 登录安全策略挡住，未绕过，因此 PR #9 继续保持 Draft。I-22 已定为下一张唯一大票：一次性升级第一份内容方案可用性，覆盖发布正文、逐页卡片文案、配图方向、发布前检查与保存配方前价值判断；不做资产库/视觉渲染/视觉配方/自动学习。)
2026-06-24 (PR #9 状态复核 + I-21 收口：PR #9 open draft / merge state clean / CI pass / Vercel Preview Ready / 无 review threads，PR body 已补合并证据；本地工作区仅有未跟踪 `原型图/`，按约束不纳入。I-21 已实现 `/forge` 生成成功/草稿失败后的 session URL 地址化，刷新可复用既有 `/forge?session=` 预载逻辑回看结果或恢复错误态；`npm run lint` / `npm run typecheck` / `npm run build` 通过。)
2026-06-24 (DSN-01 收口 + I-20 最小实现：Open Design accepted artifact `prototype.html` 已落库，`handoff.md` / `codex-review.md` 完成，DSN-01 → Done；I-20 已实现 onboarding-first `/forge` shell、可选过往帖、三条账号级方向假设、rationale/confidence、编辑确认、draft autosave、`accountPost` API/type/prompt 锚点。`npm run doctor` / `npm run lint` / `npm run typecheck` / `npm run build` 通过；真实 Chrome 登录态验证 `/forge` 输入 → 方向确认 → 编辑「受众」为「新手父母」→ `已确认 1/3` 通过。初次最终生成被 ForgeNote runtime OpenRouter `401` 阻塞，Owner 恢复 key 后以 `OPENROUTER_MODEL=openai/gpt-4o-mini` 重跑成功，session `63ec12d9-2f8c-4b76-9ed1-6474b837e5a4`；I-20 → Done)
2026-06-23 (I-19 Production 验收收口 → **Done**：浏览器实操完成 Production 配置（Vercel 4 env→Production / Deployment Protection 关 / Supabase Production redirect URL + Google Client Secret），生产 `/login` 渲染、`/forge` 鉴权重定向、**Google OAuth 登录往返**实测通过；Gate 4 经 Supabase SQL Editor 从生产库读出 6 指标（测试账号样本：activation 2/2、assumption_edit 2/12、recipe_save 1/12、recipe_rerun 1/1、return_session 1/2、performance_fill 2/12）；用户内容路径以 Preview 同码已验为依据由 Owner 接受 Conditional Pass。直连生产库被本机代理 fake-ip 挡掉裸 5432，改走 SQL Editor。未改产品代码 / schema / RLS / prompt / API。残余风险：Production 尚无外部真实用户内容路径证据)
2026-06-22 (OPS-02 状态同步：当前 `main`/`origin/main` HEAD = `acd94fe`，PR #4 / I-19 代码文档侧已 squash merge；修正 PROJECT-STATUS/TICKETS 中仍指向 `b56cfa0`、PR #2、I-19 Ready/下一张唯一任务的过期现状。I-19 当前状态定为 Review / Pending Production Acceptance：Gate 2 已交付，Gate 3 Production 真实用户路径与 Gate 4 Production DB metrics 待 Owner 配置后补证据。未改产品代码、脚本、API、DB、RLS、prompt)
2026-06-22 (OPS-01 文档基线同步：基于 origin/main `b56cfa0`（PR #2 / I-18 已 squash merge），修正过期 live 状态——「当前分支 i-01-forge-workspace」「当前 PR PR #1 Draft」改为「无活跃功能分支 / main 已含 PR #2」；I-18 补入已完成、已通过验收、TICKETS Done 表；下一张唯一任务标注待 Owner 拍板、不默认进入 runtime i18n。新增 `docs/OPERATING-MODEL.md`，AGENTS/DECISIONS/RUNBOOK/PR 模板对齐角色·Gate·QA Agent 真实用户路径验收协议。仅文档改动，未触碰 src / package / API / DB / RLS / prompt)
2026-06-22 (Preview 登录态验收**通过**，blocker 解除：精确根因为 Supabase Google provider 的 Client Secret 为空（authorize 直连 `400 validation_failed` / `missing OAuth secret`）；Owner 在 Supabase 控制台补填 Client Secret 并保存后 authorize 直连返回 `302` 重定向 Google。真实 Chrome 登录态下 Google 登录 → /forge 生成（session 939ec634-dddd-410d-98eb-78128f5eab9f 落库）→ ?session= 回看 → /recipes → /profile → I-12 表现回填写入/读回（11-50/51-100/1-10/0）全套通过。仅 Supabase 外部配置变更，无代码改动；Deployment Protection 仍开启，未公开 bypass URL。PR #1 登录态主路径已完整通过，转 Ready 由 Owner 决定)
2026-06-22 (Preview 登录态 blocker 纠偏：关闭/切换 Chrome 后仍无法 Google 登录；用真实 Supabase authorize URL 直连确认返回 400 validation_failed / "Unsupported provider: provider is not enabled"。根因是 Supabase Auth Google provider 未启用或 Google OAuth client 未配置完成；不是 Codex 扩展、Chrome profile、Vercel framework/env 或 ForgeNote 代码。Preview 登录态仍 Blocked，不转 Ready)
2026-06-22 (Preview 登录态复测中曾观察到 Chrome `ERR_BLOCKED_BY_CLIENT`，当时误判为客户端拦截；后续已用 Supabase Auth 直连响应纠偏，以上方 provider 未启用结论为准。登录态验收仍 Blocked，不转 Ready)
2026-06-21 (Preview env 已配置并 redeploy：Owner 授权后写入 4 个必需 Preview env，值均 Encrypted 未打印；PR Preview redeploy dpl_HYpjff1BTpP76ncWZCoVoEF3oNVQ READY，分支别名 /login 已渲染真实登录表单；未登录边界通过：合法 POST /api/forge→401 AUTH_REQUIRED，非法 JSON→400 VALIDATION_FAILED。登录态仍 Blocked：当前 Chrome 拦截 Supabase Auth 域名 tsqgetxhyitltgztxymd.supabase.co，显示 ERR_BLOCKED_BY_CLIENT；不转 Ready)
2026-06-21 (Preview 修复进展：CI 已绿；commit 045e6f6 Preview READY，deployment dpl_47DRNL1djLWs4RZ8UfZnxSfsuX1t；vercel.json 已解除 Vercel 级 404，/login 为 Next.js 200，/api/forge GET 为 405。当前 blocker 转为 Preview env 为空（登录页 Supabase 未配置）+ Deployment Protection/登录态验收入口未打通；写入本地 .env.local 到 Vercel Preview 需 Owner 明确授权，不转 Ready)
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
