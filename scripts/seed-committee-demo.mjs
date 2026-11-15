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
import bcrypt from 'bcrypt';
import {
  PrismaClient,
  MatchStatus,
  MembershipApplicationStatus,
  MembershipPackageType,
  RegistrationStatus,
  RoleCode,
  NewsStatus,
  WinnerPrediction,
} from '@prisma/client';

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

  const memberRole = await prisma.role.findUniqueOrThrow({ where: { code: RoleCode.MEMBER } });
  const pwdHash = await bcrypt.hash('DemoMember123!', 12);
  for (let i = 1; i <= 24; i += 1) {
    const uname = `demo.member${String(i).padStart(2, '0')}`;
    const email = `${uname}@example.local`;
    const u = await prisma.user.upsert({
      where: { email },
      update: {
        firstName: 'Demo',
        lastName: `Member ${i}`,
        username: uname,
        phoneNumber: `+961 7100 ${String(2000 + i).padStart(4, '0')}`,
        olscId: `OLSC-DEMO-${String(i).padStart(3, '0')}`,
        lfcId: `ALLRED-${9000 + i}`,
        lastSeenAt: new Date(Date.now() - i * 3600_000),
        lastLoginAt: new Date(Date.now() - i * 7200_000),
      },
      create: {
        email,
        username: uname,
        passwordHash: pwdHash,
        firstName: 'Demo',
        lastName: `Member ${i}`,
        phoneNumber: `+961 7100 ${String(2000 + i).padStart(4, '0')}`,
        olscId: `OLSC-DEMO-${String(i).padStart(3, '0')}`,
        lfcId: `ALLRED-${9000 + i}`,
        platformAccountStatus: 'ACTIVE',
        lastSeenAt: new Date(Date.now() - i * 3600_000),
        lastLoginAt: new Date(Date.now() - i * 7200_000),
      },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: u.id, roleId: memberRole.id } },
      update: {},
      create: { userId: u.id, roleId: memberRole.id },
    });
    await prisma.loginEvent.create({ data: { userId: u.id } }).catch(() => {});
  }

  await prisma.loginEvent.createMany({
    data: [{ userId: member.id }, { userId: member.id }],
  }).catch(() => {});

  const appSpecs = [
    { name: 'Casey Demo', email: 'casey.demo@example.local', status: MembershipApplicationStatus.PENDING },
    { name: 'Jordan Demo', email: 'jordan.demo@example.local', status: MembershipApplicationStatus.APPROVED },
    { name: 'Riley Demo', email: 'riley.demo@example.local', status: MembershipApplicationStatus.REJECTED },
    { name: 'Taylor Demo', email: 'taylor.demo@example.local', status: MembershipApplicationStatus.PAYMENT_CONFIRMED },
    { name: 'Morgan Demo', email: 'morgan.demo@example.local', status: MembershipApplicationStatus.PENDING },
    { name: 'Avery Demo', email: 'avery.demo@example.local', status: MembershipApplicationStatus.APPROVED },
  ];
  for (const row of appSpecs) {
    const ex = await prisma.membershipApplication.findFirst({ where: { email: row.email } });
    if (ex) {
      await prisma.membershipApplication.update({
        where: { id: ex.id },
        data: { status: row.status, fullName: row.name },
      });
    } else {
      await prisma.membershipApplication.create({
        data: {
          seasonLabel: '2026/27',
          fullName: row.name,
          email: row.email,
          address: 'Fictional address, Lebanon',
          phoneNumber: '+961 7000 0099',
          packageType: MembershipPackageType.FULL,
          isOfficialLfcMember: false,
          paymentAgreed: true,
          status: row.status,
        },
      });
    }
  }

  const fullEvent = await prisma.event.create({
    data: {
      title: 'Demo Kop Social — Full house',
      description: 'Fictional event at capacity to show the waitlist in the app.',
      location: 'Demo Hall',
      startDateTime: new Date(Date.now() + 5 * 86400_000),
      capacity: 2,
      registrationOpen: true,
      createdById: admin.id,
    },
  });
  const demoUsers = await prisma.user.findMany({
    where: { email: { endsWith: '@example.local' }, username: { startsWith: 'demo.member' } },
    take: 3,
    select: { id: true },
  });
  for (let i = 0; i < demoUsers.length; i += 1) {
    await prisma.eventRegistration.upsert({
      where: { userId_eventId: { userId: demoUsers[i].id, eventId: fullEvent.id } },
      update: {
        status: i < 2 ? RegistrationStatus.REGISTERED : RegistrationStatus.WAITLISTED,
        guestCount: i === 0 ? 1 : 0,
      },
      create: {
        userId: demoUsers[i].id,
        eventId: fullEvent.id,
        status: i < 2 ? RegistrationStatus.REGISTERED : RegistrationStatus.WAITLISTED,
        guestCount: i === 0 ? 1 : 0,
        guestNames: i === 0 ? 'Guest Demo' : undefined,
      },
    });
  }

  await prisma.event.create({
    data: {
      title: 'Demo Away Day Viewing',
      description: 'Second demo listing for the events guide.',
      location: 'Tripoli (fictional)',
      startDateTime: new Date(Date.now() + 20 * 86400_000),
      capacity: 30,
      registrationOpen: true,
      createdById: admin.id,
    },
  });

  const newsSlugs = ['demo-kop-win', 'demo-community-night', 'demo-new-season'];
  for (const [idx, slug] of newsSlugs.entries()) {
    const article = await prisma.newsArticle.upsert({
      where: { slug },
      update: {
        title: `Demo story ${idx + 1} — OLSC Lebanon`,
        status: NewsStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      create: {
        slug,
        title: `Demo story ${idx + 1} — OLSC Lebanon`,
        excerpt: 'Fictional news for the committee guide.',
        content: '<p>Demo content only. Comment and react below.</p>',
        status: NewsStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId: admin.id,
      },
    });
    const existingComment = await prisma.comment.findFirst({
      where: { newsArticleId: article.id, userId: member.id },
    });
    if (!existingComment) {
      await prisma.comment.create({
        data: {
          userId: member.id,
          newsArticleId: article.id,
          content: 'Great update — see you at the next watch party! (demo)',
        },
      });
    }
    await prisma.reaction.upsert({
      where: { userId_newsArticleId_type: { userId: member.id, newsArticleId: article.id, type: 'LIKE' } },
      update: {},
      create: { userId: member.id, newsArticleId: article.id, type: 'LIKE' },
    }).catch(() => {});
  }

  const finishedMatch = await prisma.match.create({
    data: {
      opponent: 'Demo United (result)',
      awayTeamName: 'Demo United',
      competition: 'Premier League (demo)',
      stadium: 'Anfield',
      matchDate: new Date(Date.now() - 3 * 86400_000),
      status: MatchStatus.FINISHED,
      predictionClosesAt: new Date(Date.now() - 4 * 86400_000),
      finalHomeScore: 3,
      finalAwayScore: 1,
      winningOutcome: WinnerPrediction.HOME,
      createdById: admin.id,
    },
  });
  await prisma.prediction.create({
    data: {
      userId: member.id,
      matchId: finishedMatch.id,
      predictedHomeScore: 3,
      predictedAwayScore: 1,
      winnerPrediction: WinnerPrediction.HOME,
      totalPoints: 4,
      calculatedAt: new Date(),
    },
  }).catch(() => {});

  await prisma.prediction.create({
    data: {
      userId: member.id,
      matchId: match.id,
      predictedHomeScore: 2,
      predictedAwayScore: 0,
      winnerPrediction: WinnerPrediction.HOME,
    },
  }).catch(() => {});

  const album2 = await prisma.mediaAlbum.create({
    data: {
      title: 'Demo Matchday Gallery 2026',
      description: 'Second fictional album with neutral placeholder photos.',
      coverImageUrl: 'https://picsum.photos/seed/redleb-gallery2/800/600',
      createdById: admin.id,
    },
  });
  for (const seed of ['g2-a', 'g2-b', 'g2-c', 'g2-d']) {
    await prisma.mediaAsset.create({
      data: {
        albumId: album2.id,
        type: 'IMAGE',
        url: `https://picsum.photos/seed/${seed}/800/600`,
        title: `Matchday ${seed}`,
      },
    });
  }

  await prisma.notification.createMany({
    data: [
      {
        userId: member.id,
        title: 'New event open',
        message: 'Committee Demo Watch Party is open for sign-up. (demo)',
        type: 'EVENT',
        actionUrl: '/app/community',
      },
      {
        userId: member.id,
        title: 'Match reminder',
        message: 'Predictions close soon for Nottingham Forest (Demo). (demo)',
        type: 'MATCH',
        actionUrl: '/app/matches',
      },
      {
        userId: member.id,
        title: 'Welcome to RedLeb Hub',
        message: 'Your demo member account is ready. YNWA!',
        type: 'SYSTEM',
        isRead: true,
        readAt: new Date(),
      },
    ],
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: 'DEMO_SEED',
      entityType: 'SiteSetting',
      entityId: 'committee-guide',
      metadata: { note: 'Fictional audit row for PDF guide' },
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