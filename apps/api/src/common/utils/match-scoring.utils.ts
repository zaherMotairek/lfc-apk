import { isLiverpoolFixture, PREDICTION_SCORING } from '@kop/shared';

type ScoringRuleLike = {
  correctWinnerPoints: number;
  correctFinalScorePoints: number;
  correctFirstScorerPoints: number;
  correctCleanSheetPoints: number;
};

type MatchLike = {
  homeTeamName: string;
  awayTeamName: string;
  winningOutcome: string | null;
  finalHomeScore: number | null;
  finalAwayScore: number | null;
  firstLiverpoolScorer: string | null;
  cleanSheetResult: boolean | null;
};

type PredictionLike = {
  winnerPrediction: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  firstLiverpoolGoalscorer: string | null;
  cleanSheetPrediction: boolean | null;
};

export function isLiverpoolMatch(match: Pick<MatchLike, 'homeTeamName' | 'awayTeamName'>): boolean {
  return isLiverpoolFixture(match.homeTeamName, match.awayTeamName);
}

export function liverpoolPointsMultiplier(match: Pick<MatchLike, 'homeTeamName' | 'awayTeamName'>): number {
  return isLiverpoolMatch(match) ? PREDICTION_SCORING.liverpoolMultiplier : 1;
}

export function calculatePredictionPoints(
  match: MatchLike,
  prediction: PredictionLike,
  rule: ScoringRuleLike,
) {
  const multiplier = liverpoolPointsMultiplier(match);
  const isLfc = multiplier > 1;

  let winnerPoints = 0;
  let scorePoints = 0;
  let scorerPoints = 0;
  let bonusPoints = 0;

  if (match.winningOutcome && prediction.winnerPrediction === match.winningOutcome) {
    winnerPoints = rule.correctWinnerPoints * multiplier;
  }

  if (
    match.finalHomeScore != null &&
    match.finalAwayScore != null &&
    prediction.predictedHomeScore === match.finalHomeScore &&
    prediction.predictedAwayScore === match.finalAwayScore
  ) {
    scorePoints = rule.correctFinalScorePoints * multiplier;
  }

  if (
    isLfc &&
    prediction.firstLiverpoolGoalscorer &&
    match.firstLiverpoolScorer &&
    prediction.firstLiverpoolGoalscorer.toLowerCase() === match.firstLiverpoolScorer.toLowerCase()
  ) {
    scorerPoints = rule.correctFirstScorerPoints;
  }

  if (
    isLfc &&
    typeof prediction.cleanSheetPrediction === 'boolean' &&
    typeof match.cleanSheetResult === 'boolean' &&
    prediction.cleanSheetPrediction === match.cleanSheetResult
  ) {
    bonusPoints += rule.correctCleanSheetPoints;
  }

  return {
    winnerPoints,
    scorePoints,
    scorerPoints,
    manOfTheMatchPoints: 0,
    bonusPoints,
    totalPoints: winnerPoints + scorePoints + scorerPoints + bonusPoints,
  };
}
