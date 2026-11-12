# Message to paste into Cursor at home

Copy everything below this line into Cursor when you open the project at home:

---

Continue Kop Platform setup on this machine.

Context:
- Phases 1 to 7 source code are already created.
- At work, npm install failed because corporate network blocks registry.npmjs.org (ETIMEDOUT).
- Architecture and MVP are already approved.
- Membership model is: official OLSC membership is external. Platform does NOT replace official membership. Admin creates/imports existing members, invites them, and Digital Membership Card is generated only after account activation.
- officialMemberId is provided by committee only.
- Only one ACTIVE membership at a time.
- QR verification requires VERIFY_MEMBERSHIP_CARDS permission.
- Phase 2: forgot/reset password, profile, avatar upload.
- Phase 3: public CMS pages, news, events, gallery.
- Phase 4: enriched admin dashboard and admin content/match tools.
- Phase 5: Match Hub, predictions, scoring engine, leaderboards.
- Phase 6: gamification foundations (XP, coins, levels, winning streaks, achievements, King of the Kop).
- Phase 7: community feed, event registration, news comments/reactions, in-app notifications, hall of fame.
- Respect LFC/OLSC guidelines: no scraped LFC content, no copyrighted player/stadium images without permission.

Please do this now step by step:

1. Run `npm.cmd install` and confirm `node_modules` exists.
2. Ensure `.env` exists from `.env.example`.
3. Start PostgreSQL:
   - Prefer `docker compose up -d`
   - Or use local PostgreSQL with database `kop_platform`
4. Build shared package: `npm.cmd run build:shared`
5. Run: `npm.cmd run prisma:generate`
6. Run: `npm.cmd run prisma:migrate` (migration name: `init`)
7. Run: `npm.cmd run prisma:seed`
8. Start API: `npm.cmd run dev:api`
9. Start Web: `npm.cmd run dev:web`
10. Verify end-to-end:
    - http://localhost:3000/api/health
    - http://localhost:5173
    - Login with seeded Super Admin from `.env`
    - Create member in `/admin/members` and activate via invitation
    - Confirm membership card in `/app/membership-card`
    - Edit profile + avatar in `/app/profile`
    - Publish news + create event
    - Create a Liverpool match in `/admin/matches`
    - Submit prediction in `/app/matches/:id` (Match Hub)
    - Enter match result + calculate scores in `/admin/matches`
    - Check `/app/leaderboard`
    - Check gamification stats and achievements in `/app/profile`
    - Check `/admin` dashboard stats
    - Check `/app/community` (feed + event registration)
    - Check `/app/notifications` (event registration notifications)
    - Open a published news article and post a comment + reaction
    - Check `/app/hall-of-fame`
    - As admin, check `/admin/events/:id/registrations` API endpoint

If anything fails, fix it and continue.
Do not redesign architecture.
After everything works, summarize status by phase (Phase 1 to Phase 7) and list any remaining blockers.

---
