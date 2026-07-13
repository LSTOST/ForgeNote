# ForgeNote 决策记录（DECISIONS）

> 范围：记录开工前拍板的工程决策，作为 PRD / UIUX / DATA-SCHEMA / API-CONTRACT 的权威依据。
> 文档之间如有冲突，以本文件为准。

---

## Day 0（2026-06-19）

四条决策已拍板，用于消解 PRD / DATA-SCHEMA / API-CONTRACT 之间的不一致。只做一致性对齐，不扩展新功能。

### D-01 intent_type canonical values

M1 统一使用以下四个值，**禁止** 使用 `xiaohongshu_card_prompt`：

```
content_package    # 主线，M1 围绕它开发
xiaohongshu_note   # 兜底，不做复杂优化
card_prompt        # 兜底，不做复杂优化
generic_content    # 兜底，不做复杂优化
```

- 主线只围绕 `content_package`。
- 其余三个仅作兜底，不做复杂优化。

影响文件：`DATA-SCHEMA.md`（§2.1 枚举改名）。PRD 已用 `card_prompt`，无需改。

### D-02 F-16 表现回填（lite）

F-16 纳入 M1，但只做 lite：**仅用户手动回填**，不抓取平台数据、不自动分析。

`sessions` 预留字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| published_at | timestamptz | 发布时间 |
| like_range | text | 点赞区间 |
| favorite_range | text | 收藏区间 |
| comment_range | text | 评论区间 |
| follower_gain_range | text | 涨粉区间 |
| performance_note | text | 一句话复盘，可选 |

所有 range 枚举统一为：

```
0
1-10
11-50
51-100
101-500
500+
unknown
```

- M1 **不做** `perf_score`，M2 再做。
- 新增 API：`POST /api/sessions/:id/performance`。
- 新增事件：`performance_filled`。

影响文件：`DATA-SCHEMA.md`（sessions 字段 + range 枚举 + event_name）、`API-CONTRACT.md`（新增接口 + 权限）、`PRD-M1.md`（§11 sessions/recipes 对齐、§17 待决项收敛）。

### D-03 偏好接口

以 `API-CONTRACT.md` 为准，保留：

```
GET    /api/profile/preferences
PUT    /api/profile/preferences/:id
DELETE /api/profile/preferences/:id
```

- **不单独暴露** 新增偏好的 POST 接口。
- 用户「保存配方」或「保存生成结果」时，系统从 edited assumptions 自动写入 `profile_preferences`。
- （`DELETE /api/profile/preferences` 清空全部保留，用于偏好页「清空全部」入口。）

影响文件：无需改动接口（现状已符合）；仅确认无 POST 偏好接口。

### D-04 降级与草稿

生成失败时：

- 允许保存 Session 草稿。
- `status = draft`
- `outcome = null`
- `error_code = GENERATION_FAILED`
- 用户可稍后重试，输入与假设不丢失。

影响文件：`DATA-SCHEMA.md`（sessions 增 `error_code`）、`API-CONTRACT.md`（§5.1 降级规则说明）、`UIUX-M1.md`（§7.4 错误态草稿说明）、`PRD-M1.md`（§17 待决项 #4 收敛）。

### D-05 F-16 配方优先识别延后

F-16 AC③「同 intentType 下高表现配方在库中优先识别/排序」依赖 perf_score，而 D-02 已定 M1 不做 perf_score。

- M1：仅**存储 + 展示**回填数据（在来源 session 与配方详情可见）。
- M2：再做高表现配方的标记/排序（随 perf_score 落地）。

影响文件：`PRD-M1.md`（F-16 AC③、§13.3 样例 #6）。

---

## UI 实现与设计交付流程（2026-06-20，2026-06-23 修订）

明确 Claude Design / Open Design / Claude Code / Codex / GitHub Copilot / v0 的分工与边界，作为页面设计与落地的权威依据。本节只规范交付流程，不改产品功能、不改页面代码。

完整角色与 gate 见 `docs/OPERATING-MODEL.md`。本节为设计/实现流程的决策摘要；如需判断验收、发布、反馈闭环，以 operating model 为准。

### 工具分工

| 工具 | 职责 | 边界 |
|---|---|---|
| Codex | 定义正确性：读文档、判断下一票、写执行指令、架构审查；票进入 Review 后切换为 QA Agent | 不做主力实现；不把外部工具输出、代码 review 或 CI 通过直接视为验收依据 |
| Claude Design | 生成页面视觉方向、交互原型、设计系统线索 | 不直接作为代码来源；不定义业务状态、接口、认证、数据库或验收标准 |
| Open Design | 本地优先的设计原型工具；可替代 Claude Design 生成 DSN 类原型、HTML artifact、截图/录屏与 handoff | 只作为设计工具；不安装进 ForgeNote 仓库；不直接并入生成代码；不接管业务状态、接口、认证、数据库或验收标准 |
| Claude Code | 按票改真实 Next.js 项目，并补齐状态、交互、响应式与可访问性 | 必须遵守 Codex 票据、`UIUX-M1.md`、`DATA-SCHEMA.md`、`API-CONTRACT.md` |
| QA Agent（Codex 角色切换） | 按真实用户路径验收，记录证据与残余风险 | 不只读代码；不以“构建通过”替代用户路径跑通 |
| Vercel + CI | 发布与运行保障：CI、Preview、env、deployment、auth 边界 | 不替代产品验收；Preview 能打开不等于用户路径可用 |
| Real user feedback / Analytics | 用户研究与迭代判断：保存率、重跑率、回访、表现回填 | 不用主观好恶替代行为数据 |
| v0 | 可选：生成独立组件草稿或局部布局参考 | 不作为主 UI 流程；不接管仓库；不生成完整产品；不替代 Claude Code 实现 |
| GitHub Copilot | 自动 PR 基础代码审查 | 不作为产品验收依据 |

### 页面设计策略

页面分两类：

1. 核心体验页面：先用 Claude Design 或 Open Design 出视觉方向/原型，再由 Codex 转成票据，Claude Code 接入项目
   - `/forge`
   - `/recipes/[id]`（后续配方详情页）

2. 工具型页面：直接由 Claude Code 按 `UIUX-M1.md` 实现
   - `/login`
   - `/recipes`
   - `/profile`
   - `/history`

### 设计输出使用规则

1. Claude Design / Open Design 输出只作为视觉和交互参考，不直接覆盖现有仓库。
2. 每次只设计一个页面或一个关键组件。
3. Codex 必须把设计结果转成明确票据：目标、非目标、允许改动范围、验收标准、验证命令。
4. 设计确认后，Claude Code 参考设计输出重写为项目内组件。
5. 所有业务状态、按钮行为、错误态、加载态，以 `UIUX-M1.md` 为唯一准则。
6. Claude Design / Open Design / v0 生成的文案、假数据、API、认证逻辑均不作为实现依据。
7. v0 仅在需要独立组件草稿时使用；任何 v0 代码进入仓库前，都必须由 Claude Code 按项目结构重写，并由 Codex review 是否越界。

### D-09 DSN-01 Open Design POC（2026-06-23）

DSN-01 先用 **Open Design** 做「新用户引导态 + 账号级假设条」原型 POC；若 POC 不达标，则回退 Owner 已具备的 **Claude Pro / Claude Design** 路径。

- 目标不变：让首次用户第一屏感到「AI 已经懂我的账号」。
- POC 判定：Open Design 必须能稳定运行、能按 ForgeNote neutral/shadcn 风格出原型、且产物/速度不明显弱于 Claude Design；否则不替代。
- 工具边界不变：Open Design 或 Claude Design 只交付原型、视觉/交互方向、差异点清单与 handoff；不直接修改 ForgeNote 源码。
- 运行事实：本机 Docker 源码构建可跑通 Open Design `0.11.1`，`http://127.0.0.1:7456` 返回 200，`/api/health` 返回 `{"ok":true,"version":"0.11.1"}`；官方镜像直拉当前返回 unauthorized，采用源码 build fallback。
- 费用事实：Docker 模式不能直接消费 Claude Pro；若用 Open Design 生成，模型走 Owner BYOK/AMR。Codex 不读取、不粘贴、不保存 secret。
- 实现边界不变：后续由 Codex 拆实现票（预计 I-20），Claude Code 按现有 Next.js / shadcn / Tailwind 结构重写实现。
- 执行 brief：`docs/design/DSN-01-brief.md`。
- 运行/费用/交付协议：`docs/design/OPEN-DESIGN-DSN-01-RUNBOOK.md`。

### 验收与发布规则

1. 票进入 Review 后，Codex 必须从“架构审查”切换到“QA Agent”，用真实用户路径验收。
2. 用户可见票必须在 `docs/acceptance/*.md` 写明环境、用户身份、操作路径、实测结果、证据、残余风险。
3. M1 主路径基线：进入 `/forge` → 输入模糊想法 → 理解/编辑假设条 → 生成内容包 → 保存配方 → 刷新后找回结果 → 详情重跑 → 表现回填 → 回看仍在。
4. 合并前必须区分三件事：代码正确、Preview 可运行、用户路径可用。三者缺一不可。
5. 没有指标或反馈证据时，只能判定“功能可用”，不能判定“产品验证通过”。

影响文件：无（仅规范交付流程，不改动接口、数据模型或页面代码）。

---

## 模型网关决策（2026-06-20）

I-02A 确立 M1 模型接入路线，作为后续 I-02B 真实调用的权威依据。本节只新增决策，不改既有决策语义。

- ForgeNote M1 使用 OpenRouter 作为唯一模型网关。
- M1 使用单模型，不做模型路由。
- 业务代码不绑定模型厂商。
- 后续以 OpenAI SDK 作为兼容客户端接入 OpenRouter。
- 模型名与 API Key 只通过 `OPENROUTER_MODEL` 和 `OPENROUTER_API_KEY` 环境变量控制。
- 本次 I-02A 只建立类型、mock 和接入规则，不调用真实模型。
- I-02B 实现取舍：以原生 `fetch` 直连 OpenRouter 的 OpenAI 兼容 `chat/completions` 端点，M1 不安装 SDK；端点/报文与 OpenAI 兼容，后续可平替为 OpenAI SDK 客户端而不影响契约。调用层 `import "server-only"` 硬保护，杜绝 Key 经客户端 bundle 泄露。

影响文件：`MODEL-INTEGRATION.md`（新增）、`.env.example`（新增）、`src/lib/ai/types.ts`（新增）、`src/lib/ai/mock-generator.ts`（新增）、`src/lib/ai/openrouter-client.ts`（I-02B / Batch A）。

---

## Auth 登录闭环决策（2026-06-20，Batch B）

实现 Supabase Auth 登录闭环时确立，作为后续受保护页面与登录流程的权威依据。只规范实现方式，不扩产品范围。

- 登录方式：Google OAuth + 邮箱 Magic Link（Supabase OTP），均经 `/auth/callback` 用 PKCE `exchangeCodeForSession` 落 Auth cookie。
- 页面保护放在 Server Component（Next.js 16 认证指南的 DAL 模式：贴近数据源鉴权），**不引入 `proxy.ts`（旧 middleware）**。理由：Next.js 16 文档明确 proxy 不应作为唯一鉴权防线；`/api/forge` 的 RLS 才是写入路径的最终防线，页面级重定向只负责体验（未登录不进工作台）。
- 浏览器端仅用 anon key（`NEXT_PUBLIC_*`）发起登录；service role 绝不进客户端，请求路径不使用 service role。
- env 缺失（缺 `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`）时 UI 显示明确「未配置」提示，不白屏；`lint/typecheck/build` 不依赖 env。
- 退出登录用 POST `/auth/signout`（原生表单），避免被链接预取误触发。

影响文件：`src/lib/supabase/client.ts`（新增）、`src/lib/supabase/server.ts`（新增 `getCurrentUser` / `isSupabaseConfigured`）、`src/app/login/page.tsx`、`src/components/auth/LoginForm.tsx`、`src/app/auth/callback/route.ts`、`src/app/auth/signout/route.ts`、`src/app/forge/page.tsx`、`src/components/layout/TopNav.tsx`、`API-CONTRACT.md`（§8）。

---

## D-10 DSN-02 认证方式更新（2026-07-01）

DSN-02 改变登录方式，作为 Batch B Auth 决策的增量更新；旧的邮箱 Magic Link 不再作为登录入口。

- 登录方式：邮箱 + 密码为主路径，Google OAuth 为备选路径；彻底下线登录页 Magic Link UI、文案和 `signInWithOtp` 调用。
- 迁移顺序硬约束：必须先上线“忘记密码 / 重置密码”路径，再下线 Magic Link，避免只依赖 Magic Link 的旧用户被锁在门外。
- 密码重置：`resetPasswordForEmail` 的 `redirectTo` 指向 `${origin}/reset-password`；`/reset-password` 作为邮件回调真实落点，兼容 Supabase PKCE `?code=` 与邮件 hash token，建立恢复会话后由客户端 `updateUser({ password })` 保存新密码。原因：URL hash 不会发送给服务端，不能依赖 `/auth/callback` 读取 hash token。
- 记住 30 天：登录页默认勾选；浏览器 Supabase 客户端用 `@supabase/ssr` `cookieOptions.maxAge = 30 天` 控制本次写入 auth cookie 的持久化。Supabase refresh token 服务端最长寿命仍由 Supabase 项目设置控制，不由前端票据假装决定。
- 密码策略：前端最小 8 位；更强复杂度、泄露密码拦截、速率限制和防爆破以 Supabase Auth 项目配置为准，未在应用层新增自建鉴权逻辑。
- 错误信息：登录失败不暴露账号是否存在；UI 使用泛化文案，不把 Supabase 原始错误消息直接展示给用户。
- Redirect URLs：Production 与 Preview wildcard 必须在 Supabase Auth URL Configuration 中放行 `/auth/callback` 与 `/reset-password`；代码不硬编码 Production 域名。

影响文件：`src/components/auth/LoginForm.tsx`、`src/app/reset-password/page.tsx`、`src/app/auth/callback/route.ts`、`src/lib/supabase/client.ts`、`src/lib/copy/{zh-Hans,en}.ts`。

---

## v5 选择性折叠（2026-06-21）

承接产品定位讨论：战略方向调整为**国际市场 + 图文卡片/carousel 格式 + 多语言**（放弃大陆，规避备案/网信办与 OpenAI/Anthropic 不可直连）。但 M1 代码已建在 v4 小红书线（login / forge / recipes 已交付并验收）。决定：**保留已建代码，选择性折叠 v5**——只折叠"便宜且重要、对现有代码增量"的部分，推迟"贵且会推翻代码"的部分。本节只定折叠边界，不改既有功能语义。

### D-06 战略方向记录（不立即落地）

- 方向 = 国际 + carousel + 多语言；M1 **不为此推翻**已建的 v4 小红书代码。
- `content_package` 已是卡片式（`cardStructure` / `cardPrompts`），本身与 carousel 兼容，无需改输出结构。
- 影响文件：本记录为方向锚点，不直接改代码。

### D-07 现在折叠（additive，低重做）

- **(a) i18n 文案外化**：UI 文案抽成资源文件（en + zh-Hans 脚手架），不改行为。理由：文案外化成本随页面增长上升，越晚越贵。→ 实际拆分：I-15 先做产品**表述收敛**（in-place）；**资源文件外化脚手架**另立 **I-17**。
- **(b) output_locale 预留**：`sessions` / `recipes` 增 `output_locale`（nullable）；assumption 增 `output_locale` 维度（由 audience 决定，impact=High，可问）。仿 D-02 预留 F-16 字段的方式，additive 不破坏现状。→ 票 I-16。
- **(c) 商业化定位**：freemium 订阅假设写入 PRD（M1 不收费，但验证可收费性：保存率/重跑率/留存即付费意愿先行指标）。纯文档。→ `PRD-M1.md` §4.3。

#### D-07(a) 实现结果（I-17，2026-06-21）

i18n 文案外化按 **scaffold** 落地，严格不改行为：

- 新增 `src/lib/copy/`（`zh-Hans` 规范源 + `en` scaffold + `index` typed helper）；`Copy = typeof zhHans` + `en: Copy` 在编译期保证两套 key 不漂移。
- 默认 `copy` = zh-Hans，UI 文案逐字一致、行为不变。代表性接线：TopNav、`/recipes` 与 `/profile` 页头；其余为 scaffold-only（增量采纳）。
- 不引入 i18n 依赖、不做运行时语言切换 / locale 路由 / 偏好持久化 / 与 `output_locale` 联动。
- `constants.ts` 已集中的产品级文案不重复纳入（避免双源漂移）。
- 真正的多语言运行时切换留作后续票（本票仅脚手架）。

#### D-07(b) 实现结果（I-16，2026-06-21）

按最小闭环落地 `output_locale`，严格 additive：

- **范围收敛**：仅给 `sessions` 增 `output_locale`（migration `0002_output_locale.sql`）；`recipes` 本票**不加**——最小闭环不需要持久化 recipe 的 locale，重跑按本次请求传入即可。assumption 的 `output_locale` 维度本票**不做**（避免改 ForgeWorkbench 假设种子语义），留作后续。
- **列属性**：`text`、nullable、无 default、无 enum/check、不 backfill、不改 RLS（沿用 0001 的 `auth.uid() = user_id`）。NULL = 未指定，沿用现有行为。
- **请求链路**：`POST /api/forge`、`POST /api/recipes/:id/rerun` 可选 `outputLocale`（自由文本，trim，空串→null，≤120 字→超长 `VALIDATION_FAILED`）；写入新 session；`GET /api/sessions/:id` 返回 `outputLocale`。
- **生成链路**：仅当 `outputLocale` 非空时，向生成请求追加一条最小输出语言/表达偏好约束；无 locale 时输出行为不变。不做多语言系统/UI 翻译/资源文件外化/locale 下拉。
- **非破坏保障**：route 仅在 `outputLocale` 非空时才写 `output_locale` 列（条件 spread），故未指定 locale 的既有流程即使 0002 尚未应用也不依赖该列、不回归。
- **不与国家/平台/市场绑定**，不是 enum，不写入 Profile。

### D-08 延后（贵、会推翻代码，不进 M1）

- 平台中立 taxonomy 改名（`content_package` → `carousel_package`）：与 **D-01** 冲突，延后至真正切换平台时统一改。
- 去小红书化 / 英文内容 / 禁用词改平台中立：绑实际上线市场，延后。
- Stripe / 收款：M2（M1 不收费）。
- 影响文件：无（明确不做）。

---

## CCOS 方向 G0 验证方式（2026-07-11）

### D-11 CCOS G0 采用 Lean 验证（降档过闸，有记录）

背景：CCOS 方向（`PRD-CCOS.md` + `MVP-FEATURE-LIST.md` + 三份 UX 文档）进入 G0 问题验证阶段。Owner 判断正式访谈的执行成本过高，拍板采用 Lean 验证。注：CCOS 与 M2 结构生成脊椎的方向取舍尚未单独拍板，本决策不涉及。

拍板：G0 不做正式 45 分钟访谈，以下列组合作为过闸证据（Lean 标准）：

1. 机会假设（已有：PRD §3 + USER-JOURNEY §3 假设表）
2. 竞品对比表（桌面研究）
3. 公开痛点证据（平台搜索 + 截图 + 计数，作为 H-01 / H-04 / H-05 的行为证据）
4. 异步文字问答（5 问私信 ≥5 位目标创作者，回收 ≥3 份）
5. 渠道验证（现有账号发 1 条方向相关内容，7 天收数）

代价与补偿：

- H-03（结构优先更可控）、H-06（工作流概念可理解）在 Lean 标准下**无法验证**，顺延至 G2 前的原型可用性测试，期间不得视为已验证事实。
- 补偿控制一：首个纵向切片砍窄为「灵感 → 结构 → 草稿 → 导出」（单语言、单平台），双语 / 平台适配 / 工作流保存放后续切片。
- 补偿控制二：以 4 周 Owner dogfood 作为真正验证关（沿用 M2 Gate 0 打法）。
- 本决策是对开发体系 G0 闸门的**有记录降档**，不视为按原标准通过。

影响文件：`docs/research/G0-LEAN-KIT.md`（工具包改为 Lean 版，替代原 `G0-INTERVIEW-KIT.md`）。

---

## CCOS 产品目标重定义：自用优先（2026-07-11）

### D-12 CCOS 先做自用工具，商业化与市场验证整体推迟

背景：Owner 自身即目标用户（观察到大量美国华人博主双线运营 YouTube/X + 小红书/公众号，国内博主亦反向运营 X；Owner 自己有此需求）。拍板：不先验证人群规模，先把工具打磨到自己稳定使用，再启动商业化。本决策在 G0 验证方式上**取代 D-11**。

拍板：

1. 产品第一目标从「验证市场」改为「Owner 自用并持续使用」。
2. G0 重定义为「自用验证」：证据 = Owner 自我工作流记录（I-01）+ 持续使用数据。D-11 中的市场类证据（私信问答、渠道验证、公开痛点、创作者名录）整体推迟至商业化前置阶段。
3. 竞品对比表保留，用途从市场证据转为产品设计参考（含 §9 反方论证，商业化前重读）。
4. 「足够好用」的可判定定义（初值，Owner 可调）：**连续 4 周，Owner ≥80% 的内容产出经 ForgeNote 完成全流程，未回退到 ChatGPT + 手工组合**。
5. 时间盒：dogfood 打磨期 12 周，到期强制 checkpoint 三选一：继续打磨 / 开放首批外部用户 / 转向。
6. 首切片以 Owner 每周**真实**工作流为规格来源：先写 I-01 自我工作流记录，再锁切片范围（避免为「想做而非在做」的场景建功能）。

风险记录（Owner 知悉后接受）：

- 打磨陷阱：「足够好用」无判定标准会变成移动球门——以第 4 条为准，不凭感觉。
- 超配自己：个人习惯固化进产品，商业化前需用市场类证据重新校准。
- 最诚实的失败信号：Owner 自己回到旧工作流。若发生，判定为切口问题，不追加打磨。

影响文件：`docs/research/G0-LEAN-KIT.md`（市场类证据标记推迟）、`docs/research/CREATOR-ROSTER.md`（推迟）、`docs/PRD-CCOS.md` §12 验证路径与 §14（与本决策冲突处以本文件为准，暂不改文）。

---

## 产品需求基线切换（2026-07-11）

### D-13 采用 CCOS 为当前产品需求事实源，冻结 M2 实现基线

背景：`PRD-CCOS.md` 已形成新的产品定义、MVP 范围与 UX 文档体系；`PRD-M2.md` 仍承担现有代码、工程概念、Ticket 和验收材料的解释职责。直接归档 M2 会使现有实现与验收依据悬空。

拍板：

1. `PRD-CCOS.md` 即日起作为**当前产品需求事实源**；所有新增产品需求、范围和优先级决策以其为准。
2. `PRD-M2.md` 状态改为 **Frozen｜冻结的实现基线**，不再接收新产品需求。
3. `PRD-M2.md` 暂留当前目录，用于解释现有 M2 代码、Structure/Stability/Recipe 等工程概念、Ticket 与验收材料。
4. 在 CCOS Roadmap、工程契约与 M2 → CCOS 迁移矩阵完成前，不归档 `PRD-M2.md`。
5. 两份文档发生冲突时：产品目标、范围和优先级以 CCOS 为准；对尚未迁移的现有代码行为进行解释时，以 M2 实现基线及对应工程契约为准。

影响文件：`README.md`、`docs/README.md`、`docs/PRD-CCOS.md`、`docs/PRD-M2.md`。后续需同步 `AGENTS.md`、GEB 上下文、Roadmap 和工程契约。

---

## 首切口最小化（2026-07-11）

### D-13 冻结 CCOS 全量愿景，从最小切口切入

背景：Owner 判断 CCOS（灵感→双语→多平台）作为起步范围过宏观，项目复杂度已超出单人心智负荷。

拍板：

1. CCOS 五份文档（PRD-CCOS / MVP-FEATURE-LIST / USER-JOURNEY / INFORMATION-ARCHITECTURE / UX-FLOW）**冻结为北极星愿景**，12 周内不作为开发依据。双语、多平台广度、灵感库、工作流保存全部封存。
2. 首切口 = Owner 每周真实工作流里最烦的一步，单平台、单语言。具体切口待 I-01（Owner 自我工作流记录）确定后锁定。
3. 优先复用 M2 已有脊椎（结构生成 → 主内容 → 平台派生），不新起炉灶；确认差距后再决定加什么。
4. 当前唯一有效目标沿用 D-12：Owner 自用并持续使用（4 周 ≥80% 走全流程不回退）。

影响文件：CCOS 五份文档（待切口锁定后统一标注冻结状态）、`docs/roadmap/roadmap.json`（切口锁定后开票）。

---

## 首切口锁定：独居生产台（2026-07-12）

### D-14 首切口 = 独居内容生意的周更生产闭环

背景：Owner 提供真实工作流（两张 Obsidian canvas + 口述）：围绕「独居」的手册线（系统手册 + 详情页 + 公众号/豆瓣长文介绍）与选题线（小红书图文 + 公众号长文，清单引流 + 手册售卖 + 网盘收益）。三问确认：痛点 = 成稿 / 长文 / 资产关联（选题不痛）；节奏未稳；定位 = 独居生意的生产台。此工作流即 I-01（D-12 第 6 条），CCOS 的双语/多平台在真实流程中出现次数为零。

拍板：

1. 首切口 = **选题 → 结构 → 小红书图文成品 → 挂载手册/清单/网盘链接 → 归档 → 发布回填**，单语言单平台。切片 2 = 公众号长文 renderer；切片 3 = 手册配套物料。票表见 `docs/GATE0-SLICE-PLAN.md`。
2. 复用 M2 脊椎（radar / structure / content / xiaohongshu renderer / performance），不新起炉灶；已确认缺口：手动选题入口、独居品牌喂入、资产挂载字段、公众号 renderer。
3. Gate 0 dogfood 范围调整：以「独居生活指南」（小红书为主、公众号跟进）为准；原 roadmap 中「（即将开的）英文 X 账号」**移出 Gate 0**（对齐 D-13 双语冻结）。
4. 本决策同时解决 D-11 遗留的「CCOS vs M2 方向取舍」：**M2 方向（结构生成系统）维持为事实源**，CCOS 五份文档冻结为北极星愿景（D-13），其中与真实业务重合的部分（派生、资产关联）已折入切片计划。

影响文件：`docs/GATE0-SLICE-PLAN.md`（新建）、`docs/roadmap/roadmap.json`（GATE0 挂接切片计划、futureDirections 调整）、CCOS 五份文档（标注冻结）。

- `card_count` 默认与上限是否随 output_type 变（仅卡片 vs 完整包）。（PRD §17-1）
- 合规禁用词表来源（自维护初版 + 后续可配）。（PRD §17-3）
- UIUX 暂无 F-16 表现回填界面规格，需后续补充（不在本次一致性修正范围）。
