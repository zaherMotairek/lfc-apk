# RedLeb Hub — overnight handoff (feat/redleb-hub)

This branch implements **Phase 0** fully and a **pragmatic slice of Phases 1A–1** plus foundations for later phases. The original master prompt spans many months; items below mark what is **done**, **partial**, or **deferred**.

## Done (use tomorrow)

| Area | What you get |
|------|----------------|
| **Branding** | `RedLeb Hub` naming in HTML, PWA manifest, member/admin chrome; configurable logo via `GET /api/brand` + wordmark placeholder |
| **Home** | New hero CTA → `/membership/apply`, highlight carousel (gallery), removed duplicate “Member Login” on home; footer/header single **Sign in** |
| **Content** | Registry in `@kop/shared`, overrides API `GET /api/content/bundle`, admin **Texts & Labels** at `/admin/texts` |
| **Settings** | `SiteSetting` table — payment phone, WhatsApp, brand keys (no real numbers in repo) |
| **Events** | `guestCount` 0–2 on registrations (API + community page) |
| **Members** | XP/coins hidden in UI; XP/coin **awards disabled** in API; live goal feed removed; Match Hub no LIVE timeline |
| **Safety** | `assert-local-db.mjs`, Jest + API e2e, Playwright smoke scaffold |
| **IDs** | UI label **ALLRED SUPPORT ID** (DB column `lfcId` unchanged); import still accepts `lfc id` header |

## Partial / next sprints

See **`docs/REDLEB-PHASE-TRACKER.md`** for live status.

- **Phase 1A**: Registry has ~12 keys; most UI strings still in CMS/components — extend registry + codemod
- **Phase 3**: `/admin/settings` + brand image upload; ConfirmProvider; logo sharp/manifest still TODO
- **Tooling**: ESLint flat config at repo root; Playwright starts API+web via `scripts/playwright-serve.mjs`
- **Phases 4–8**: Incremental — not complete per master prompt

## Local commands

```powershell
npm run prisma:migrate
npm run prisma:seed
# optional demo user + news/event for Playwright:
$env:SEED_E2E_FIXTURES="true"; npm run prisma:seed
npm run dev:api
npm run dev:web
npm run build
npm run test
npm run test:api:e2e
```

## Branche

Branch **`feat/redleb-hub`** is on GitHub (`origin/feat/redleb-hub`). Open a PR to merge into `main` when ready.
