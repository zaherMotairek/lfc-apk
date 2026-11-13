# RedLeb Hub — handoff (feat/redleb-hub)

Branch **`feat/redleb-hub`** on GitHub. **Not** every master-prompt item is done — see **`docs/REDLEB-MASTER-GAP.md`** and **`docs/REDLEB-PHASE-TRACKER.md`**.

## Ready for committee (high level)

| Area | What works |
|------|------------|
| **Public** | RedLeb branding, home carousel, single Sign in, events (+ waitlist, `.ics`, guests), EN/عربي switch |
| **Members** | 5-tab mobile app, card + QR, predictions (toggle in settings), leaderboard privacy opt-out, directory opt-in, notifications + push subscribe (needs VAPID) |
| **Admin** | Dashboard (incl. inactive 30d, applications), texts + rollback, settings, audit, moderation, event QR check-in, newsletter draft/schedule, RedLeb Dispatch builder |
| **Safety** | Local DB guard, migrations additive, e2e tests, CI + `check:strings` |

## Local setup

```powershell
npm ci
npm run prisma:migrate
npm run prisma:seed
npm run dev:api
npm run dev:web
npm run build
npm run test:api:e2e
```

Optional: `SEED_E2E_FIXTURES=true npm run prisma:seed` for Playwright member routes.

## Production checklist

- Run all pending Prisma migrations on staging/prod DB (never seed prod with default password).
- Set strong `SEED_*` only on local; prod super-admin via invitation.
- Configure SMTP, optional Cloudinary, `VAPID_*` if push enabled + `features.pushEnabled=true` in site settings.
- HTTPS required for PWA push.
- Open PR: https://github.com/zaherMotairek/lfc-apk/pull/new/feat/redleb-hub

## Still open (honest)

Phases **1A** (full string registry / nav editors), **2** (Lighthouse, card hero polish), **3** (scheduled CMS publish, panic restore), **6** (email blast to members), **8** (fill Arabic copy in admin texts). Estimate **weeks** of committee + dev time for 100 % of the original prompt.
