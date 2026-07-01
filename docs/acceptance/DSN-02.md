# DSN-02 Acceptance — Login Auth-Gap + Visual Fusion

## 结论

- Status: Review（Gate 2 通过；Preview Gate 3 登录态 + 移动端待跑）
- Date: 2026-07-01
- Ticket: DSN-02（`docs/TICKETS.md`「待评估设计票」）
- 唯一规格来源：`docs/design/dsn-02-login-auth/handoff.md`（+ `prototype.html` 量真值 / `screenshots/` 对照）
- 实现分支：`claude/dsn-02-login-auth-ticket`（基于 `origin/main` = DSN-03 baseline + FIX-08）

> ⚠️ 与进行中的 **V-01-FIX-09（登录/注册模式 + Magic Link 负担）** 重叠。本 PR 基于 FIX-08 的 `main`，未纳入 FIX-09；合并前需 Codex 裁定二者关系（取代/承接/合并），避免双线冲突。

## 实现内容（按 handoff 逐节）

- **§1 token**：沿用暖纸感系统（深橙 `#B5562B`、表单 `#FFFDF9`/`#E3D8C7`、serif 品牌标、点阵底）；新增桌面左区 `#EEE0C9` / 右区 `#FBF7F0`。移动输入 16px 防 iOS 缩放。
- **§2 布局**：桌面左右分屏卡片（左角色区 + 左上品牌锁定，右 380 表单）；移动单列（单个 Ember + 品牌头 + 表单）。Logo 沿用现有 Zap 标。
- **§3 动效**：新增 `src/components/auth/EmberMascot.tsx`（内联 SVG，暖色 Ember 一家）——瞳孔随光标（rAF 节流）、闲置眨眼（rAF 时钟）、聚焦密码捂眼（cover）、显示密码移开视线（avert）、成功 happy + 轻跳 `fn-hop`、失败 worried + 轻晃 `fn-shake`；眼睛用 opacity 切换（非 scaleY）；全部仅 transform/opacity；`prefers-reduced-motion` 全降级（关闭跟随/眨眼/跳晃，表情瞬切）。
- **§4 状态**：登录/提交中/失败、注册（同页切换）/注册待验证、忘记密码请求/已发送、重置密码页（`/reset-password`）/完成、Google 登录中、env 未配置提示。
- **§5 文案**：`src/lib/copy/{zh-Hans,en}.ts` 重构 `login.*`（删 Magic Link 相关 key）、新增 `reset.*`；en/zh key 对齐（typecheck 保证）。
- **§6 删/增/改/留**：删 Magic Link（`signInWithOtp` 及全部相关 UI/文案/状态）；增 记住30天 + 忘记密码 + 重置流程 + 显示密码眼睛（`aria-pressed`）+ 角色动效；Google 保持次按钮；留暖纸系统 + 邮箱密码主路径 + 同页注册 + 失败不泄露账号是否存在 + 未配置提示 + 已登录跳 `/forge`。
- **§7 可访问性**：链接加下划线/加粗不只靠色；`focus-visible` 3px 暖色 ring；显示密码 `aria-label` + `aria-pressed`；表单错误 `role="alert"`、异步提示 `role="status" aria-live="polite"`；移动 16px 输入；`prefers-reduced-motion` 降级。

## §8 开放项——最小实现（待 Owner/Codex 复核）

- **角色命名**：沿用「Ember 一家」；SVG 纯装饰，容器 `aria-hidden`，SVG 自带 `aria-label`。未进品牌资产。
- **重置页路由形态**：`/auth/callback` 增 `next` 参数（仅同源相对路径，防开放重定向）；`resetPasswordForEmail` 的 redirectTo 指向 `/auth/callback?next=/reset-password`，交换出恢复会话后落新页 `/reset-password`（`updateUser({password})`）。签名/确认邮件仍回 `/forge`。
- **记住 30 天**：`createSupabaseBrowserClient({ remember })` → `@supabase/ssr` cookieOptions.maxAge：勾选=30 天持久 cookie（默认），不勾=会话级 cookie。**注意**：refresh token 服务端最长寿命仍由 Supabase 项目设置决定，属 Codex 边界，本票只控本次登录写入的 auth cookie 过期。
- **失败文案**：统一「邮箱或密码不正确」，不区分账号是否存在（防枚举）。

## 验证

### Gate 2 — 自动验证（全部 PASS）

```text
npm run doctor      : PASS（0 failed / 0 warnings）
npm run lint        : PASS
npm run typecheck   : PASS（en/zh key parity）
npm run build       : PASS（新增静态路由 /reset-password；路由表其余不变）
FORGENOTE_BASE_URL=http://127.0.0.1:3000 npm run smoke:api : PASS（未改 /api/forge；匿名边界不变）
/reset-password（本地）: HTTP 200
```

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

## 残余风险 / 待跑

- **Preview Gate 3（登录态）待跑**：真实密码注册→邮箱验证→登录、忘记密码→重置邮件→设新密码→登录、记住30天会话时长，均需 Supabase 邮件与真实会话，须在 Preview + Owner 操作下验。
- **移动端设备核对待跑**：本地截图工具固定分辨率，未能反映 390px 窗口；结构为 mobile-first Tailwind（默认单列 `max-w-[380]`，`lg:` 分屏），建议 Preview 设备模拟确认无横向溢出。
- **Supabase 侧配置（Owner/Codex）**：email/password provider、密码重置邮件模板、Production+Preview redirect URLs、会话/refresh 时长策略。
- **与 V-01-FIX-09 关系**：Codex 裁定。
