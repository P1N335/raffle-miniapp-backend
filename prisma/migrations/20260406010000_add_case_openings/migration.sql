-- CreateEnum
CREATE TYPE "CaseRewardRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateTable
CREATE TABLE "CaseOpening" (
    "id" TEXT NOT NULL,
    "caseSlug" TEXT NOT NULL,
    "caseName" TEXT NOT NULL,
    "priceTon" INTEGER NOT NULL,
    "rewardId" TEXT NOT NULL,
    "rewardName" TEXT NOT NULL,
    "rewardImage" TEXT NOT NULL,
    "rewardRarity" "CaseRewardRarity" NOT NULL,
    "rewardChance" INTEGER NOT NULL,
    "rewardValueLabel" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseOpening_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CaseOpening_caseSlug_idx" ON "CaseOpening"("caseSlug");

-- CreateIndex
CREATE INDEX "CaseOpening_userId_idx" ON "CaseOpening"("userId");

-- CreateIndex
CREATE INDEX "CaseOpening_createdAt_idx" ON "CaseOpening"("createdAt");

-- AddForeignKey
ALTER TABLE "CaseOpening" ADD CONSTRAINT "CaseOpening_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
