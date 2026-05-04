-- CreateEnum
CREATE TYPE "GiftPurchaseStatus" AS ENUM (
  'QUEUED',
  'SEARCHING',
  'OFFER_FOUND',
  'PURCHASE_PENDING',
  'PURCHASED',
  'DELIVERY_PENDING',
  'DELIVERED',
  'FAILED',
  'CANCELLED'
);

-- CreateTable
CREATE TABLE "GiftPurchaseRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "openingId" TEXT NOT NULL,
  "giftTypeId" TEXT NOT NULL,
  "status" "GiftPurchaseStatus" NOT NULL DEFAULT 'QUEUED',
  "providerKey" TEXT,
  "providerLabel" TEXT,
  "searchQuery" TEXT NOT NULL,
  "externalListingId" TEXT,
  "externalListingUrl" TEXT,
  "externalOrderId" TEXT,
  "quotedPriceTon" INTEGER,
  "purchasedPriceTon" INTEGER,
  "deliveryTelegramGiftId" TEXT,
  "failureReason" TEXT,
  "adminNote" TEXT,
  "metadata" JSONB,
  "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "searchStartedAt" TIMESTAMP(3),
  "offerFoundAt" TIMESTAMP(3),
  "purchasedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GiftPurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GiftPurchaseRequest_openingId_key" ON "GiftPurchaseRequest"("openingId");

-- CreateIndex
CREATE INDEX "GiftPurchaseRequest_userId_queuedAt_idx" ON "GiftPurchaseRequest"("userId", "queuedAt");

-- CreateIndex
CREATE INDEX "GiftPurchaseRequest_status_queuedAt_idx" ON "GiftPurchaseRequest"("status", "queuedAt");

-- CreateIndex
CREATE INDEX "GiftPurchaseRequest_giftTypeId_status_idx" ON "GiftPurchaseRequest"("giftTypeId", "status");

-- AddForeignKey
ALTER TABLE "GiftPurchaseRequest"
ADD CONSTRAINT "GiftPurchaseRequest_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftPurchaseRequest"
ADD CONSTRAINT "GiftPurchaseRequest_openingId_fkey"
FOREIGN KEY ("openingId") REFERENCES "CaseOpening"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftPurchaseRequest"
ADD CONSTRAINT "GiftPurchaseRequest_giftTypeId_fkey"
FOREIGN KEY ("giftTypeId") REFERENCES "GiftType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
