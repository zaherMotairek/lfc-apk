#!/usr/bin/env node
/**
 * Demo-only data for committee presentation screenshots (fictional PII).
 * Run: node scripts/assert-local-db.mjs && npx prisma generate (if needed)
 *      SEED_E2E_FIXTURES=true npm run prisma:seed -w @kop/api
 *      node scripts/seed-committee-demo.mjs
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient, MatchStatus, MembershipApplicationStatus, MembershipPackageType } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

spawnSync('node', [path.join(root, 'scripts/assert-local-db.mjs')], {
  stdio: 'inherit',
  cwd: root,
});

const prisma = new PrismaClient();

const DEMO = {
  eventTitle: 'Committee Demo Watch Party',
  matchOpponent: 'Nottingham Forest (Demo)',
  albumTitle: 'Demo Kop Photos 2026',
  applications: [
    {
      fullName: 'Alex Demo Fan',
      email: 'alex.demo@example.local',
      phoneNumber: '+961 7000 0001',
      address: 'Demo Street 1, Beirut (fictional)',
    },
    {
      fullName: 'Sam Demo Supporter',
      email: 'sam.demo@example.local',
      phoneNumber: '+961 7000 0002',
      address: 'Demo Avenue 2, Tripoli (fictional)',
    },
  ],
};

async function main() {
  const admin = await prisma.user.findFirst({
    where: { username: 'admin' },
    select: { id: true },
  });
  if (!admin) {
    throw new Error('Admin user not found — run prisma seed first.');
  }

  const member = await prisma.user.findFirst({
    where: { username: 'e2e.member' },
    select: { id: true },
  });
  if (!member) {
    throw new Error('e2e.member not found — run SEED_E2E_FIXTURES=true prisma seed.');
  }

  await prisma.user.update({
    where: { id: member.id },
    data: {
      firstName: 'Jamie',
      lastName: 'Demo',
      olscId: 'OLSC-DEMO-042',
      lfcId: 'ALLRED-9042',
      phoneNumber: '+961 7111 1111',
      lastSeenAt: new Date(),
      lastLoginAt: new Date(),
    },
  });

  const inTenDays = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  const closesAt = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);

  let event = await prisma.event.findFirst({ where: { title: DEMO.eventTitle } });
  if (event) {
    event = await prisma.event.update({
      where: { id: event.id },
      data: {
        description:
          'Fictional demo event for the committee presentation. Sign up with optional guests (+1 or +2).',
        location: 'Demo venue, Beirut',
        startDateTime: inTenDays,
        capacity: 40,
        registrationOpen: true,
      },
    });
  } else {
    event = await prisma.event.create({
      data: {
        title: DEMO.eventTitle,
        description:
          'Fictional demo event for the committee presentation. Sign up with optional guests (+1 or +2).',
        location: 'Demo venue, Beirut',
        startDateTime: inTenDays,
        capacity: 40,
        registrationOpen: true,
        createdById: admin.id,
      },
    });
  }

  await prisma.eventRegistration.deleteMany({ where: { eventId: event.id, userId: member.id } });

  let match = await prisma.match.findFirst({ where: { opponent: DEMO.matchOpponent } });
  if (match) {
    match = await prisma.match.update({
      where: { id: match.id },
      data: {
        awayTeamName: 'Nottingham Forest',
        competition: 'Premier League (demo)',
        stadium: 'Anfield',
        matchDate: inTenDays,
        status: MatchStatus.UPCOMING,
        predictionClosesAt: closesAt,
        predictionOpensAt: new Date(),
      },
    });
  } else {
    match = await prisma.match.create({
      data: {
        opponent: DEMO.matchOpponent,
        awayTeamName: 'Nottingham Forest',
        competition: 'Premier League (demo)',
        stadium: 'Anfield',
        matchDate: inTenDays,
        status: MatchStatus.UPCOMING,
        predictionClosesAt: closesAt,
        predictionOpensAt: new Date(),
        createdById: admin.id,
      },
    });
  }

  let album = await prisma.mediaAlbum.findFirst({ where: { title: DEMO.albumTitle } });
  if (!album) {
    album = await prisma.mediaAlbum.create({
      data: {
        title: DEMO.albumTitle,
        description: 'Placeholder album — fictional demo images only.',
        coverImageUrl: 'https://picsum.photos/seed/redleb-demo-cover/800/600',
        createdById: admin.id,
      },
    });
    const seeds = ['redleb-a', 'redleb-b', 'redleb-c'];
    for (const seed of seeds) {
      await prisma.mediaAsset.create({
        data: {
          albumId: album.id,
          type: 'IMAGE',
          url: `https://picsum.photos/seed/${seed}/800/600`,
          title: `Demo photo ${seed}`,
        },
      });
    }
  }

  for (const row of DEMO.applications) {
    const existing = await prisma.membershipApplication.findFirst({
      where: { email: row.email },
    });
    if (!existing) {
      await prisma.membershipApplication.create({
        data: {
          seasonLabel: '2026/27',
          fullName: row.fullName,
          email: row.email,
          address: row.address,
          phoneNumber: row.phoneNumber,
          packageType: MembershipPackageType.FULL,
          isOfficialLfcMember: true,
          lfcId: 'ALLRED-DEMO',
          paymentAgreed: true,
          status: MembershipApplicationStatus.PENDING,
        },
      });
    }
  }

  const issueSlug = 'demo-newsletter-november-2026';
  await prisma.newsletterIssue.upsert({
    where: { slug: issueSlug },
    update: {
      title: 'Demo Monthly Kop — November 2026',
      issueNumber: 1,
      monthLabel: 'November 2026',
      excerpt: 'Fictional newsletter issue for committee preview.',
      pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      isPublished: true,
      publishedAt: new Date(),
      createdById: admin.id,
    },
    create: {
      title: 'Demo Monthly Kop — November 2026',
      slug: issueSlug,
      issueNumber: 1,
      monthLabel: 'November 2026',
      excerpt: 'Fictional newsletter issue for committee preview.',
      pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      isPublished: true,
      publishedAt: new Date(),
      createdById: admin.id,
    },
  });

  await prisma.newsArticle.upsert({
    where: { slug: 'e2e-demo-news' },
    update: {
      title: 'Demo: Reds bounce back at Anfield',
      excerpt: 'Fictional match report for the committee PDF.',
      content:
        '<p>This is demo content only. No real match results or people are shown.</p><p>YNWA — OLSC Lebanon.</p>',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    create: {
      title: 'Demo: Reds bounce back at Anfield',
      slug: 'e2e-demo-news',
      excerpt: 'Fictional match report for the committee PDF.',
      content:
        '<p>This is demo content only. No real match results or people are shown.</p><p>YNWA — OLSC Lebanon.</p>',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      authorId: admin.id,
    },
  });

  const legacyUsers = await prisma.user.findMany({
    where: {
      email: { not: { endsWith: '@example.local' } },
      username: { notIn: ['admin', 'e2e.member'] },
    },
    select: { id: true, email: true },
  });
  let n = 1;
  for (const u of legacyUsers) {
    await prisma.user.update({
      where: { id: u.id },
      data: {
        firstName: 'Demo',
        lastName: `User ${n}`,
        email: `demo.user${n}@example.local`,
        phoneNumber: `+961 7000 ${String(1000 + n).padStart(4, '0')}`,
      },
    });
    n += 1;
  }

  console.log('[seed-committee-demo] OK');
  console.log(`  Event id: ${event.id}`);
  console.log(`  Match id: ${match.id}`);
  console.log(`  Gallery album id: ${album.id}`);
  if (legacyUsers.length) {
    console.log(`  Anonymised ${legacyUsers.length} legacy local users → *@example.local`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());