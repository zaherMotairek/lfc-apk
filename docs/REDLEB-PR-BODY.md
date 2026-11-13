## Summary

RedLeb Hub delivers the OLSC Lebanon committee platform on branch `feat/redleb-hub`: public site + member app (PWA), admin control center, editable content registry (EN/ar), events, predictions, newsletter workflow, push notifications, and operational safety (audit, migrations, CI).

### Highlights

- **Branding & i18n**: Dynamic manifest, EN/عربي switch, RTL, registry-backed nav labels (public + member), panic restore + Arabic presets in `/admin/texts`
- **Members**: Digital card + QR, directory opt-in, leaderboard privacy, push subscribe, data export
- **Admin**: Dashboard metrics, moderation, event QR check-in, newsletter schedule + member emails, push broadcast, site settings, audit log
- **Tech**: Service worker for offline + push (prod), admin route code-splitting, Playwright smoke + auth in CI, API e2e (11 tests)

### Not in scope (honest)

Full master-prompt closure: admin nav reorder, 100 % string codemod, Lighthouse budget in CI. See `docs/REDLEB-MASTER-GAP.md`.

## Test plan

- [ ] `npm ci && npm run build && npm run test:api:e2e`
- [ ] `npm run test:e2e:smoke` (public + i18n)
- [ ] `npm run test:e2e:auth` with `SEED_E2E_FIXTURES=true` seed and matching passwords
- [ ] Staging: SMTP, optional VAPID, migrations `20261113120000`–`20261113150000`
- [ ] Committee sign-off on Arabic copy in Admin → Texts

## Deploy notes

Handoff: `docs/REDLEB-HUB-HANDOFF.md` · Merge checklist: `docs/REDLEB-PR-READY.md` · Launch: `LAUNCH-CHECKLIST.md`
