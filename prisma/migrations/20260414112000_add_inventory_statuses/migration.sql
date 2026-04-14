-- CreateEnum
CREATE TYPE "CaseOpeningStatus" AS ENUM ('OWNED', 'SOLD', 'WITHDRAW_PENDING', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "CaseOpening"
ADD COLUMN "status" "CaseOpeningStatus" NOT NULL DEFAULT 'OWNED',
ADD COLUMN "soldAmountTon" INTEGER,
ADD COLUMN "soldAt" TIMESTAMP(3),
ADD COLUMN "withdrawalRequestedAt" TIMESTAMP(3),
ADD COLUMN "withdrawnAt" TIMESTAMP(3);
