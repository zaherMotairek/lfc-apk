## Summary

RedLeb Hub on **`feat/redleb-hub`**: OLSC Lebanon public site, member PWA, and committee admin — editable copy (EN + عربي), events, predictions-first Match Hub, newsletter workflow, push, and production safety (audit, migrations, CI).

### Highlights

- **Content**: ~100 registry keys, panic restore, Arabic import presets; nav labels + order/hide (public, member, admin) via Site settings → Navigation + Texts
- **Members**: Digital card, QR, directory opt-in, leaderboard privacy, push (VAPID), offline shell (EN/ar)
- **Admin**: Dashboard + quick links in registry, moderation, QR check-in, newsletter schedule + member emails, push broadcast, feature flags (`matchLiveEnabled` default **off**)
- **CI**: build + API e2e (11), `check:strings`, Playwright smoke/auth, Lighthouse on `offline.html`

### Honest gaps

No full page-block drag CMS, no 100 % string codemod. See `docs/REDLEB-MASTER-GAP.md`.

## Test plan

- [ ] `npm ci && npm run build && npm run test:api:e2e && npm run check:strings`
- [ ] `npm run test:e2e:smoke` and `npm run test:e2e:auth` (seed: `SEED_E2E_FIXTURES=true`, passwords per CI)
- [ ] `npm run lighthouse:smoke`
- [ ] Staging: migrations `20261113120000`–`20261113150000`, SMTP, optional VAPID
- [ ] Committee: Arabic in Admin → Texts; brand in Site settings

## Deploy

`docs/REDLEB-HUB-HANDOFF.md` · `docs/REDLEB-PR-READY.md` · `LAUNCH-CHECKLIST.md`

**Compare:** https://github.com/zaherMotairek/lfc-apk/compare/main...feat/redleb-hub
