-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "liveAwayScore" INTEGER,
ADD COLUMN     "liveHomeScore" INTEGER;

-- CreateTable
CREATE TABLE "MatchGoal" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "minute" INTEGER,
    "scorerName" TEXT,
    "homeScoreAfter" INTEGER NOT NULL,
    "awayScoreAfter" INTEGER NOT NULL,
    "isLiverpoolGoal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchGoal_matchId_createdAt_idx" ON "MatchGoal"("matchId", "createdAt");

-- AddForeignKey
ALTER TABLE "MatchGoal" ADD CONSTRAINT "MatchGoal_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
