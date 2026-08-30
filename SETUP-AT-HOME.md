# Home Setup Checklist (when network works)

Corporate network currently blocks `registry.npmjs.org` (`ETIMEDOUT`).
Run these steps at home / on mobile hotspot.

## 1. Install dependencies

```powershell
cd "C:\Users\zaher.motairek\Desktop\LFC APK"
npm.cmd install
```

If PowerShell blocks scripts again:

```powershell
npm.cmd install
```

## 2. Environment

Root `.env` should already exist from `.env.example`.

Update at least:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/kop_platform?schema=public"
JWT_ACCESS_SECRET="replace-with-long-random-secret"
JWT_REFRESH_SECRET="replace-with-another-long-random-secret"
SEED_SUPER_ADMIN_EMAIL="admin@olsclebanon.com"
SEED_SUPER_ADMIN_PASSWORD="ChangeMeNow123!"
```

Frontend:

```powershell
copy apps\web\.env.example apps\web\.env
```

## 3. PostgreSQL

Easiest option with Docker:

```powershell
docker compose up -d
```

Default local URL:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kop_platform?schema=public"
```

Or create an empty local database named `kop_platform` manually.

## 4. Build shared package + migrate + seed

```powershell
npm.cmd run build:shared
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
npm.cmd run prisma:seed
```

When migrate asks for a name, use:

```text
init
```

## 5. Start apps

Terminal 1:

```powershell
npm.cmd run dev:api
```

Terminal 2:

```powershell
npm.cmd run dev:web
```

- Web: http://localhost:5173
- API health: http://localhost:3000/api/health

## 6. First login

Use the seeded Super Admin:

- Email: value of `SEED_SUPER_ADMIN_EMAIL`
- Password: value of `SEED_SUPER_ADMIN_PASSWORD`

Then open:

- `/admin/members` to create/import official members
- `/accept-invitation` after inviting a member
- `/app/membership-card` after account activation

## 7. Full verification (Phase 1 to Phase 7)

Member app checks:

- `/app/profile` (edit profile + avatar + gamification stats)
- `/app/matches` and `/app/matches/:id` (prediction flow)
- `/app/leaderboard` (ranking appears)
- `/app/community` (feed loads, event registration works)
- `/app/notifications` (new notification appears after event registration)
- `/app/hall-of-fame` (king + top predictors + recent achievements)

Public app checks:

- `/news` + open one article and submit comment/reaction while logged in
- `/events` + `/events/:id`
- `/gallery`

Admin checks:

- `/admin/members`, `/admin/cms`, `/admin/news`, `/admin/events`, `/admin/matches`
- `GET /api/admin/events/:id/registrations` with admin token

API checks:

- `GET /api/health`
- `GET /api/hall-of-fame`
- `GET /api/community/feed` (authenticated)
- `GET /api/notifications` (authenticated)

## Important membership rules

- Official Member ID is provided by OLSC Lebanon committee only
- Only one ACTIVE membership at a time
- Digital Membership Card is generated after account activation
- QR verification requires `VERIFY_MEMBERSHIP_CARDS`
