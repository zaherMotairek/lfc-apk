-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "membershipCardImageUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "membershipCardUploadedAt" TIMESTAMP(3);
