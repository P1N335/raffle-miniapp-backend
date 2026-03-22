-- CreateEnum
CREATE TYPE "RaffleStatus" AS ENUM ('BETTING', 'SPINNING', 'FINISHED');

-- CreateTable
CREATE TABLE "RaffleRound" (
    "id" TEXT NOT NULL,
    "status" "RaffleStatus" NOT NULL DEFAULT 'BETTING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bettingEndsAt" TIMESTAMP(3) NOT NULL,
    "spinningEndsAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "totalPool" INTEGER NOT NULL DEFAULT 0,
    "winnerUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RaffleRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaffleEntry" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RaffleEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RaffleRound_status_idx" ON "RaffleRound"("status");

-- CreateIndex
CREATE INDEX "RaffleEntry_roundId_idx" ON "RaffleEntry"("roundId");

-- CreateIndex
CREATE INDEX "RaffleEntry_userId_idx" ON "RaffleEntry"("userId");

-- AddForeignKey
ALTER TABLE "RaffleRound" ADD CONSTRAINT "RaffleRound_winnerUserId_fkey" FOREIGN KEY ("winnerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleEntry" ADD CONSTRAINT "RaffleEntry_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "RaffleRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleEntry" ADD CONSTRAINT "RaffleEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
