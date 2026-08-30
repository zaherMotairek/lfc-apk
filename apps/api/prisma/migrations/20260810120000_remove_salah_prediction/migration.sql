-- AlterTable
ALTER TABLE "Match" DROP COLUMN IF EXISTS "salahToScoreResult";

-- AlterTable
ALTER TABLE "ScoringRule" DROP COLUMN IF EXISTS "correctSalahToScorePoints";

-- AlterTable
ALTER TABLE "Prediction" DROP COLUMN IF EXISTS "salahToScorePrediction";
