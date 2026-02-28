-- One user (ccUserId) can have multiple MT5 traders; user can switch which account to view.
CREATE TABLE IF NOT EXISTS user_trader_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ccUserId" TEXT NOT NULL,
  "mt5TraderId" TEXT NOT NULL,
  "displayLabel" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("ccUserId", "mt5TraderId")
);
CREATE INDEX IF NOT EXISTS user_trader_links_ccUserId_idx ON user_trader_links("ccUserId");
CREATE INDEX IF NOT EXISTS user_trader_links_mt5TraderId_idx ON user_trader_links("mt5TraderId");
