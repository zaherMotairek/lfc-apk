-- Phase 6: draft / scheduled newsletter publish.
ALTER TABLE "NewsletterIssue" ADD COLUMN IF NOT EXISTS "scheduledPublishAt" TIMESTAMP(3);
