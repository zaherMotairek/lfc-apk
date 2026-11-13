# RedLeb Hub — PR & merge readiness (`feat/redleb-hub`)

Use this before merging into `main` or cutting a production release.

## Automated gates (local / CI)

```powershell
npm ci
npm run prisma:migrate:deploy -w @kop/api
npm run build
npm run test:api:e2e
npm run check:strings
npm run test:e2e:smoke
npm run test:e2e:auth
npm run lighthouse:smoke
```

Playwright starts API + web automatically (see `playwright.config.ts`). For member/admin auth smokes, seed with `SEED_E2E_FIXTURES=true` first locally.

GitHub Actions runs `test:e2e:smoke` and `test:e2e:auth` on every PR.

## Committee sign-off

- [ ] Arabic copy reviewed in **Admin → Texts** (filter *Navigation*, *Member navigation*, *Home*)
- [ ] Brand icons uploaded in **Site settings** (light/dark + PWA icon)
- [ ] `features.pushEnabled` / SMTP / VAPID decided for prod
- [ ] Sample event, news post, and newsletter issue published on staging
- [ ] Membership apply flow tested end-to-end on mobile (390px)

## Production env (see `LAUNCH-CHECKLIST.md`)

- [ ] `APP_URL`, `VITE_API_URL`, HTTPS
- [ ] JWT secrets rotated
- [ ] **No** default seed password on prod DB
- [ ] Migrations applied (`20261113120000` … `20261113150000`)

## Create the PR

No `gh` on some machines — open manually:

https://github.com/zaherMotairek/lfc-apk/compare/main...feat/redleb-hub

Suggested title: **RedLeb Hub — committee platform (phases 0–8 partial)**

## After merge

1. Deploy API + web + run migrations on prod.
2. Smoke: `/`, `/login`, `/app`, `/admin` (committee account).
3. Monitor audit log + email deliverability for first newsletter.

## Honest scope

Not every master-prompt line item is 100 %. See `docs/REDLEB-MASTER-GAP.md` for remaining work (full string codemod, stricter Lighthouse budgets).
