-- CreateTable "payout_tiers"
CREATE TABLE "payout_tiers" (
    "id" TEXT NOT NULL,
    "minAverage" DOUBLE PRECISION NOT NULL,
    "maxAverage" DOUBLE PRECISION NOT NULL,
    "payoutPercent" DOUBLE PRECISION NOT NULL,
    "tier" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable "trader_payouts"
CREATE TABLE "trader_payouts" (
    "id" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "payoutTierId" TEXT NOT NULL,
    "payoutPercent" DOUBLE PRECISION NOT NULL,
    "averageTradesPerDay" DOUBLE PRECISION NOT NULL,
    "totalTradingDays" INTEGER NOT NULL,
    "maxTradesPerDay" INTEGER NOT NULL,
    "nextUpdateAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trader_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payout_tiers_minAverage_maxAverage_key" ON "payout_tiers"("minAverage", "maxAverage");

-- CreateIndex
CREATE INDEX "payout_tiers_payoutPercent_idx" ON "payout_tiers"("payoutPercent");

-- CreateIndex
CREATE UNIQUE INDEX "trader_payouts_traderId_key" ON "trader_payouts"("traderId");

-- CreateIndex
CREATE INDEX "trader_payouts_traderId_idx" ON "trader_payouts"("traderId");

-- CreateIndex
CREATE INDEX "trader_payouts_payoutPercent_idx" ON "trader_payouts"("payoutPercent");

-- AddForeignKey
ALTER TABLE "trader_payouts" ADD CONSTRAINT "trader_payouts_payoutTierId_fkey" FOREIGN KEY ("payoutTierId") REFERENCES "payout_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
