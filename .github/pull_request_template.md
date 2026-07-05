## Ticket

- Ticket:
- Acceptance doc:

## What Changed

-

## Out Of Scope

-

## Verification

- [ ] `npm run doctor`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run smoke:api` — 改动 `/api/forge` 行为时（匿名冒烟：合法 body → `AUTH_REQUIRED`）
- [ ] `npm run db:test-rls` — 改动数据库 / RLS 时（需 `DATABASE_URL` + psql）
- [ ] eval（`node scripts/eval-forge.mjs`）— 改动模型 prompt / 输出结构 / 验收逻辑时；需登录态，详见脚本头注释（I-13 正式接入）

## QA / User Path Acceptance

- Environment:
- User identity:
- Path:
- Result: Pass / Conditional Pass / Fail / Blocked
- Evidence:
- Residual risk:

## Screenshots / Recording

-

## Risks

-

## Docs Updated

- [ ] `docs/OPERATING-MODEL.md`（若角色 / gate / 验收协议变更）
- [ ] `docs/roadmap/roadmap.json`（票状态 + 验收证据链接）
- [ ] `docs/acceptance/*.md`
- [ ] `docs/DECISIONS.md`（若决策变更）
