# DSN-02 Acceptance — Login Auth-Gap + Visual Fusion

## 结论

- Status: Blocked（Codex Gate 2 通过；Preview Gate 3 被 Supabase 邮件/测试账号配置阻塞）
- Date: 2026-07-01
- Ticket: DSN-02（`docs/TICKETS.md`「待评估设计票」）
- 唯一规格来源：`docs/design/dsn-02-login-auth/handoff.md`（+ `prototype.html` 量真值 / `screenshots/` 对照）
- 实现分支：`claude/dsn-02-login-impl`（PR #28，base `main`）

> Codex 裁决：DSN-02 **承接并取代** V-01-FIX-09。旧登录线 #23/#24/#26 已关闭，#28 是唯一继续推进的登录/auth PR；不得再双线修 Magic Link 或登录页局部补丁。

## 实现内容（按 handoff 逐节）

- **§1 token**：沿用暖纸感系统（深橙 `#B5562B`、表单 `#FFFDF9`/`#E3D8C7`、serif 品牌标、点阵底）；新增桌面左区 `#EEE0C9` / 右区 `#FBF7F0`。移动输入 16px 防 iOS 缩放。
- **§2 布局**：桌面左右分屏卡片（左角色区 + 左上品牌锁定，右 380 表单）；移动单列（单个 Ember + 品牌头 + 表单）。Logo 沿用现有 Zap 标。
- **§3 动效**：新增 `src/components/auth/EmberMascot.tsx`（内联 SVG，暖色 Ember 一家）——瞳孔随光标（rAF 节流）、闲置眨眼（rAF 时钟）、聚焦密码捂眼（cover）、显示密码移开视线（avert）、成功 happy + 轻跳 `fn-hop`、失败 worried + 轻晃 `fn-shake`；眼睛用 opacity 切换（非 scaleY）；全部仅 transform/opacity；`prefers-reduced-motion` 全降级（关闭跟随/眨眼/跳晃，表情瞬切）。
- **§4 状态**：登录/提交中/失败、注册（同页切换）/注册待验证、忘记密码请求/已发送、重置密码页（`/reset-password`）/完成、Google 登录中、env 未配置提示。
- **§5 文案**：`src/lib/copy/{zh-Hans,en}.ts` 重构 `login.*`（删 Magic Link 相关 key）、新增 `reset.*`；en/zh key 对齐（typecheck 保证）。
- **§6 删/增/改/留**：删 Magic Link（`signInWithOtp` 及全部相关 UI/文案/状态）；增 记住30天 + 忘记密码 + 重置流程 + 显示密码眼睛（`aria-pressed`）+ 角色动效；Google 保持次按钮；留暖纸系统 + 邮箱密码主路径 + 同页注册 + 失败不泄露账号是否存在 + 未配置提示 + 已登录跳 `/forge`。
- **§7 可访问性**：链接加下划线/加粗不只靠色；`focus-visible` 3px 暖色 ring；显示密码 `aria-label` + `aria-pressed`；表单错误 `role="alert"`、异步提示 `role="status" aria-live="polite"`；移动 16px 输入；`prefers-reduced-motion` 降级。
- **Codex QA 修正**：`EmberMascot` 原实现只在 `useEffect` 中命令式绘制，SSR/首屏截图左侧角色区为空；已补静态 SVG fallback，hydration 后再替换为动态角色，避免首屏视觉保真失败。

## §8 开放项——最小实现（待 Owner/Codex 复核）

- **角色命名**：沿用「Ember 一家」；SVG 纯装饰，容器 `aria-hidden`，SVG 自带 `aria-label`。未进品牌资产。
- **重置页路由形态**：`/auth/callback` 增 `next` 参数（仅同源相对路径，防开放重定向）；`resetPasswordForEmail` 的 redirectTo 指向 `/auth/callback?next=/reset-password`，交换出恢复会话后落新页 `/reset-password`（`updateUser({password})`）。签名/确认邮件仍回 `/forge`。
- **记住 30 天**：`createSupabaseBrowserClient({ remember })` → `@supabase/ssr` cookieOptions.maxAge：勾选=30 天持久 cookie（默认），不勾=会话级 cookie。**注意**：refresh token 服务端最长寿命仍由 Supabase 项目设置决定，属 Codex 边界，本票只控本次登录写入的 auth cookie 过期。
- **失败文案**：登录失败不暴露账号是否存在；UI 使用泛化文案，不直接展示 Supabase 原始错误消息。
- **决策记录**：`docs/DECISIONS.md` 已新增 D-10，记录彻底去掉 Magic Link、补邮箱密码重置、记住 30 天、Redirect URL 与迁移顺序硬约束。

## 验证

### Gate 2 — 自动验证（全部 PASS）

```text
npm run doctor      : PASS（0 failed / 0 warnings）
npm run lint        : PASS
npm run typecheck   : PASS（en/zh key parity）
npm run build       : PASS（新增静态路由 /reset-password；路由表其余不变；沙箱首次因 Google Fonts 网络失败，提权重跑通过）
FORGENOTE_BASE_URL=http://127.0.0.1:3000 npm run smoke:api : PASS（未改 /api/forge；匿名边界不变）
/reset-password（本地）: HTTP 200
```

### Codex Gate 2 补充复核（2026-07-01，PR #28）

```text
npm run doctor      : PASS（0 failed / 0 warnings）
npm run lint        : PASS
npm run typecheck   : PASS
npm run build       : PASS（提权访问 Google Fonts 后通过）
FORGENOTE_BASE_URL=http://127.0.0.1:3000 npm run smoke:api : PASS
git diff --check    : PASS
本地 /login HTML    : PASS（邮箱密码主路径、保持 30 天、忘记密码、Google 次按钮；Magic Link absent）
本地 /reset-password: HTTP 200
```

Codex 代码复核补充：

- `signInWithOtp`、Magic Link 相关运行时代码不存在。
- 登录 / Google / reset / update password 不直接展示 Supabase 原始错误消息。
- `/auth/callback?next=` 只接受同源相对路径，避免开放重定向。
- `docs/DECISIONS.md` 已补 D-10，认证方式变更有权威记录。

### 本地浏览器视觉/交互核对（匿名，Chrome MCP，localhost:3000）

对照 `screenshots/`：

```text
- 桌面 /login：左右分屏卡片、Ember 一家、左上品牌锁定、右暖纸表单、保持30天(默认勾)、忘记密码、深橙登录、或、Google、创建账号 —— 与 login-default-desktop.png 一致。
- 眼睛随光标：瞳孔跟随鼠标移动（idle gaze）✓
- 聚焦密码：全家捂眼（cover，抬手遮眼）✓
- 显示密码眼睛：明文显示 + 图标切 eye-off + 全家移开视线（avert）✓
- 切「创建账号」：标题/副标题切换、无记住/忘记行、返回登录 ✓
- /reset-password（匿名直访）：单个 Ember + 设置新密码标题 + 「重置链接无效或已过期」回退态（无恢复会话），不白屏 ✓
```

### Codex 浏览器视觉核查（本地，匿名）

```text
Chrome desktop 1470x730:
- 左右分屏、左侧 Ember 一家可见、右侧邮箱密码表单可见。
- 保持 30 天、忘记密码、Google 次按钮、创建账号入口可见。
- Magic Link / 发送登录链接 / 不想用密码 absent。
- 无横向溢出。

In-app browser mobile 390x760:
- 单列布局、单个 Ember、ForgeNote、分类线、slogan、邮箱、密码、保持 30 天、忘记密码、登录、Google、创建账号均可见。
- 桌面角色区隐藏；无横向溢出（scrollWidth=390）。
```

说明：本轮浏览器控制环境未执行客户端 bundle，点击态不作为交互结论；交互状态仍待 Preview Gate 3 在真实浏览器/Owner 操作下复核。

### Preview 匿名核查（PR #28，2026-07-01）

环境：

- Preview: `https://forge-note-git-claude-dsn-02-login-impl-lstosts-projects.vercel.app`
- Head: `3aa4239`
- 用户身份：匿名

实测：

```text
FORGENOTE_BASE_URL=https://forge-note-git-claude-dsn-02-login-impl-lstosts-projects.vercel.app npm run smoke:api
  PASS：非法 JSON 400 / 缺 rawInput 400 / 未登录生成 401 / 空白输入先鉴权 401

GET /login
  HTTP 200
  present：欢迎回来、邮箱、密码、保持 30 天登录、忘记密码、Google、创建账号、single/group mascot SVG fallback
  absent：Magic Link / 登录链接 / 发送登录链接 / 不想用密码

HEAD /reset-password
  HTTP 200
```

## 残余风险 / 待跑

### Preview Gate 3 阻塞（2026-07-02）

环境：

- Preview: `https://forge-note-git-claude-dsn-02-login-impl-lstosts-projects.vercel.app`
- 用户身份：匿名新用户路径
- 测试邮箱：Owner-provided Gmail test address（redacted）

实测步骤：

```text
1. 打开 /login。
2. 切到「创建账号」。
3. 输入测试邮箱 + 临时测试密码，提交创建账号。
4. 页面显示「确认邮件已发送」，无错误 alert。
5. Owner 检查测试邮箱：未收到确认邮件。
6. Codex 用同一邮箱 + 临时测试密码尝试登录：未进入 /forge，页面显示「邮箱或密码不正确，请检查后重试。」
```

结论：

- Gate 3 **Blocked**。页面请求路径可用，但这次测试不能证明“注册确认 → 密码登录 → 忘记密码 → 重置密码 → 新密码登录”认证闭环成立。
- #28 不能作为完整产品验收合并；最多只能证明 Gate 2 和匿名 Preview 可用。
- 下一步必须先查 Supabase Auth 邮件投递与测试账号状态：Email provider/SMTP、Auth logs、rate limit、邮件模板、Redirect URL，以及该邮箱是否已有 OAuth/旧账号导致 signUp 被静默处理。

### Supabase Dashboard 复核（2026-07-02）

只读检查，不改 Supabase 配置：

```text
Auth Users:
  Owner-provided Gmail test address 已存在。
  email_confirmed = true。
  has_password_hash = false。
  identities = google。
  结论：该地址是已确认的 Google-only 老账号，不是干净的邮箱密码新注册样本。

Auth > Sign In / Providers:
  Allow new users to sign up = enabled。
  Email provider = enabled。
  Confirm email = enabled。
  Google provider = enabled。

Auth > URL Configuration:
  Site URL = https://forge-note-gold.vercel.app。
  Redirect URLs 已包含 Production / localhost / Preview wildcard：
    https://forge-note-git-*-lstosts-projects.vercel.app/auth/callback

Auth > Emails:
  Templates 可见。
  页面提示当前使用默认 email templates；要编辑主题/正文需先设置 custom SMTP。

Auth > Emails > SMTP Settings:
  Enable custom SMTP = off。
  结论：认证邮件当前走 Supabase 默认邮件通道，不走自有 SMTP。

Auth > Rate Limits:
  Rate limit for sending emails = 2 emails/hour。
  结论：反复注册/重置测试极易撞到认证邮件限流。

Supabase Status:
  当前有 Supabase 技术事故横幅；状态页事故重点是 project operations / compute capacity，
  未看到明确 Auth email / SMTP 投递事故。
```

### Resend SMTP 配置复核（2026-07-02）

变更范围：只配置认证邮件投递，不改登录代码、不改 Redirect URLs、不启用 Resend receiving。

```text
Resend:
  Team created。
  Sending domain = auth.listefan.com。
  Region = Tokyo (ap-northeast-1)。
  API key = Supabase Auth SMTP（Sending access；secret 未写入仓库/文档）。
  Domain status = Verified。

Cloudflare DNS for listefan.com:
  TXT  resend._domainkey.auth  = Resend DKIM key。
  MX   send.auth               = feedback-smtp.ap-northeast-1.amazonses.com, priority 10。
  TXT  send.auth               = v=spf1 include:amazonses.com ~all。
  TXT  _dmarc                  = v=DMARC1; p=none;。
  Not added: inbound receiving MX（Resend receiving 未启用）。

DNS public verification:
  DKIM TXT resolved via 1.1.1.1。
  SPF TXT resolved via 1.1.1.1 and 8.8.8.8。
  MX resolved to feedback-smtp.ap-northeast-1.amazonses.com。
  DMARC TXT resolved via 1.1.1.1。

Supabase Auth > Emails > SMTP Settings:
  Enable custom SMTP = on。
  Admin email = no-reply@auth.listefan.com。
  Sender name = ForgeNote。
  Host = smtp.resend.com。
  Port = 587。
  User = resend。
  Password = Resend API key（saved; not readable after save）。
  Save result = Successfully updated settings。
```

QA 结论：

- 认证邮件已从 Supabase 默认邮件通道切到 Resend custom SMTP。
- 旧的 2 emails/hour Supabase 默认邮件通道不再是 DSN-02 Gate 3 的主要阻塞。
- 下一次 Gate 3 仍必须使用全新可收信地址（或 Gmail plus alias），不能复用已有 Google-only 测试账号。

QA 结论：

- 这次“收不到邮件”不能直接判定为前端 bug。
- 当时更准确的阻塞原因是：测试邮箱不是新邮箱密码账号 + 项目仍用 Supabase 默认邮件通道 + 邮件发送限制只有 2/hour。
- 下一次 Gate 3 必须使用全新可收信地址（或 Gmail plus alias），并在 1 小时窗口内只跑一次注册确认；否则测试噪声太大。
- 自定义 SMTP/Resend 已在 2026-07-02 配置完成；需要重跑注册确认与密码重置闭环。

- **Preview Gate 3（登录态）待跑**：真实密码注册→邮箱验证→登录、忘记密码→重置邮件→设新密码→登录、记住30天会话时长，均需 Supabase 邮件与真实会话，须在邮件投递问题解除后重跑。
- **移动端设备核对待跑**：本地截图工具固定分辨率，未能反映 390px 窗口；结构为 mobile-first Tailwind（默认单列 `max-w-[380]`，`lg:` 分屏），建议 Preview 设备模拟确认无横向溢出。
- **Supabase 侧配置（Owner/Codex）**：email/password provider、密码重置邮件模板、Production+Preview redirect URLs、会话/refresh 时长策略。
- **V-01-FIX-09**：已由 DSN-02 承接/取代，不再单独推进。
