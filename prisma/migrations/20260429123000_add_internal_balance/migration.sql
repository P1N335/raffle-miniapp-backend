-- CreateEnum
CREATE TYPE "CasePaymentSource" AS ENUM ('TON_WALLET', 'INTERNAL_BALANCE');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "balanceTon" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "CasePaymentIntent"
ADD COLUMN "paymentSource" "CasePaymentSource" NOT NULL DEFAULT 'TON_WALLET';
