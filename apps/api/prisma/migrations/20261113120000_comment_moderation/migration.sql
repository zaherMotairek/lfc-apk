-- Additive: hide comments without deleting (Phase 3 moderation).
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "isHidden" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Comment_newsArticleId_isHidden_idx" ON "Comment"("newsArticleId", "isHidden");
