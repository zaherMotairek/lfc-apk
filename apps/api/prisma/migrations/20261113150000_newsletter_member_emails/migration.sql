-- Phase 6: track member email blast for newsletter issues.
ALTER TABLE "NewsletterIssue" ADD COLUMN IF NOT EXISTS "memberEmailsSentAt" TIMESTAMP(3);
