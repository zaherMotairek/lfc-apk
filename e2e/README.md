# Playwright smoke (RedLeb Hub / Phase 0)

## Prerequisites

1. Local PostgreSQL (`DATABASE_URL` → `localhost` only).
2. `npm run prisma:migrate` and `npm run prisma:seed` at repo root.
3. Optional demo routes: `SEED_E2E_FIXTURES=true npm run prisma:seed`.
4. API running: `npm run dev:api` (port 3000).
5. Web is started automatically by Playwright unless `PLAYWRIGHT_SKIP_WEBSERVER=1`.
6. First run: `npx playwright install chromium` (mobile + desktop smoke use Chromium).
7. Auth smokes need API + web: run `npm run test:e2e:auth` (Playwright starts both). If login shows “Unable to reach the API”, wait for the dev servers or run the full smoke command first.
8. Passwords must match seed: `SEED_SUPER_ADMIN_PASSWORD` / `E2E_ADMIN_PASSWORD` (default `ChangeMeNow123!` in CI).
7. Default base URL is `http://localhost:5173` (not `127.0.0.1` — Vite on Windows).

## Commands

```bash
npm run test:e2e
```

Screenshots are written to `e2e/baseline/<mobile|desktop>/` (PNG files are gitignored).

## Auth env

- Admin: `E2E_ADMIN_USERNAME` / `E2E_ADMIN_PASSWORD` (defaults: `admin` + `SEED_SUPER_ADMIN_PASSWORD`).
- Member: `e2e.member` / `E2eMember123!` when E2E fixtures are seeded.
