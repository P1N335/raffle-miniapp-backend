-- AlterEnum
ALTER TYPE "CaseOpeningStatus" ADD VALUE IF NOT EXISTS 'IN_COINFLIP';

-- CreateEnum
CREATE TYPE "CoinflipRoomStatus" AS ENUM ('OPEN', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CoinflipSeat" AS ENUM ('CREATOR', 'OPPONENT');

-- CreateTable
CREATE TABLE "CoinflipRoom" (
    "id" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "status" "CoinflipRoomStatus" NOT NULL DEFAULT 'OPEN',
    "creatorUserId" TEXT NOT NULL,
    "opponentUserId" TEXT,
    "winnerUserId" TEXT,
    "creatorTotalTon" INTEGER NOT NULL,
    "opponentTotalTon" INTEGER,
    "creatorReadyAt" TIMESTAMP(3) NOT NULL,
    "opponentReadyAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoinflipRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinflipRoomItem" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "openingId" TEXT NOT NULL,
    "giftTypeId" TEXT NOT NULL,
    "seat" "CoinflipSeat" NOT NULL,
    "estimatedValueTon" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoinflipRoomItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoinflipRoom_roomCode_key" ON "CoinflipRoom"("roomCode");

-- CreateIndex
CREATE INDEX "CoinflipRoom_status_createdAt_idx" ON "CoinflipRoom"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CoinflipRoom_creatorUserId_status_idx" ON "CoinflipRoom"("creatorUserId", "status");

-- CreateIndex
CREATE INDEX "CoinflipRoom_opponentUserId_idx" ON "CoinflipRoom"("opponentUserId");

-- CreateIndex
CREATE INDEX "CoinflipRoom_winnerUserId_idx" ON "CoinflipRoom"("winnerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CoinflipRoomItem_roomId_openingId_key" ON "CoinflipRoomItem"("roomId", "openingId");

-- CreateIndex
CREATE INDEX "CoinflipRoomItem_roomId_seat_idx" ON "CoinflipRoomItem"("roomId", "seat");

-- CreateIndex
CREATE INDEX "CoinflipRoomItem_openingId_idx" ON "CoinflipRoomItem"("openingId");

-- CreateIndex
CREATE INDEX "CoinflipRoomItem_userId_idx" ON "CoinflipRoomItem"("userId");

-- AddForeignKey
ALTER TABLE "CoinflipRoom" ADD CONSTRAINT "CoinflipRoom_creatorUserId_fkey" FOREIGN KEY ("creatorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinflipRoom" ADD CONSTRAINT "CoinflipRoom_opponentUserId_fkey" FOREIGN KEY ("opponentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinflipRoom" ADD CONSTRAINT "CoinflipRoom_winnerUserId_fkey" FOREIGN KEY ("winnerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinflipRoomItem" ADD CONSTRAINT "CoinflipRoomItem_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CoinflipRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinflipRoomItem" ADD CONSTRAINT "CoinflipRoomItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinflipRoomItem" ADD CONSTRAINT "CoinflipRoomItem_openingId_fkey" FOREIGN KEY ("openingId") REFERENCES "CaseOpening"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinflipRoomItem" ADD CONSTRAINT "CoinflipRoomItem_giftTypeId_fkey" FOREIGN KEY ("giftTypeId") REFERENCES "GiftType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
