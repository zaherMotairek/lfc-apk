import { WinnerPrediction } from '@prisma/client';
import { calculatePredictionPoints } from './match-scoring.utils';

const defaultRule = {
  correctWinnerPoints: 1,
  correctFinalScorePoints: 3,
  correctFirstScorerPoints: 1,
  correctCleanSheetPoints: 1,
};

describe('calculatePredictionPoints (characterization)', () => {
  const liverpoolHome = {
    homeTeamName: 'Liverpool',
    awayTeamName: 'Chelsea',
    winningOutcome: WinnerPrediction.HOME_WIN,
    finalHomeScore: 2,
    finalAwayScore: 1,
    firstLiverpoolScorer: 'Salah',
    cleanSheetResult: false,
  };

  it('awards winner points with Liverpool multiplier', () => {
    const result = calculatePredictionPoints(
      liverpoolHome,
      {
        winnerPrediction: WinnerPrediction.HOME_WIN,
        predictedHomeScore: 0,
        predictedAwayScore: 0,
        firstLiverpoolGoalscorer: null,
        cleanSheetPrediction: null,
      },
      defaultRule,
    );
    expect(result.winnerPoints).toBe(2);
    expect(result.totalPoints).toBe(2);
  });

  it('awards exact score on Liverpool fixture with multiplier on winner/score only', () => {
    const result = calculatePredictionPoints(
      liverpoolHome,
      {
        winnerPrediction: WinnerPrediction.HOME_WIN,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
        firstLiverpoolGoalscorer: 'salah',
        cleanSheetPrediction: false,
      },
      defaultRule,
    );
    expect(result.winnerPoints).toBe(2);
    expect(result.scorePoints).toBe(6);
    expect(result.scorerPoints).toBe(1);
    expect(result.bonusPoints).toBe(1);
    expect(result.totalPoints).toBe(10);
  });

  it('does not apply Liverpool scorer bonus on non-Liverpool fixtures', () => {
    const result = calculatePredictionPoints(
      {
        homeTeamName: 'Arsenal',
        awayTeamName: 'Chelsea',
        winningOutcome: WinnerPrediction.DRAW,
        finalHomeScore: 1,
        finalAwayScore: 1,
        firstLiverpoolScorer: null,
        cleanSheetResult: null,
      },
      {
        winnerPrediction: WinnerPrediction.DRAW,
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        firstLiverpoolGoalscorer: 'Salah',
        cleanSheetPrediction: null,
      },
      defaultRule,
    );
    expect(result.winnerPoints).toBe(1);
    expect(result.scorePoints).toBe(3);
    expect(result.scorerPoints).toBe(0);
    expect(result.totalPoints).toBe(4);
  });
});
