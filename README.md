# Kop Platform

Official digital platform for OLSC Lebanon (Official Liverpool Supporters Club Lebanon).

## Structure

```text
kop-platform/
├── apps/
│   ├── api/    # NestJS backend
│   └── web/    # React + Vite frontend
└── packages/
    └── shared/ # Shared types and constants
```

## Prerequisites

- Node.js 20+
- PostgreSQL 14+

## Getting started

If `npm install` fails with `ETIMEDOUT` on a corporate network, use mobile hotspot or home internet.

Full checklist: see `SETUP-AT-HOME.md`.

Production launch: see `LAUNCH-CHECKLIST.md`.

1. Copy environment file:

```bash
copy .env.example .env
```

2. Install dependencies:

```bash
npm.cmd install
```

3. Configure `DATABASE_URL` in `.env`.

4. Build shared package, then migrate and seed:

```bash
npm.cmd run build:shared
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
npm.cmd run prisma:seed
```

5. Start development servers:

```bash
npm.cmd run dev:api
npm.cmd run dev:web
```

## Important notes

- This platform does **not** replace the official OLSC membership process.
- Official member IDs are provided by the committee only.
- Respect LFC / OLSC content and branding guidelines.
