-- Drop Prisma/app tables we no longer need (keep Conclave/MT5 tables only).
-- Run with: psql $DATABASE_URL -f scripts/drop-prisma-tables.sql
-- Order: children first, then parents; CASCADE removes dependent objects.

BEGIN;

-- App/Prisma tables (drop in dependency order)
DROP TABLE IF EXISTS "RewardEntitlement" CASCADE;
DROP TABLE IF EXISTS "Reward" CASCADE;
DROP TABLE IF EXISTS "Trade" CASCADE;
DROP TABLE IF EXISTS "TraderMetrics" CASCADE;
DROP TABLE IF EXISTS "TraderScore" CASCADE;
DROP TABLE IF EXISTS "TradingAccount" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Tier" CASCADE;
DROP TABLE IF EXISTS trader_snapshots CASCADE;
DROP TABLE IF EXISTS snapshot_runs CASCADE;
DROP TABLE IF EXISTS trader_payouts CASCADE;
DROP TABLE IF EXISTS payout_tiers CASCADE;
DROP TABLE IF EXISTS _prisma_migrations CASCADE;

COMMIT;
