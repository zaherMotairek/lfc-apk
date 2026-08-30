/**
 * Completes demo scoring via Prisma (bypasses API throttling).
 * Usage: node --import tsx apps/api/prisma/seed-demo-scores.ts
 * Or from apps/api: npx tsx prisma/seed-demo-scores.ts
 */
import { PrismaClient, WinnerPrediction, MatchStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const emails = [
    'zaher.demo@olsclebanon.com',
    'mohammad.demo@olsclebanon.com',
    'sara.demo@olsclebanon.com',
    'karim.demo@olsclebanon.com',
    'nour.demo@olsclebanon.com',
    'omar.demo@olsclebanon.com',
  ];

  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true, firstName: true },
  });

  const match = await prisma.match.findFirst({
    where: { opponent: 'Chelsea' },
    orderBy: { createdAt: 'desc' },
  });

  if (!match) {
    throw new Error('Chelsea demo match not found');
  }

  const templates = [
    {
      predictedHomeScore: 2,
      predictedAwayScore: 1,
      winnerPrediction: WinnerPrediction.HOME_WIN,
      firstLiverpoolGoalscorer: 'Gakpo',
      manOfTheMatchPrediction: 'Gakpo',
      cleanSheetPrediction: false,
      bothTeamsToScorePrediction: true,
    },
    {
      predictedHomeScore: 3,
      predictedAwayScore: 0,
      winnerPrediction: WinnerPrediction.HOME_WIN,
      firstLiverpoolGoalscorer: 'Gakpo',
      manOfTheMatchPrediction: 'Van Dijk',
      cleanSheetPrediction: true,
      bothTeamsToScorePrediction: false,
    },
    {
      predictedHomeScore: 1,
      predictedAwayScore: 1,
      winnerPrediction: WinnerPrediction.DRAW,
      firstLiverpoolGoalscorer: 'Nunez',
      manOfTheMatchPrediction: 'Szoboszlai',
      cleanSheetPrediction: false,
      bothTeamsToScorePrediction: true,
    },
    {
      predictedHomeScore: 2,
      predictedAwayScore: 0,
      winnerPrediction: WinnerPrediction.HOME_WIN,
      firstLiverpoolGoalscorer: 'Diaz',
      manOfTheMatchPrediction: 'Alisson',
      cleanSheetPrediction: true,
      bothTeamsToScorePrediction: false,
    },
    {
      predictedHomeScore: 1,
      predictedAwayScore: 0,
      winnerPrediction: WinnerPrediction.HOME_WIN,
      firstLiverpoolGoalscorer: 'Diaz',
      manOfTheMatchPrediction: 'Diaz',
      cleanSheetPrediction: true,
      bothTeamsToScorePrediction: false,
    },
    {
      predictedHomeScore: 2,
      predictedAwayScore: 2,
      winnerPrediction: WinnerPrediction.DRAW,
      firstLiverpoolGoalscorer: 'Szoboszlai',
      manOfTheMatchPrediction: 'Endo',
      cleanSheetPrediction: false,
      bothTeamsToScorePrediction: true,
    },
  ];

  // Keep predictions open for upsert
  await prisma.match.update({
    where: { id: match.id },
    data: {
      status: MatchStatus.UPCOMING,
      predictionClosesAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  for (let i = 0; i < users.length; i += 1) {
    const user = users[i];
    const template = templates[i % templates.length];
    await prisma.prediction.upsert({
      where: { userId_matchId: { userId: user.id, matchId: match.id } },
      update: { ...template },
      create: { userId: user.id, matchId: match.id, ...template },
    });
    console.log(`Prediction ready: ${user.firstName}`);
  }

  await prisma.match.update({
    where: { id: match.id },
    data: {
      status: MatchStatus.FINISHED,
      finalHomeScore: 2,
      finalAwayScore: 1,
      winningOutcome: WinnerPrediction.HOME_WIN,
      firstLiverpoolScorer: 'Gakpo',
      manOfTheMatch: 'Gakpo',
      cleanSheetResult: false,
      bothTeamsToScoreResult: true,
    },
  });

  console.log('Match finished. Calculating via API...');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
