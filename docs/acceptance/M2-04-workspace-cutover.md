# M2-04 登录落点切到 /workspace — 验收证据

结论: Conditional Pass
日期: 2026-07-09
验收人: Codex (Tech Lead + QA Agent)
范围: 登录落点、旧 `/forge` 停写、运行时入口清理、当前 runbook 同步
未触及: Owner 真实邮箱密码 / Google OAuth 登录路径

## 实现验收部分

- [x] 已登录访问 `/login` 直接跳 `/workspace`：`src/app/login/page.tsx`。
- [x] 邮箱密码登录成功后进入 `/workspace`：`src/components/auth/LoginForm.tsx`。
- [x] 邮箱注册如果直接建立 session，进入 `/workspace`：`src/components/auth/LoginForm.tsx`。
- [x] reset-sent 期间检测到 session，进入 `/workspace`：`src/components/auth/LoginForm.tsx`。
- [x] OAuth / email confirmation 回调默认进入 `/workspace`：`src/app/auth/callback/route.ts`。
- [x] TopNav 品牌入口指向 `/workspace`：`src/components/layout/TopNav.tsx`。
- [x] 运行时 route 列表无 `/forge` 页面、无 `/api/forge`、无 `src/components/forge`。
- [x] 当前 runbook 已从 `/forge` / `/api/forge` 切到 M2 `/workspace` 与 M2 check 脚本。

## 自动验证部分

- [x] `npm run lint` -> 通过
- [x] `npm run typecheck` -> 通过
- [x] `npm run build` -> 通过，build route list 无 `/forge`
- [x] `npm run doctor` -> 通过，0 failed / 0 warnings
- [x] `rg "/api/forge|/forge|eval:forge|smoke:api" docs/RUNBOOK.md src/app src/components src/lib` -> 仅剩说明性旧路径注释，无运行时入口

## Owner 浏览器验收

未执行，待 Owner 用真实账号确认：

1. 打开 `/login`
2. 邮箱密码登录成功后落到 `/workspace`
3. Google OAuth 登录成功后落到 `/workspace`
4. 已登录状态访问 `/login` 自动跳 `/workspace`
5. 未登录访问 `/workspace` 自动跳 `/login`

## 残余风险

- 真实邮箱密码 / Google OAuth 往返未在本轮浏览器执行，不能标 `accepted`。
- 历史归档和旧 M1 acceptance 文档仍保留 `/forge` 叙述；这些不是当前运行时事实源。
