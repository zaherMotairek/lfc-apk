# RedLeb Hub — committee presentation (local)

**Output PDF:** `RedLeb-Hub-Committee-Presentation.pdf`

Regenerate (demo DB only, fictional data):

```bash
SEED_E2E_FIXTURES=true npm run prisma:seed -w @kop/api
node scripts/seed-committee-demo.mjs
# API (node apps/api/dist/src/main.js) + Vite on :5173
PLAYWRIGHT_SKIP_WEBSERVER=1 node scripts/capture-committee-shots.mjs
node scripts/build-committee-html.mjs
node scripts/generate-committee-pdf.mjs
```

Admin-only screenshot retry: `COMMITTEE_SKIP_PUBLIC=1`.