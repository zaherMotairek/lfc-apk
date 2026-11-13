# RedLeb Hub — handoff (feat/redleb-hub)



Branch **`feat/redleb-hub`** on GitHub. **Not** every master-prompt item is done — see **`docs/REDLEB-MASTER-GAP.md`** and **`docs/REDLEB-PHASE-TRACKER.md`**.



## Ready for committee (high level)



| Area | What works |

|------|------------|

| **Public** | RedLeb branding, home carousel, single Sign in, events (+ waitlist, `.ics`, guests), EN/عربي switch |

| **Members** | 5-tab mobile app, card + QR, predictions (toggle in settings), leaderboard privacy opt-out, directory opt-in, notifications + push subscribe (VAPID + SW in prod) |

| **Admin** | Dashboard, texts + panic restore, settings + push broadcast, audit, moderation, event QR check-in, newsletter schedule + member emails |

| **Safety** | Local DB guard, migrations additive, e2e tests, CI + `check:strings`, Playwright smoke + i18n RTL |



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



Push on localhost: set `VITE_ENABLE_SW=true` in `apps/web/.env.local`, build or preview with HTTPS tunnel.



## Production checklist



- Run all pending Prisma migrations on staging/prod DB (never seed prod with default password).

- Set strong `SEED_*` only on local; prod super-admin via invitation.

- Configure SMTP (member dispatch emails on publish), optional Cloudinary, `VAPID_*` if push enabled + `features.pushEnabled=true` in site settings.

- Optional: `NEWSLETTER_MEMBER_EMAILS=false` to disable blast emails.

- **HTTPS required** for PWA push. Service worker registers automatically on **production builds** (`npm run build` + static host).

- Merge checklist: **`docs/REDLEB-PR-READY.md`**
- Open PR: https://github.com/zaherMotairek/lfc-apk/pull/new/feat/redleb-hub



## Still open (honest)



Phases **1A** (nav/CTA editors, bulk codemod), **2** (Lighthouse pass), **3** (CMS panic beyond texts), **8** (committee review of Arabic copy). Roughly **~8–12** more focused dev sprints for 100 % of the original prompt.

