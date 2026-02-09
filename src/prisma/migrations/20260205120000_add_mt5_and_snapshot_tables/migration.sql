-- CreateTable mt5_traders
CREATE TABLE "mt5_traders" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mt5_traders_pkey" PRIMARY KEY ("id")
);

-- CreateTable mt5_trading_accounts
CREATE TABLE "mt5_trading_accounts" (
    "id" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "leverage" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mt5_trading_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable mt5_trades
CREATE TABLE "mt5_trades" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "profitLoss" DOUBLE PRECISION NOT NULL,
    "fees" DOUBLE PRECISION NOT NULL,
    "openTime" TIMESTAMP(3) NOT NULL,
    "closeTime" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mt5_trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable mt5_trader_metrics
CREATE TABLE "mt5_trader_metrics" (
    "id" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "profitFactor" DOUBLE PRECISION NOT NULL,
    "winRate" DOUBLE PRECISION NOT NULL,
    "drawdown" DOUBLE PRECISION NOT NULL,
    "totalTradingDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mt5_trader_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable mt5_trader_scores
CREATE TABLE "mt5_trader_scores" (
    "id" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "consistencyScore" DOUBLE PRECISION NOT NULL,
    "tier" TEXT,
    "rank" INTEGER,
    "eligible" BOOLEAN NOT NULL DEFAULT false,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mt5_trader_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable snapshot_runs
CREATE TABLE "snapshot_runs" (
    "id" TEXT NOT NULL,
    "runKey" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedAt" TIMESTAMP(3),

    CONSTRAINT "snapshot_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable trader_snapshots
CREATE TABLE "trader_snapshots" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "externalTraderId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "tier" TEXT NOT NULL,
    "badges" JSONB NOT NULL,
    "metrics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trader_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mt5_traders_externalId_key" ON "mt5_traders"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "mt5_trading_accounts_externalId_key" ON "mt5_trading_accounts"("externalId");

-- CreateIndex
CREATE INDEX "mt5_trading_accounts_traderId_idx" ON "mt5_trading_accounts"("traderId");

-- CreateIndex
CREATE UNIQUE INDEX "mt5_trades_externalId_key" ON "mt5_trades"("externalId");

-- CreateIndex
CREATE INDEX "mt5_trades_accountId_idx" ON "mt5_trades"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "mt5_trader_metrics_traderId_key" ON "mt5_trader_metrics"("traderId");

-- CreateIndex
CREATE INDEX "mt5_trader_metrics_traderId_idx" ON "mt5_trader_metrics"("traderId");

-- CreateIndex
CREATE UNIQUE INDEX "mt5_trader_scores_traderId_key" ON "mt5_trader_scores"("traderId");

-- CreateIndex
CREATE INDEX "mt5_trader_scores_traderId_idx" ON "mt5_trader_scores"("traderId");

-- CreateIndex
CREATE INDEX "mt5_trader_scores_rank_idx" ON "mt5_trader_scores"("rank");

-- CreateIndex
CREATE UNIQUE INDEX "snapshot_runs_runKey_key" ON "snapshot_runs"("runKey");

-- CreateIndex
CREATE UNIQUE INDEX "trader_snapshots_snapshotId_traderId_key" ON "trader_snapshots"("snapshotId", "traderId");

-- CreateIndex
CREATE INDEX "trader_snapshots_snapshotId_idx" ON "trader_snapshots"("snapshotId");

-- CreateIndex
CREATE INDEX "trader_snapshots_tier_rank_idx" ON "trader_snapshots"("tier", "rank");

-- AddForeignKey
ALTER TABLE "mt5_trading_accounts" ADD CONSTRAINT "mt5_trading_accounts_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "mt5_traders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mt5_trades" ADD CONSTRAINT "mt5_trades_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "mt5_trading_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mt5_trader_metrics" ADD CONSTRAINT "mt5_trader_metrics_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "mt5_traders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mt5_trader_scores" ADD CONSTRAINT "mt5_trader_scores_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "mt5_traders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trader_snapshots" ADD CONSTRAINT "trader_snapshots_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "snapshot_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
