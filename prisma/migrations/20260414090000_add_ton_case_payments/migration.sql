-- CreateEnum
CREATE TYPE "CasePaymentStatus" AS ENUM ('PENDING', 'SUBMITTED', 'CONFIRMED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "TonNetwork" AS ENUM ('MAINNET', 'TESTNET');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "tonWalletAddress" TEXT,
ADD COLUMN "tonWalletAddressRaw" TEXT,
ADD COLUMN "tonWalletConnectedAt" TIMESTAMP(3),
ADD COLUMN "tonWalletNetwork" "TonNetwork";

-- The previous CaseOpening table stored only a mock snapshot. The new schema
-- uses normalized relations for verified TON payments, so we recreate it.
DROP TABLE "CaseOpening";

-- CreateTable
CREATE TABLE "GiftType" (
    "id" TEXT NOT NULL,
    "telegramGiftTypeId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT NOT NULL,
    "rarity" "CaseRewardRarity" NOT NULL,
    "estimatedValueTon" INTEGER NOT NULL,
    "valueLabel" TEXT NOT NULL,
    "accent" TEXT NOT NULL,
    "textColor" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseDefinition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "priceTon" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "badgeGradient" TEXT NOT NULL,
    "buttonGradient" TEXT NOT NULL,
    "surfaceTint" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseDrop" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "giftTypeId" TEXT NOT NULL,
    "chance" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseDrop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CasePaymentIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "caseId" TEXT NOT NULL,
    "caseSlug" TEXT NOT NULL,
    "caseName" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "walletAddressRaw" TEXT NOT NULL,
    "recipientAddress" TEXT NOT NULL,
    "recipientAddressRaw" TEXT NOT NULL,
    "amountTon" INTEGER NOT NULL,
    "amountNano" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "CasePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "submittedBoc" TEXT,
    "transactionHash" TEXT,
    "transactionLt" TEXT,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CasePaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseOpening" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "caseId" TEXT NOT NULL,
    "caseDropId" TEXT NOT NULL,
    "giftTypeId" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseOpening_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_tonWalletAddress_key" ON "User"("tonWalletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_tonWalletAddressRaw_key" ON "User"("tonWalletAddressRaw");

-- CreateIndex
CREATE UNIQUE INDEX "CaseDefinition_slug_key" ON "CaseDefinition"("slug");

-- CreateIndex
CREATE INDEX "CaseDefinition_slug_idx" ON "CaseDefinition"("slug");

-- CreateIndex
CREATE INDEX "CaseDefinition_isActive_sortOrder_idx" ON "CaseDefinition"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "CaseDrop_caseId_sortOrder_idx" ON "CaseDrop"("caseId", "sortOrder");

-- CreateIndex
CREATE INDEX "CaseDrop_giftTypeId_idx" ON "CaseDrop"("giftTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "CaseDrop_caseId_giftTypeId_key" ON "CaseDrop"("caseId", "giftTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "CasePaymentIntent_reference_key" ON "CasePaymentIntent"("reference");

-- CreateIndex
CREATE INDEX "CasePaymentIntent_userId_idx" ON "CasePaymentIntent"("userId");

-- CreateIndex
CREATE INDEX "CasePaymentIntent_caseId_idx" ON "CasePaymentIntent"("caseId");

-- CreateIndex
CREATE INDEX "CasePaymentIntent_status_validUntil_idx" ON "CasePaymentIntent"("status", "validUntil");

-- CreateIndex
CREATE INDEX "CasePaymentIntent_walletAddressRaw_idx" ON "CasePaymentIntent"("walletAddressRaw");

-- CreateIndex
CREATE UNIQUE INDEX "CaseOpening_paymentIntentId_key" ON "CaseOpening"("paymentIntentId");

-- CreateIndex
CREATE INDEX "CaseOpening_caseId_idx" ON "CaseOpening"("caseId");

-- CreateIndex
CREATE INDEX "CaseOpening_caseDropId_idx" ON "CaseOpening"("caseDropId");

-- CreateIndex
CREATE INDEX "CaseOpening_giftTypeId_idx" ON "CaseOpening"("giftTypeId");

-- CreateIndex
CREATE INDEX "CaseOpening_userId_idx" ON "CaseOpening"("userId");

-- CreateIndex
CREATE INDEX "CaseOpening_createdAt_idx" ON "CaseOpening"("createdAt");

-- AddForeignKey
ALTER TABLE "CaseDrop" ADD CONSTRAINT "CaseDrop_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseDrop" ADD CONSTRAINT "CaseDrop_giftTypeId_fkey" FOREIGN KEY ("giftTypeId") REFERENCES "GiftType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasePaymentIntent" ADD CONSTRAINT "CasePaymentIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasePaymentIntent" ADD CONSTRAINT "CasePaymentIntent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseOpening" ADD CONSTRAINT "CaseOpening_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseOpening" ADD CONSTRAINT "CaseOpening_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseOpening" ADD CONSTRAINT "CaseOpening_caseDropId_fkey" FOREIGN KEY ("caseDropId") REFERENCES "CaseDrop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseOpening" ADD CONSTRAINT "CaseOpening_giftTypeId_fkey" FOREIGN KEY ("giftTypeId") REFERENCES "GiftType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseOpening" ADD CONSTRAINT "CaseOpening_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "CasePaymentIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
