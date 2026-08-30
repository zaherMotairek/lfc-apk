-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "User" ALTER COLUMN "firstName" SET DEFAULT '';
ALTER TABLE "User" ALTER COLUMN "lastName" SET DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
