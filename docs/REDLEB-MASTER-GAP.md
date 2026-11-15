# RedLeb Hub — master prompt gap (living doc)

**Baseline:** `main` @ merge **PR #1** (squash `50f8a68`, 13 Nov 2026).  
**Branch cleanup:** `fix/redleb-cleanup` (modal admin, naming, ALLRED labels).

Legend: ✅ done · 🟡 partial · ⬜ not started · 🔮 optional / later

## Executive summary (13 Nov 2026)

| Area | Status |
|------|--------|
| Merge to `main` | ✅ PR #1 merged — production path is `main`, not only `feat/redleb-hub` |
| CI | ✅ build-test, Playwright smoke/auth, Lighthouse on `offline.html`, strict `check:strings` |
| Committee launch | 🟡 Staging deploy, Arabic copy sign-off, SMTP/VAPID, prod secrets still human |
| Master prompt 100% | 🟡 ~85–90% — no drag-block CMS, no full string codemod, some public pages still hardcoded EN |

## Phase 0 — Safety net

| ID | Item | Status |
|----|------|--------|
| 0.1 | Playwright smoke + baseline captures | ✅ CI + `e2e/baseline/` (PNPs often gitignored) |
| 0.2 | Jest API + e2e flows | ✅ 11 API e2e |
| 0.3 | Repo hygiene, SiteSetting, assert-local-db | ✅ |
| 0.4 | Phase report | ✅ Handoff, PR-READY, PHASE-TRACKER, this doc |

## Phase 1A — Editable foundation

| ID | Item | Status |
|----|------|--------|
| 1A.1 | Content registry + useContent | 🟡 ~100 keys; bulk codemod ⬜ |
| 1A.2 | Overrides + revisions + bundle API | ✅ |
| 1A.3 | Admin Texts + inline CMS | 🟡 Texts + modal edit ✅; inline public 🟡 |
| 1A.4 | CTA/link editor | 🟡 Registry keys; no visual CTA builder |
| 1A.5 | Nav editor | ✅ Labels (Texts) + order/hide (Site settings → Navigation) |
| 1A.6 | Page block editor | 🟡 CMS pages; no drag/hide kit |
| 1A.7 | Media library | 🟡 Upload + brand slots |
| 1A.8 | Theme live preview | 🟡 Colours in settings; `/admin/design` = reference only |
| 1A.9 | Panic restore | ✅ |
| 1A.10 | ar slots | 🟡 Presets + import; committee review ⬜ |
| 1A.11 | String lint | ✅ `check:strings` strict in CI |

## Phase 1 — Committee (1–19)

| # | Item | Status |
|---|------|--------|
| 1 | Brand + manifest | 🟡 Upload, dynamic manifest; sharp multi-size icons 🟡 |
| 2 | RedLeb naming | 🟡 UI/docs; internal `kop-*` package names OK |
| 3–11 | Home / carousel / Sign in | 🟡 Registry + CMS defaults |
| 12 | Single Sign in | 🟡 Mostly done; spot-check About/Membership |
| 13 | Guests 0–2 | ✅ |
| 14 | ALLRED SUPPORT ID | ✅ UI + exports; DB field `lfcId` unchanged |
| 15–17 | Last seen / activity | ✅ |
| 18 | No LIVE spectacle | ✅ `matchLiveEnabled` default false |
| 19 | Newsletter workflow | 🟡 Schedule, emails, cron; committee process manual |

## Phases 2–8 (summary)

| Phase | Status | Notes |
|-------|--------|-------|
| 2 | 🟡 | Lazy admin, offline PWA EN/ar, Lighthouse CI ✅ |
| 3 | 🟡 | Audit, moderation, settings tabs, dashboard registry |
| 4 | 🟡 | Guests, waitlist, `.ics`, QR check-in, invitation card |
| 5 | 🟡 | Push + SW + directory opt-in |
| 6 | 🟡 | Newsletter publish + member email blast |
| 7 | 🟡 | CI matrix, ops/privacy docs |
| 8 | 🟡 | ar bundles; RTL ✅; launch checklist |

## Still open (honest backlog)

- Full **user-facing string codemod** (admin/public leftovers).
- **CMS block editor** (drag/hide/reorder).
- **Member login → Sign in** on every legacy public string.
- **Staging/prod** deploy + committee UAT on real HTTPS (push PWA).
- Optional: admin route editor UI, perf budget on `/` (not only offline).

Update this file when a sprint closes a row. Last updated: **13 Nov 2026** (`fix/redleb-cleanup`).