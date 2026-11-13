import { ConfigService } from '@nestjs/config';
import {
  AchievementType,
  CmsPageCode,
  CmsSectionType,
  PermissionCode,
  Prisma,
  PrismaClient,
  RoleCode,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ROLE_PERMISSION_MAP } from '@kop/shared';

const prisma = new PrismaClient();
const configService = new ConfigService();

const ROLE_DEFINITIONS: Array<{ code: RoleCode; name: string; description: string }> = [
  {
    code: RoleCode.MEMBER,
    name: 'Member',
    description: 'Approved OLSC Lebanon platform member',
  },
  {
    code: RoleCode.CONTENT_MANAGER,
    name: 'Content Manager',
    description: 'Manages website content, news and gallery',
  },
  {
    code: RoleCode.GAME_MANAGER,
    name: 'Game Manager',
    description: 'Manages matches, predictions and scoring',
  },
  {
    code: RoleCode.EVENT_MANAGER,
    name: 'Event Manager',
    description: 'Manages events and membership card verification',
  },
  {
    code: RoleCode.COMMITTEE_ADMIN,
    name: 'Committee Admin',
    description: 'Committee-level platform administration',
  },
  {
    code: RoleCode.SUPER_ADMIN,
    name: 'Super Admin',
    description: 'Full platform access',
  },
  {
    code: RoleCode.LFC_OBSERVER,
    name: 'LFC Observer',
    description: 'Read-only observer access for LFC OLSC Team',
  },
];

const PERMISSION_DEFINITIONS: Array<{
  code: PermissionCode;
  name: string;
  description: string;
}> = [
  {
    code: PermissionCode.MANAGE_USERS,
    name: 'Manage Users',
    description: 'Create and manage platform users',
  },
  {
    code: PermissionCode.MANAGE_MEMBERSHIPS,
    name: 'Manage Memberships',
    description: 'Create, import and manage official memberships',
  },
  {
    code: PermissionCode.MANAGE_ROLES,
    name: 'Manage Roles',
    description: 'Assign roles and permissions',
  },
  {
    code: PermissionCode.MANAGE_CONTENT,
    name: 'Manage Content',
    description: 'Manage CMS pages and sections',
  },
  {
    code: PermissionCode.MANAGE_NEWS,
    name: 'Manage News',
    description: 'Create and publish news articles',
  },
  {
    code: PermissionCode.MANAGE_EVENTS,
    name: 'Manage Events',
    description: 'Create and manage community events',
  },
  {
    code: PermissionCode.MANAGE_MATCHES,
    name: 'Manage Matches',
    description: 'Create and update Liverpool matches',
  },
  {
    code: PermissionCode.MANAGE_PREDICTIONS,
    name: 'Manage Predictions',
    description: 'Manage prediction settings and participation',
  },
  {
    code: PermissionCode.MANAGE_SCORING,
    name: 'Manage Scoring',
    description: 'Update scoring rules and calculate results',
  },
  {
    code: PermissionCode.VIEW_ANALYTICS,
    name: 'View Analytics',
    description: 'View community analytics dashboard',
  },
  {
    code: PermissionCode.MANAGE_SETTINGS,
    name: 'Manage Settings',
    description: 'Manage system settings and audit access',
  },
  {
    code: PermissionCode.VERIFY_MEMBERSHIP_CARDS,
    name: 'Verify Membership Cards',
    description: 'Scan and verify digital membership cards',
  },
];

const CMS_PAGES: Array<{
  code: CmsPageCode;
  title: string;
  slug: string;
  heroTitle: string;
  heroSubtitle: string;
}> = [
  {
    code: CmsPageCode.HOME,
    title: 'Home',
    slug: '/',
    heroTitle: 'Welcome to OLSC Lebanon',
    heroSubtitle: 'The official digital home of Liverpool supporters in Lebanon',
  },
  {
    code: CmsPageCode.ABOUT,
    title: 'About',
    slug: '/about',
    heroTitle: 'We Are OLSC Lebanon',
    heroSubtitle:
      'The official home of Liverpool FC supporters in Lebanon — where the Kop spirit lives, from Beirut to every corner of the country.',
  },
  {
    code: CmsPageCode.COMMITTEE,
    title: 'Committee',
    slug: '/committee',
    heroTitle: 'Committee',
    heroSubtitle: 'Meet the people who lead OLSC Lebanon',
  },
  {
    code: CmsPageCode.EVENTS,
    title: 'Events',
    slug: '/events',
    heroTitle: 'Events',
    heroSubtitle: 'Watch parties, gatherings and community actions',
  },
  {
    code: CmsPageCode.GALLERY,
    title: 'Gallery',
    slug: '/gallery',
    heroTitle: 'Gallery',
    heroSubtitle: 'Memories from our OLSC Lebanon community',
  },
  {
    code: CmsPageCode.MEMBERSHIP,
    title: 'Membership',
    slug: '/membership',
    heroTitle: 'Membership',
    heroSubtitle:
      'Official OLSC Lebanon membership — with a digital card for active members and upload support for existing physical cards.',
  },
  {
    code: CmsPageCode.CONTACT,
    title: 'Contact',
    slug: '/contact',
    heroTitle: 'Contact',
    heroSubtitle: 'Get in touch with OLSC Lebanon',
  },
  {
    code: CmsPageCode.NEWS,
    title: 'News',
    slug: '/news',
    heroTitle: 'Club Announcements',
    heroSubtitle: 'Official OLSC Lebanon news and community updates.',
  },
  {
    code: CmsPageCode.NEWSLETTER,
    title: 'Newsletter',
    slug: '/newsletter',
    heroTitle: 'Newsletter',
    heroSubtitle: 'Read every OLSC Lebanon issue in your browser. Click an issue to open the PDF.',
  },
];

async function seedRolesAndPermissions() {
  for (const permission of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        name: permission.name,
        description: permission.description,
      },
      create: permission,
    });
  }

  for (const role of ROLE_DEFINITIONS) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
      },
      create: role,
    });
  }

  for (const role of ROLE_DEFINITIONS) {
    const dbRole = await prisma.role.findUniqueOrThrow({ where: { code: role.code } });
    const permissionCodes = ROLE_PERMISSION_MAP[role.code as keyof typeof ROLE_PERMISSION_MAP];

    for (const permissionCode of permissionCodes) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { code: permissionCode },
      });

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: dbRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: dbRole.id,
          permissionId: permission.id,
        },
      });
    }
  }
}

async function seedSuperAdmin() {
  const email = (
    configService.get<string>('SEED_SUPER_ADMIN_EMAIL') ?? 'admin@olsclebanon.com'
  ).toLowerCase();
  const password =
    configService.get<string>('SEED_SUPER_ADMIN_PASSWORD') ?? 'ChangeMeNow123!';
  const firstName = configService.get<string>('SEED_SUPER_ADMIN_FIRST_NAME') ?? 'OLSC';
  const lastName = configService.get<string>('SEED_SUPER_ADMIN_LAST_NAME') ?? 'Admin';

  const passwordHash = await bcrypt.hash(password, 12);
  const superAdminRole = await prisma.role.findUniqueOrThrow({
    where: { code: RoleCode.SUPER_ADMIN },
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      firstName,
      lastName,
      passwordHash,
      platformAccountStatus: 'ACTIVE',
      username: 'admin',
    },
    create: {
      email,
      username: 'admin',
      firstName,
      lastName,
      passwordHash,
      platformAccountStatus: 'ACTIVE',
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: superAdminRole.id,
    },
  });

  return { id: user.id, email, password };
}

async function seedCmsPages() {
  for (const page of CMS_PAGES) {
    const cmsPage = await prisma.cmsPage.upsert({
      where: { code: page.code },
      update: {
        title: page.title,
        slug: page.slug,
        isPublished: true,
      },
      create: {
        code: page.code,
        title: page.title,
        slug: page.slug,
        isPublished: true,
      },
    });

    const existingHero = await prisma.cmsSection.findFirst({
      where: {
        pageId: cmsPage.id,
        type: CmsSectionType.HERO,
      },
    });

    if (!existingHero) {
      await prisma.cmsSection.create({
        data: {
          pageId: cmsPage.id,
          type: CmsSectionType.HERO,
          title: page.heroTitle,
          subtitle: page.heroSubtitle,
          sortOrder: 1,
          isEnabled: true,
          content: {
            primaryButtonLabel:
              page.code === CmsPageCode.MEMBERSHIP
                ? 'Contact Committee'
                : page.code === CmsPageCode.ABOUT
                  ? 'Join the Kop'
                  : 'Become a member',
          },
        },
      });
    } else if (page.code === CmsPageCode.MEMBERSHIP) {
      await prisma.cmsSection.update({
        where: { id: existingHero.id },
        data: {
          title: page.heroTitle,
          subtitle: page.heroSubtitle,
          content: {
            primaryButtonLabel: 'Contact Committee',
          },
        },
      });
    } else if (page.code === CmsPageCode.ABOUT) {
      await prisma.cmsSection.update({
        where: { id: existingHero.id },
        data: {
          title: page.heroTitle,
          subtitle: page.heroSubtitle,
          content: {
            primaryButtonLabel: 'Join the Kop',
          },
        },
      });
    }

    if (page.code === CmsPageCode.ABOUT) {
      const aboutBody =
        'OLSC Lebanon was built for one reason: to bring Liverpool supporters across Lebanon together under one official banner.\n\nWe are not just fans who watch a game on a screen. We are a community that shows up — for every kick-off, every last-minute winner, every European night, and every moment that makes this club the greatest in the world.\n\nWhether you joined years ago with an official membership card in your wallet, or you are discovering the Kop for the first time, you belong here. Our committee organizes watch parties, community events, and member experiences that carry the same energy you would feel walking up Anfield Road.\n\nRedLeb Hub is our digital home — Match Hub predictions, your official membership card, community feed, and the leaderboard built on prediction points each season.\n\nThis is Liverpool FC in Lebanon. This is us. This is OLSC Lebanon.';

      const existingAboutRichText = await prisma.cmsSection.findFirst({
        where: {
          pageId: cmsPage.id,
          type: CmsSectionType.RICH_TEXT,
        },
      });

      if (!existingAboutRichText) {
        await prisma.cmsSection.create({
          data: {
            pageId: cmsPage.id,
            type: CmsSectionType.RICH_TEXT,
            title: 'Our story',
            sortOrder: 2,
            isEnabled: true,
            content: {
              body: aboutBody,
              storyEyebrow: 'Our story',
              storyHeading: 'More than a club. A family in Lebanon.',
            },
          },
        });
      } else {
        await prisma.cmsSection.update({
          where: { id: existingAboutRichText.id },
          data: {
            title: 'Our story',
            content: {
              body: aboutBody,
              storyEyebrow: 'Our story',
              storyHeading: 'More than a club. A family in Lebanon.',
            },
          },
        });
      }

      const aboutCtaBlocks: Array<{
        block: string;
        sortOrder: number;
        content: Record<string, unknown>;
      }> = [
        {
          block: 'highlights',
          sortOrder: 3,
          content: {
            block: 'highlights',
            items: [
              { value: 'Official', label: 'OLSC branch' },
              { value: 'Lebanon', label: 'Nationwide community' },
              { value: 'Kop', label: 'Digital member platform' },
              { value: 'YNWA', label: 'Forever united' },
            ],
          },
        },
        {
          block: 'quote',
          sortOrder: 4,
          content: {
            block: 'quote',
            icon: '🎵',
            quote: 'When you walk through a storm, hold your head up high…',
            quoteBody:
              "You'll Never Walk Alone echoes in every OLSC Lebanon watch party — a promise we keep to each other, season after season.",
            quoteFooter: "You'll Never Walk Alone",
          },
        },
        {
          block: 'pillars',
          sortOrder: 5,
          content: {
            block: 'pillars',
            eyebrow: 'What we stand for',
            heading: 'The Kop values — Lebanese edition',
            items: [
              {
                icon: '🔴',
                title: 'Official & proud',
                description:
                  'OLSC Lebanon is the official Liverpool Supporters Club branch in Lebanon — representing the Reds with passion, respect, and the highest LFC / OLSC standards.',
              },
              {
                icon: '🤝',
                title: 'One family, YNWA',
                description:
                  'From Beirut to Tripoli, from watch parties to community events — we stand together through every high and every heartbreak. You’ll Never Walk Alone is not a slogan here. It’s who we are.',
              },
              {
                icon: '⚽',
                title: 'Matchday is sacred',
                description:
                  'Every Liverpool match is a shared experience. Predictions, live goal alerts, leaderboard battles, and the roar of the Kop — even thousands of miles from Anfield.',
              },
              {
                icon: '🇱🇧',
                title: 'Lebanon in our DNA',
                description:
                  'We are Lebanese. We are Liverpool. Two identities, one spirit — building a supporters community that is proud of where we come from and who we support.',
              },
            ],
          },
        },
        {
          block: 'platform',
          sortOrder: 6,
          content: {
            block: 'platform',
            eyebrow: 'RedLeb Hub',
            title: 'Your digital Kop identity',
            body: 'Official members get access to Match Hub predictions, digital membership cards, community events, and the season leaderboard — the full supporters club experience, built for OLSC Lebanon.',
            features: [
              '⚽ Match Hub & season predictions',
              '🏆 Leaderboard by prediction points',
              '🎫 Official digital membership card',
              '📣 Community feed & watch party events',
            ],
          },
        },
        {
          block: 'footer',
          sortOrder: 7,
          content: {
            block: 'footer',
            title: 'Ready to walk with us?',
            body: "Whether you've supported Liverpool for decades or you're just starting your journey — OLSC Lebanon is your home. Official membership is managed by our committee.",
          },
        },
      ];

      for (const ctaBlock of aboutCtaBlocks) {
        const existing = await prisma.cmsSection.findFirst({
          where: {
            pageId: cmsPage.id,
            type: CmsSectionType.CTA,
            content: {
              path: ['block'],
              equals: ctaBlock.block,
            },
          },
        });

        if (!existing) {
          await prisma.cmsSection.create({
            data: {
              pageId: cmsPage.id,
              type: CmsSectionType.CTA,
              sortOrder: ctaBlock.sortOrder,
              isEnabled: true,
              content: ctaBlock.content as Prisma.InputJsonValue,
            },
          });
        } else {
          await prisma.cmsSection.update({
            where: { id: existing.id },
            data: {
              sortOrder: ctaBlock.sortOrder,
              content: ctaBlock.content as Prisma.InputJsonValue,
            },
          });
        }
      }
    }

    if (page.code === CmsPageCode.MEMBERSHIP) {
      const existingRichText = await prisma.cmsSection.findFirst({
        where: {
          pageId: cmsPage.id,
          type: CmsSectionType.RICH_TEXT,
        },
      });

      if (!existingRichText) {
        await prisma.cmsSection.create({
          data: {
            pageId: cmsPage.id,
            type: CmsSectionType.RICH_TEXT,
            title: 'Committee notes',
            sortOrder: 2,
            isEnabled: true,
            content: {
              body:
                'Official membership remains managed by the OLSC Lebanon committee. RedLeb Hub provides digital tools for members who already hold official membership.\n\nIf you received a physical card in previous seasons, sign in and upload a clear photo from the Digital Membership Card page. The committee can use it for faster verification at events alongside your QR code.',
            },
          },
        });
      }

      const membershipCtaBlocks: Array<{
        block: string;
        sortOrder: number;
        content: Record<string, unknown>;
      }> = [
        {
          block: 'twoPaths',
          sortOrder: 3,
          content: {
            block: 'twoPaths',
            eyebrow: 'Two paths',
            heading: 'New members & existing card holders',
            intro:
              'Whether you are joining for the first time or you already have a printed OLSC card, RedLeb Hub supports both journeys.',
            newTitle: 'New to the platform',
            newBody:
              'Request membership information or activate your account after committee approval.',
            existingTitle: 'Already have a card',
            existingBody:
              'Many members already received a physical OLSC card. Log in and upload a photo — we link it to your digital profile.',
          },
        },
        {
          block: 'steps',
          sortOrder: 4,
          content: {
            block: 'steps',
            eyebrow: 'How it works',
            heading: 'From committee to RedLeb Hub',
            items: [
              {
                icon: '📋',
                title: 'Official membership',
                description:
                  'OLSC Lebanon membership is managed by the committee. The platform does not replace official club membership.',
              },
              {
                icon: '✉️',
                title: 'Invitation & activation',
                description:
                  'Existing members receive an email invitation, then activate their account and set a password.',
              },
              {
                icon: '🎫',
                title: 'Digital card + upload',
                description:
                  'After activation, your digital card is generated automatically. Already have a physical card? Upload a photo in the member app.',
              },
              {
                icon: '⚽',
                title: 'Join the Kop',
                description:
                  'Access Match Hub predictions, community feed, events, and your official digital identity.',
              },
            ],
          },
        },
        {
          block: 'footer',
          sortOrder: 5,
          content: {
            block: 'footer',
            title: 'Ready for your digital card?',
            body: 'Log in, open your membership card, and upload a scan of your existing OLSC card in one minute.',
          },
        },
        {
          block: 'applyPage',
          sortOrder: 6,
          content: {
            block: 'applyPage',
            badge: '2026/27 Season',
            title: 'OLSC Lebanon Branch Membership',
            subtitle:
              'Official Liverpool Supporters Club — Lebanon. Memberships valid until 30 June 2027.',
            formTitle: 'Membership application',
            formIntro: 'Complete this form, then transfer the fee via Whish Money or OMT Pay.',
            fullTitle: 'Full Membership — $25',
            fullBody:
              'Scarf, Anfield ticket access, UCL away tickets (subject to availability), plus all Light benefits.',
            lightTitle: 'Light Membership — $10',
            lightBody:
              'Membership card, branch certificate, competitions eligibility, and voting rights.',
            paymentAgreement:
              'I agree to settle the package amount through money transfer (Whish Money or OMT Pay) and understand that my package will not be activated before payment has been made.',
            successTitle: 'Application received',
            successBody:
              'Thank you for applying for OLSC Lebanon membership 2026/27. Your application will only be considered active once payment has been completed and confirmed by the committee.',
            successNote:
              "We'll be in touch to arrange collection of your membership package.",
          },
        },
        {
          block: 'applyPayment',
          sortOrder: 7,
          content: {
            block: 'applyPayment',
            payTitle: 'How to pay',
            payIntro: 'Transfer via Whish Money or OMT Pay to:',
            payName: 'Mohammad Abdallah',
            payPhone: '+961 3 000 000',
            payExtra: 'UK bank account details available upon request.',
            notesTitle: 'Important notes',
            notesBody:
              'Applications close on 31 August 2026.\nAll members — including previous ones — must re-apply for 2026/27.\nMembership is active only after payment confirmation.',
          },
        },
      ];

      for (const ctaBlock of membershipCtaBlocks) {
        const existing = await prisma.cmsSection.findFirst({
          where: {
            pageId: cmsPage.id,
            type: CmsSectionType.CTA,
            content: {
              path: ['block'],
              equals: ctaBlock.block,
            },
          },
        });

        if (!existing) {
          await prisma.cmsSection.create({
            data: {
              pageId: cmsPage.id,
              type: CmsSectionType.CTA,
              sortOrder: ctaBlock.sortOrder,
              isEnabled: true,
              content: ctaBlock.content as Prisma.InputJsonValue,
            },
          });
        } else {
          await prisma.cmsSection.update({
            where: { id: existing.id },
            data: {
              sortOrder: ctaBlock.sortOrder,
              content: ctaBlock.content as Prisma.InputJsonValue,
            },
          });
        }
      }
    }

    if (page.code === CmsPageCode.COMMITTEE) {
      const committeeContent = {
        intro:
          'OLSC Lebanon is led by a volunteer committee of dedicated Liverpool supporters. They organize watch parties, manage official membership, and build the community that makes the Kop spirit alive in Lebanon.',
        members: [
          {
            name: 'Ahmad Khalil',
            role: 'President',
            initials: 'AK',
            bio: 'Leads OLSC Lebanon with a focus on official LFC / OLSC standards, community growth, and nationwide supporter engagement.',
            email: 'president@olsclebanon.com',
          },
          {
            name: 'Sara Mansour',
            role: 'Vice President',
            initials: 'SM',
            bio: 'Supports committee operations, member relations, and partnerships with local venues for matchday experiences.',
            email: 'vicepresident@olsclebanon.com',
          },
          {
            name: 'Karim Haddad',
            role: 'Secretary',
            initials: 'KH',
            bio: 'Handles communications, meeting coordination, and official correspondence with members and partners.',
            email: 'secretary@olsclebanon.com',
          },
          {
            name: 'Nour El-Ali',
            role: 'Events Lead',
            initials: 'NE',
            bio: 'Plans watch parties, gatherings, and community events across Lebanon — bringing the Kop together on matchday.',
            email: 'events@olsclebanon.com',
          },
          {
            name: 'Omar Fares',
            role: 'Membership Lead',
            initials: 'OF',
            bio: 'Manages official membership enquiries, card verification, and onboarding for new OLSC Lebanon members.',
            email: 'membership@olsclebanon.com',
          },
          {
            name: 'Layla Gemayel',
            role: 'Digital & RedLeb Hub',
            initials: 'LG',
            bio: 'Oversees RedLeb Hub — Match Hub, digital cards, community feed, and member digital experience.',
            email: 'digital@olsclebanon.com',
          },
        ],
      };

      const existingCommitteeList = await prisma.cmsSection.findFirst({
        where: { pageId: cmsPage.id, type: CmsSectionType.COMMITTEE_LIST },
      });

      if (!existingCommitteeList) {
        await prisma.cmsSection.create({
          data: {
            pageId: cmsPage.id,
            type: CmsSectionType.COMMITTEE_LIST,
            sortOrder: 2,
            isEnabled: true,
            content: committeeContent,
          },
        });
      } else {
        await prisma.cmsSection.update({
          where: { id: existingCommitteeList.id },
          data: { content: committeeContent },
        });
      }
    }

    if (page.code === CmsPageCode.CONTACT) {
      const contactIntro =
        'Have a question about membership, events, or RedLeb Hub? The OLSC Lebanon committee is here to help. Reach out through any channel below — we aim to respond within a few business days.';

      const existingContactRichText = await prisma.cmsSection.findFirst({
        where: { pageId: cmsPage.id, type: CmsSectionType.RICH_TEXT },
      });

      if (!existingContactRichText) {
        await prisma.cmsSection.create({
          data: {
            pageId: cmsPage.id,
            type: CmsSectionType.RICH_TEXT,
            sortOrder: 2,
            isEnabled: true,
            content: { body: contactIntro },
          },
        });
      } else {
        await prisma.cmsSection.update({
          where: { id: existingContactRichText.id },
          data: { content: { body: contactIntro } },
        });
      }

      const contactChannels = {
        block: 'channels',
        items: [
          {
            icon: '✉️',
            label: 'Email',
            value: 'info@olsclebanon.com',
            href: 'mailto:info@olsclebanon.com',
          },
          {
            icon: '📱',
            label: 'WhatsApp',
            value: '+961 3 000 000',
            href: 'https://wa.me/9613000000',
          },
          {
            icon: '📸',
            label: 'Instagram',
            value: '@olsclebanon',
            href: 'https://instagram.com/olsclebanon',
          },
          {
            icon: '📍',
            label: 'Based in',
            value: 'Beirut, Lebanon',
          },
        ],
      };

      const existingContactChannels = await prisma.cmsSection.findFirst({
        where: {
          pageId: cmsPage.id,
          type: CmsSectionType.CTA,
          content: { path: ['block'], equals: 'channels' },
        },
      });

      if (!existingContactChannels) {
        await prisma.cmsSection.create({
          data: {
            pageId: cmsPage.id,
            type: CmsSectionType.CTA,
            sortOrder: 3,
            isEnabled: true,
            content: contactChannels,
          },
        });
      } else {
        await prisma.cmsSection.update({
          where: { id: existingContactChannels.id },
          data: { content: contactChannels },
        });
      }
    }
  }
}

async function seedScoringRule() {
  const defaults = {
    correctWinnerPoints: 1,
    correctFinalScorePoints: 3,
    correctFirstScorerPoints: 1,
    correctManOfTheMatchPoints: 0,
    correctCleanSheetPoints: 1,
    correctBothTeamsToScorePoints: 0,
    streakBonusEnabled: false,
    streakBonusPoints: 0,
    isActive: true,
  };

  const activeRule = await prisma.scoringRule.findFirst({
    where: { isActive: true },
  });

  if (!activeRule) {
    await prisma.scoringRule.create({ data: defaults });
    return;
  }

  if (activeRule.correctFinalScorePoints !== defaults.correctFinalScorePoints) {
    await prisma.scoringRule.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
    await prisma.scoringRule.create({ data: defaults });
  }
}

async function seedGamificationDefinitions() {
  const levelDefinitions = [
    { level: 1, title: 'Rookie Red', minXp: 0 },
    { level: 2, title: 'Kop Contender', minXp: 100 },
    { level: 3, title: 'Anfield Analyst', minXp: 250 },
    { level: 4, title: 'Matchday Maestro', minXp: 500 },
    { level: 5, title: 'Kop Legend', minXp: 900 },
  ];

  for (const level of levelDefinitions) {
    await prisma.levelDefinition.upsert({
      where: { level: level.level },
      update: {
        title: level.title,
        minXp: level.minXp,
      },
      create: level,
    });
  }

  const achievements = [
    {
      code: AchievementType.KING_OF_THE_KOP,
      name: 'King of the Kop',
      description: 'Hold rank #1 on the overall leaderboard.',
      icon: 'crown',
    },
    {
      code: AchievementType.PREDICTION_MASTER,
      name: 'Prediction Master',
      description: 'Submit at least 10 Liverpool match predictions.',
      icon: 'target',
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievementDefinition.upsert({
      where: { code: achievement.code },
      update: {
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
      },
      create: achievement,
    });
  }
}

const E2E_SITE_SETTINGS: Array<{ key: string; value: string; description: string }> = [
  {
    key: 'payment.payPhone',
    value: '+961 3 000 000',
    description: 'Whish/OMT payment phone on the membership apply page.',
  },
  {
    key: 'payment.payName',
    value: 'OLSC Lebanon Treasurer',
    description: 'Payment recipient name on the membership apply page.',
  },
  {
    key: 'contact.phonePlaceholder',
    value: 'e.g. 70 000 000 or +961 70 000 000',
    description: 'Placeholder for phone fields on public forms.',
  },
  {
    key: 'contact.whatsappDisplay',
    value: '+961 3 000 000',
    description: 'WhatsApp number on the contact page.',
  },
  { key: 'brand.siteName', value: 'RedLeb Hub', description: 'Public site name.' },
  { key: 'brand.shortName', value: 'RedLeb', description: 'PWA short name.' },
  { key: 'brand.tagline', value: 'OLSC Lebanon', description: 'Tagline under logo.' },
  { key: 'brand.themeColor', value: '#c8102e', description: 'Theme colour.' },
  { key: 'brand.red', value: '#c8102e', description: 'Brand red.' },
  { key: 'brand.version', value: '1', description: 'Brand asset version.' },
];

async function seedSiteSettings() {
  for (const row of E2E_SITE_SETTINGS) {
    await prisma.siteSetting.upsert({
      where: { key: row.key },
      create: {
        key: row.key,
        value: row.value,
        description: row.description,
      },
      update: {
        description: row.description,
      },
    });
  }
}

async function seedE2eFixtures(adminUserId: string) {
  const memberRole = await prisma.role.findUniqueOrThrow({ where: { code: RoleCode.MEMBER } });
  const passwordHash = await bcrypt.hash('E2eMember123!', 12);
  const member = await prisma.user.upsert({
    where: { email: 'e2e.member@example.local' },
    update: {
      username: 'e2e.member',
      passwordHash,
      platformAccountStatus: 'ACTIVE',
      firstName: 'E2E',
      lastName: 'Member',
    },
    create: {
      email: 'e2e.member@example.local',
      username: 'e2e.member',
      passwordHash,
      platformAccountStatus: 'ACTIVE',
      firstName: 'E2E',
      lastName: 'Member',
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: member.id, roleId: memberRole.id } },
    update: {},
    create: { userId: member.id, roleId: memberRole.id },
  });

  await prisma.membership.upsert({
    where: { officialMemberId: 'E2E-001' },
    update: { status: 'ACTIVE', userId: member.id },
    create: {
      userId: member.id,
      officialMemberId: 'E2E-001',
      seasonLabel: '2026/27',
      status: 'ACTIVE',
      source: 'MANUAL',
      createdById: adminUserId,
      activatedAt: new Date(),
    },
  });

  const inTwoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const existingEvent = await prisma.event.findFirst({
    where: { title: 'E2E Demo Watch Party' },
  });
  if (!existingEvent) {
    await prisma.event.create({
      data: {
        title: 'E2E Demo Watch Party',
        description: 'Demo event for local Playwright smoke tests.',
        location: 'Beirut',
        startDateTime: inTwoWeeks,
        registrationOpen: true,
        createdById: adminUserId,
      },
    });
  }

  const existingNews = await prisma.newsArticle.findUnique({
    where: { slug: 'e2e-demo-news' },
  });
  if (!existingNews) {
    await prisma.newsArticle.create({
      data: {
        title: 'E2E Demo News',
        slug: 'e2e-demo-news',
        excerpt: 'Demo article for Playwright.',
        content: 'This article exists for local end-to-end smoke tests only.',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        authorId: adminUserId,
      },
    });
  }

  console.log('E2E fixtures: member e2e.member / E2eMember123!');
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    const pwd = configService.get<string>('SEED_SUPER_ADMIN_PASSWORD') ?? '';
    if (pwd === 'ChangeMeNow123!' || pwd.length < 16) {
      throw new Error('Refusing to seed production with default or weak SEED_SUPER_ADMIN_PASSWORD');
    }
  }

  console.log('Seeding RedLeb Hub database...');
  await seedRolesAndPermissions();
  const admin = await seedSuperAdmin();
  await seedSiteSettings();
  await seedCmsPages();
  await seedScoringRule();
  await seedGamificationDefinitions();
  if (process.env.SEED_E2E_FIXTURES === 'true') {
    await seedE2eFixtures(admin.id);
  }
  console.log('Seed completed.');
  console.log(`Super admin email: ${admin.email}`);
  console.log('Super admin password: (from SEED_SUPER_ADMIN_PASSWORD)');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
