-- CreateEnum
CREATE TYPE "EmailOtpPurpose" AS ENUM ('SIGNUP');

-- AlterTable
ALTER TABLE "ScoringRule" ALTER COLUMN "correctWinnerPoints" SET DEFAULT 1,
ALTER COLUMN "correctFinalScorePoints" SET DEFAULT 3,
ALTER COLUMN "correctFirstScorerPoints" SET DEFAULT 1,
ALTER COLUMN "correctManOfTheMatchPoints" SET DEFAULT 0,
ALTER COLUMN "correctCleanSheetPoints" SET DEFAULT 1,
ALTER COLUMN "correctBothTeamsToScorePoints" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lfcId" TEXT,
ADD COLUMN IF NOT EXISTS "olscId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "EmailVerificationCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" "EmailOtpPurpose" NOT NULL DEFAULT 'SIGNUP',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "OfficialMemberRoster" (
    "id" TEXT NOT NULL,
    "olscId" TEXT NOT NULL,
    "lfcId" TEXT,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "rawStatus" TEXT,
    "importBatch" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficialMemberRoster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "NewsletterIssue" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "issueNumber" INTEGER NOT NULL,
    "monthLabel" TEXT NOT NULL,
    "excerpt" TEXT,
    "pdfUrl" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterIssue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmailVerificationCode_email_purpose_createdAt_idx" ON "EmailVerificationCode"("email", "purpose", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "OfficialMemberRoster_olscId_key" ON "OfficialMemberRoster"("olscId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OfficialMemberRoster_lfcId_idx" ON "OfficialMemberRoster"("lfcId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OfficialMemberRoster_phoneNumber_idx" ON "OfficialMemberRoster"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterIssue_slug_key" ON "NewsletterIssue"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NewsletterIssue_isPublished_publishedAt_idx" ON "NewsletterIssue"("isPublished", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_olscId_key" ON "User"("olscId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_lfcId_key" ON "User"("lfcId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_phoneNumber_idx" ON "User"("phoneNumber");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'NewsletterIssue_createdById_fkey'
  ) THEN
    ALTER TABLE "NewsletterIssue"
      ADD CONSTRAINT "NewsletterIssue_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
