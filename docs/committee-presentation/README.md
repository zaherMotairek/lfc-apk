# RedLeb Hub — committee presentation (local)

**Output PDF:** `RedLeb-Hub-Committee-Presentation.pdf`

Regenerate (demo DB only, fictional data):

```bash
SEED_E2E_FIXTURES=true npm run prisma:seed -w @kop/api
node scripts/seed-committee-demo.mjs
# API (node apps/api/dist/src/main.js) + Vite on :5173
node scripts/committee-presentation-auth.mjs
PLAYWRIGHT_SKIP_WEBSERVER=1 node scripts/capture-committee-guide.mjs
node scripts/build-committee-guide-html.mjs
node scripts/generate-committee-pdf.mjs
```

Optional page images for QA: `COMMITTEE_PDF_PREVIEW=1 node scripts/generate-committee-pdf.mjs` (not committed).

Legacy one-shot capture: `scripts/capture-committee-shots.mjs` · HTML builder: `build-committee-guide-html.mjs`