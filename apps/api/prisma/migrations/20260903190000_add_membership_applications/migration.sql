-- CreateEnum
CREATE TYPE "MembershipPackageType" AS ENUM ('LIGHT', 'FULL');

-- CreateEnum
CREATE TYPE "MembershipApplicationStatus" AS ENUM ('PENDING', 'PAYMENT_CONFIRMED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "MembershipApplication" (
    "id" TEXT NOT NULL,
    "seasonLabel" TEXT NOT NULL DEFAULT '2026/27',
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "packageType" "MembershipPackageType" NOT NULL,
    "previousOlscId" TEXT,
    "isOfficialLfcMember" BOOLEAN NOT NULL,
    "lfcId" TEXT,
    "paymentAgreed" BOOLEAN NOT NULL DEFAULT true,
    "status" "MembershipApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "assignedOlscId" TEXT,
    "adminNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MembershipApplication_status_createdAt_idx" ON "MembershipApplication"("status", "createdAt");

-- CreateIndex
CREATE INDEX "MembershipApplication_email_idx" ON "MembershipApplication"("email");

-- CreateIndex
CREATE INDEX "MembershipApplication_seasonLabel_idx" ON "MembershipApplication"("seasonLabel");

-- AddForeignKey
ALTER TABLE "MembershipApplication" ADD CONSTRAINT "MembershipApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
