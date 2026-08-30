/**
 * Demo data seeder for local preview.
 * Usage: node scripts/seed-demo-data.mjs
 */

const API = process.env.API_URL ?? 'http://localhost:3000/api';
const ADMIN_EMAIL = process.env.SEED_SUPER_ADMIN_EMAIL ?? 'admin@olsclebanon.com';
const ADMIN_PASSWORD = process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'ChangeMeNow123!';
const MEMBER_PASSWORD = 'DemoMember123!';

async function api(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
    throw new Error(`${method} ${path} -> ${message ?? response.status}`);
  }
  return data;
}

function daysFromNow(days, hour = 20) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

const DEMO_MEMBERS = [
  { firstName: 'Zaher', lastName: 'Motairek', email: 'zaher.demo@olsclebanon.com', officialMemberId: 'OLSC-DEM-001' },
  { firstName: 'Mohammad', lastName: 'Haddad', email: 'mohammad.demo@olsclebanon.com', officialMemberId: 'OLSC-DEM-002' },
  { firstName: 'Sara', lastName: 'Nassar', email: 'sara.demo@olsclebanon.com', officialMemberId: 'OLSC-DEM-003' },
  { firstName: 'Karim', lastName: 'Fares', email: 'karim.demo@olsclebanon.com', officialMemberId: 'OLSC-DEM-004' },
  { firstName: 'Nour', lastName: 'Khalil', email: 'nour.demo@olsclebanon.com', officialMemberId: 'OLSC-DEM-005' },
  { firstName: 'Omar', lastName: 'Saad', email: 'omar.demo@olsclebanon.com', officialMemberId: 'OLSC-DEM-006' },
];

const PREDICTION_TEMPLATES = [
  { predictedHomeScore: 2, predictedAwayScore: 1, winnerPrediction: 'HOME_WIN', firstLiverpoolGoalscorer: 'Gakpo', manOfTheMatchPrediction: 'Gakpo', cleanSheetPrediction: false, bothTeamsToScorePrediction: true },
  { predictedHomeScore: 3, predictedAwayScore: 0, winnerPrediction: 'HOME_WIN', firstLiverpoolGoalscorer: 'Gakpo', manOfTheMatchPrediction: 'Van Dijk', cleanSheetPrediction: true, bothTeamsToScorePrediction: false },
  { predictedHomeScore: 1, predictedAwayScore: 1, winnerPrediction: 'DRAW', firstLiverpoolGoalscorer: 'Nunez', manOfTheMatchPrediction: 'Szoboszlai', cleanSheetPrediction: false, bothTeamsToScorePrediction: true },
  { predictedHomeScore: 2, predictedAwayScore: 2, winnerPrediction: 'DRAW', firstLiverpoolGoalscorer: 'Diaz', manOfTheMatchPrediction: 'Alisson', cleanSheetPrediction: false, bothTeamsToScorePrediction: true },
  { predictedHomeScore: 1, predictedAwayScore: 0, winnerPrediction: 'HOME_WIN', firstLiverpoolGoalscorer: 'Diaz', manOfTheMatchPrediction: 'Diaz', cleanSheetPrediction: true, bothTeamsToScorePrediction: false },
  { predictedHomeScore: 0, predictedAwayScore: 1, winnerPrediction: 'AWAY_WIN', firstLiverpoolGoalscorer: 'Szoboszlai', manOfTheMatchPrediction: 'Endo', cleanSheetPrediction: false, bothTeamsToScorePrediction: true },
];

async function main() {
  console.log('Logging in as admin...');
  const login = await api('/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const adminToken = login.accessToken;
  console.log('Admin OK');

  console.log('Creating demo members...');
  const activated = [];
  for (const member of DEMO_MEMBERS) {
    try {
      const created = await api('/admin/members', {
        method: 'POST',
        token: adminToken,
        body: {
          ...member,
          seasonLabel: '2025/26',
          notes: 'Demo member for local preview',
          sendInvitation: true,
        },
      });

      if (!created.invitationToken) {
        console.log(`- ${member.email}: created but no invitation token`);
        continue;
      }

      await api('/auth/accept-invitation', {
        method: 'POST',
        body: {
          token: created.invitationToken,
          password: MEMBER_PASSWORD,
        },
      });

      const memberLogin = await api('/auth/login', {
        method: 'POST',
        body: { email: member.email, password: MEMBER_PASSWORD },
      });

      activated.push({
        ...member,
        token: memberLogin.accessToken,
      });
      console.log(`- ${member.firstName} ${member.lastName}: ACTIVE`);
    } catch (error) {
      console.log(`- ${member.email}: ${error.message}`);
    }
  }

  console.log('Creating news...');
  const newsItems = [
    {
      title: 'Welcome to the Kop Platform',
      slug: 'welcome-kop-platform',
      excerpt: 'OLSC Lebanon digital home is live for members.',
      content:
        'YNWA.\n\nThe Kop Platform is now open for OLSC Lebanon members: Match Hub predictions, digital membership cards, events, and community updates — all in one place.',
      status: 'PUBLISHED',
    },
    {
      title: 'Next watch party announced',
      slug: 'next-watch-party',
      excerpt: 'Join the committee for the next Liverpool match screening.',
      content:
        'Details: venue and kickoff time will be confirmed in the Events section. Arrive early, wear your reds, and bring the Anfield atmosphere to Lebanon.',
      status: 'PUBLISHED',
    },
  ];
  for (const article of newsItems) {
    try {
      await api('/admin/news', { method: 'POST', token: adminToken, body: article });
      console.log(`- News: ${article.title}`);
    } catch (error) {
      console.log(`- News skip (${article.slug}): ${error.message}`);
    }
  }

  console.log('Creating events...');
  const events = [
    {
      title: 'Liverpool Match Screening — Beirut',
      description: 'Official OLSC Lebanon watch party. Screening, food, and community vibes.',
      location: 'Beirut — TBD Venue',
      startDateTime: daysFromNow(5, 19),
      capacity: 40,
    },
    {
      title: 'Members Meetup & Season Kickoff',
      description: 'Meet the committee, collect digital card tips, and prepare for the prediction league.',
      location: 'OLSC Lebanon Hub',
      startDateTime: daysFromNow(12, 18),
      capacity: 25,
    },
  ];
  const createdEventIds = [];
  for (const event of events) {
    try {
      const result = await api('/admin/events', { method: 'POST', token: adminToken, body: event });
      createdEventIds.push(result.eventId);
      console.log(`- Event: ${event.title}`);
    } catch (error) {
      console.log(`- Event skip: ${error.message}`);
    }
  }

  if (createdEventIds[0] && activated[0]) {
    try {
      await api(`/events/${createdEventIds[0]}/register`, {
        method: 'POST',
        token: activated[0].token,
        body: { joinWaitlist: true },
      });
      console.log(`- ${activated[0].firstName} registered to first event`);
    } catch (error) {
      console.log(`- Event register skip: ${error.message}`);
    }
  }

  console.log('Creating matches...');
  const pastKickoff = daysFromNow(-3, 21);
  const pastClose = daysFromNow(-3, 20);
  const upcomingKickoff = daysFromNow(4, 21);
  const upcomingClose = daysFromNow(4, 20);

  let pastMatchId = null;
  let upcomingMatchId = null;

  try {
    const past = await api('/matches', {
      method: 'POST',
      token: adminToken,
      body: {
        opponent: 'Manchester United',
        competition: 'Premier League',
        stadium: 'Anfield',
        matchDate: pastKickoff,
        predictionOpensAt: daysFromNow(-10, 12),
        predictionClosesAt: pastClose,
        homeTeamName: 'Liverpool',
        awayTeamName: 'Manchester United',
      },
    });
    pastMatchId = past.matchId ?? past.id ?? past.match?.id;
    console.log(`- Past match created: ${pastMatchId}`);
  } catch (error) {
    console.log(`- Past match skip: ${error.message}`);
  }

  try {
    const upcoming = await api('/matches', {
      method: 'POST',
      token: adminToken,
      body: {
        opponent: 'Arsenal',
        competition: 'Premier League',
        stadium: 'Emirates Stadium',
        matchDate: upcomingKickoff,
        predictionOpensAt: daysFromNow(-1, 12),
        predictionClosesAt: upcomingClose,
        homeTeamName: 'Arsenal',
        awayTeamName: 'Liverpool',
      },
    });
    upcomingMatchId = upcoming.matchId ?? upcoming.id ?? upcoming.match?.id;
    console.log(`- Upcoming match created: ${upcomingMatchId}`);
  } catch (error) {
    console.log(`- Upcoming match skip: ${error.message}`);
  }

  // Resolve match IDs from list if create response shape differs
  if (!pastMatchId || !upcomingMatchId) {
    const matches = await api('/matches');
    if (!pastMatchId) {
      pastMatchId = matches.find((m) => m.awayTeamName?.includes('Manchester') || m.opponent?.includes('Manchester'))?.id;
    }
    if (!upcomingMatchId) {
      upcomingMatchId = matches.find((m) => m.opponent?.includes('Arsenal') || m.awayTeamName?.includes('Liverpool'))?.id;
    }
  }

  console.log('Submitting predictions...');
  for (let i = 0; i < activated.length; i += 1) {
    const member = activated[i];
    const template = PREDICTION_TEMPLATES[i % PREDICTION_TEMPLATES.length];

    if (upcomingMatchId) {
      try {
        await api('/predictions', {
          method: 'POST',
          token: member.token,
          body: { matchId: upcomingMatchId, ...template },
        });
        console.log(`- ${member.firstName}: upcoming prediction OK`);
      } catch (error) {
        console.log(`- ${member.firstName} upcoming: ${error.message}`);
      }
    }

    if (pastMatchId) {
      try {
        // Past match may already be closed — try anyway for demo history if API allows admin override later
        await api('/predictions', {
          method: 'POST',
          token: member.token,
          body: {
            matchId: pastMatchId,
            ...PREDICTION_TEMPLATES[(i + 2) % PREDICTION_TEMPLATES.length],
          },
        });
        console.log(`- ${member.firstName}: past prediction OK`);
      } catch (error) {
        console.log(`- ${member.firstName} past: ${error.message}`);
      }
    }
  }

  if (pastMatchId) {
    console.log('Setting past match result + scoring...');
    try {
      await api(`/matches/${pastMatchId}/result`, {
        method: 'PUT',
        token: adminToken,
        body: {
          finalHomeScore: 2,
          finalAwayScore: 1,
          winningOutcome: 'HOME_WIN',
          firstLiverpoolScorer: 'Gakpo',
          manOfTheMatch: 'Gakpo',
          cleanSheetResult: false,
          bothTeamsToScoreResult: true,
        },
      });
      await api('/predictions/calculate-score', {
        method: 'POST',
        token: adminToken,
        body: { matchId: pastMatchId },
      });
      console.log('- Scores calculated for past match');
    } catch (error) {
      console.log(`- Scoring skip: ${error.message}`);
    }
  }

  console.log('\n===== DEMO READY =====');
  console.log('Web: http://localhost:5173');
  console.log(`Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`Demo members password: ${MEMBER_PASSWORD}`);
  console.log('Try:');
  console.log('- /login as zaher.demo@olsclebanon.com');
  console.log('- /app/matches , /app/leaderboard , /app/community');
  console.log('- /admin for dashboard');
  console.log('- /news and /events on public site');
}

main().catch((error) => {
  console.error('Demo seed failed:', error.message);
  process.exit(1);
});
