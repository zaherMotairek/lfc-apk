# RedLeb Hub — master prompt gap (living doc)

Branch: **`feat/redleb-hub`**. Goal: close every item from the master prompt (phases 0→8).

Legend: ✅ done · 🟡 partial · ⬜ not started · 🔮 optional / later

## Phase 0 — Safety net

| ID | Item | Status |
|----|------|--------|
| 0.1 | Playwright smoke + baseline captures | 🟡 Desktop/mobile projects; i18n RTL smoke added |
| 0.2 | Jest API characterization + e2e flows | ✅ |
| 0.3 | Repo hygiene, SiteSetting, assert-local-db | ✅ |
| 0.4 | Phase report | 🟡 Handoff + this doc |

## Phase 1A — Editable foundation

| ID | Item | Status |
|----|------|--------|
| 1A.1 | Content registry + useContent/T | 🟡 ~35 keys; bulk codemod ⬜ |
| 1A.2 | Overrides + revisions + bundle API | ✅ |
| 1A.3 | Admin Texts + inline CMS edit | 🟡 Texts ✅; inline 🟡 |
| 1A.4 | CTA/link editor | ⬜ |
| 1A.5 | Nav editor | ⬜ |
| 1A.6 | Page block editor (drag/hide) | 🟡 CMS pages exist; not full block kit |
| 1A.7 | Media library crop/resize | 🟡 Upload exists |
| 1A.8 | Theme editor live preview | 🟡 Brand colours in settings |
| 1A.9 | Panic restore all content | ✅ Per-language panic + per-key rollback |
| 1A.10 | ar language slots | 🟡 Bundled ar defaults + import presets; committee review ⬜ |
| 1A.11 | Lint/script no hardcoded strings | 🟡 `scripts/check-user-facing-strings.mjs` |

## Phase 1 — Committee (1–19)

| # | Item | Status |
|---|------|--------|
| 1 | Configurable brand + manifest | 🟡 Upload + dynamic manifest; sharp PWA sizes on icon upload ✅ |
| 2 | RedLeb naming | 🟡 UI/seed; internal package names unchanged (OK) |
| 3–11 | Home copy + carousel + single Sign in | 🟡 |
| 12 | No duplicate Member Login | ✅ |
| 13 | Guests 0–2 + admin/CSV | ✅ |
| 14 | ALLRED SUPPORT ID | ✅ |
| 15–17 | Last seen, login events, activity panel | ✅ |
| 18 | No LIVE UI | 🟡 Member celebration overlay removed; admin LIVE panel gated off |
| 19 | Newsletter monthly workflow | 🟡 Member emails + schedule cron (Phase 6) |

## Phases 2–8

See **`docs/REDLEB-PHASE-TRACKER.md`** for detail. Summary:

| Phase | Status | Next sprint focus |
|-------|--------|-------------------|
| 2 | 🟡 | Digital card polish, Lighthouse, offline page |
| 3 | 🟡 | Audit log UI, settings tabs, moderation |
| 4 | 🟡 | .ics calendar, invitation cards, QR check-in |
| 5 | 🟡 | Web push + admin broadcast ✅; directory opt-in ✅ |
| 6 | 🟡 | Newsletter schedule/publish workflow |
| 7 | 🟡 | Throttler ✅; storage doc; CI ✅ |
| 8 | 🟡 | RTL ar + staging/go-live docs |

## Execution order (until 100 %)

1. Close Phase 1 gaps (sharp icons, item 19 handoff to 6).
2. Complete 1A registry + string lint in CI.
3. Phase 3 admin (audit, dashboard stats, moderation).
4. Phase 4 events (.ics ✅, waitlist, QR).
5. Phase 5–6 notifications + newsletter.
6. Phase 8 i18n/RTL + launch docs.

Update rows as items land. Last updated: sprint « finish all ».
