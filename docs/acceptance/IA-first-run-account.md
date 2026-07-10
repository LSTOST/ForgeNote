# IA Fix · First-run Home And Account Page

Date: 2026-07-10

## Scope

- `/first-run` becomes the logged-in App Home.
- `/account` becomes the account analysis page and reuses `AccountIntake`.
- Workspace Home goes to `/first-run`; account-analysis links go to `/account`.
- No API, schema, database, or auth implementation changed.

## Local Verification

- `npm run lint` PASS
- `npm run typecheck` PASS
- `npm run build` PASS
- `npm run doctor` PASS
- `npm run check:intake` PASS
- `npm run check:auth-redirects` PASS
- `npm run check:structure` PASS
- `npm run check:main-content` PASS
- `npm run check:derive` PASS
- `node scripts/progress-dashboard.mjs` PASS, no drift output

## Route Checks

Environment: local dev server on `http://localhost:3000`.

- `curl -I http://localhost:3000/login` -> `200 OK`
- `curl -I http://localhost:3000/first-run` -> `307 Temporary Redirect`, `location: /login`
- `curl -I http://localhost:3000/account` -> `307 Temporary Redirect`, `location: /login`
- `curl -I 'http://localhost:3000/workspace?idea=%E6%B5%8B%E8%AF%95%E5%86%85%E5%AE%B9'` -> `307 Temporary Redirect`, `location: /login`

## Residual Risk

Logged-in click-through visual QA was not completed because no authenticated browser session or test account was available in this run. The logged-in flow is covered by code path review plus successful build:

- `/first-run` submits to `/workspace?idea=${encodeURIComponent(input)}`.
- `/first-run` account-analysis links target `/account`.
- `/account` renders the existing `AccountIntake` component.
- `/workspace` Home link targets `/first-run`.
