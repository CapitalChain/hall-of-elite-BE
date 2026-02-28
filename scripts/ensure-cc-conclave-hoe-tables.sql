-- Run on cc-conclave DB so Hall of Elite can store auth and links.
-- Usage: psql "$DATABASE_URL" -f scripts/ensure-cc-conclave-hoe-tables.sql

-- auth_tokens: Capital Chain token + optional MT5 login for dashboard
CREATE TABLE IF NOT EXISTS auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ccUserId" TEXT NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  "bypassToken" TEXT UNIQUE,
  "mt5TraderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS auth_tokens_ccUserId_idx ON auth_tokens("ccUserId");
CREATE INDEX IF NOT EXISTS auth_tokens_email_idx ON auth_tokens(email);
-- Add column if table existed from an older migration without it
ALTER TABLE auth_tokens ADD COLUMN IF NOT EXISTS "mt5TraderId" TEXT;
CREATE INDEX IF NOT EXISTS auth_tokens_mt5TraderId_idx ON auth_tokens("mt5TraderId");

-- user_trader_links: one CC user → many MT5 logins (multi-account)
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
