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

## UI 实现与设计交付流程（2026-06-20）

明确 v0 / Claude Code / Codex / Copilot 的分工与边界，作为 M1 页面设计与落地的权威依据。本节只规范交付流程，不改产品功能、不改页面代码。

### 工具分工

| 工具 | 职责 | 边界 |
|---|---|---|
| v0 | 生成核心页面的视觉首稿、布局方向、组件组合 | 不直接接管整个代码仓库；不接后端、认证、数据库或业务逻辑 |
| Claude Code | 将确认后的 v0 设计落地到真实 Next.js 项目，并补齐状态、交互、响应式与可访问性 | 必须遵守 `UIUX-M1.md`、`DATA-SCHEMA.md`、`API-CONTRACT.md` |
| Codex | 在复杂功能前做实现方案审查；在 PR 后按 PRD/UIUX 验收 | 不负责主力页面开发 |
| GitHub Copilot | 自动 PR 基础代码审查 | 不作为产品验收依据 |

### 页面设计策略

M1 页面分两类：

1. 核心体验页面：先用 v0 出视觉首稿，再由 Claude Code 接入项目
   - `/forge`
   - `/recipes/[id]`（后续配方详情页）

2. 工具型页面：直接由 Claude Code 按 `UIUX-M1.md` 实现
   - `/login`
   - `/recipes`
   - `/profile`
   - `/history`

### v0 使用规则

1. v0 仅生成单页视觉方案，不生成完整产品。
2. 每次只设计一个页面或一个关键组件。
3. v0 输出不得直接覆盖现有仓库。
4. 设计确认后，Claude Code 参考 v0 输出重写为项目内组件。
5. 所有业务状态、按钮行为、错误态、加载态，以 `UIUX-M1.md` 为唯一准则。
6. v0 生成的文案、假数据、API、认证逻辑均不作为实现依据。

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

## v5 选择性折叠（2026-06-21）

承接产品定位讨论：战略方向调整为**国际市场 + 图文卡片/carousel 格式 + 多语言**（放弃大陆，规避备案/网信办与 OpenAI/Anthropic 不可直连）。但 M1 代码已建在 v4 小红书线（login / forge / recipes 已交付并验收）。决定：**保留已建代码，选择性折叠 v5**——只折叠"便宜且重要、对现有代码增量"的部分，推迟"贵且会推翻代码"的部分。本节只定折叠边界，不改既有功能语义。

### D-06 战略方向记录（不立即落地）

- 方向 = 国际 + carousel + 多语言；M1 **不为此推翻**已建的 v4 小红书代码。
- `content_package` 已是卡片式（`cardStructure` / `cardPrompts`），本身与 carousel 兼容，无需改输出结构。
- 影响文件：本记录为方向锚点，不直接改代码。

### D-07 现在折叠（additive，低重做）

- **(a) i18n 文案外化**：UI 文案抽成资源文件（en + zh-Hans 脚手架），不改行为。理由：文案外化成本随页面增长上升，越晚越贵。→ 票 I-15。
- **(b) output_locale 预留**：`sessions` / `recipes` 增 `output_locale`（nullable）；assumption 增 `output_locale` 维度（由 audience 决定，impact=High，可问）。仿 D-02 预留 F-16 字段的方式，additive 不破坏现状。→ 票 I-16。
- **(c) 商业化定位**：freemium 订阅假设写入 PRD（M1 不收费，但验证可收费性：保存率/重跑率/留存即付费意愿先行指标）。纯文档。→ `PRD-M1.md` §4.3。

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

## 仍待拍板（未纳入 Day 0）

- `card_count` 默认与上限是否随 output_type 变（仅卡片 vs 完整包）。（PRD §17-1）
- 合规禁用词表来源（自维护初版 + 后续可配）。（PRD §17-3）
- UIUX 暂无 F-16 表现回填界面规格，需后续补充（不在本次一致性修正范围）。
