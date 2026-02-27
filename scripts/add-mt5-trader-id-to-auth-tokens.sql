-- Add optional MT5 trader link so dashboard can resolve current user to MT5 data
ALTER TABLE auth_tokens ADD COLUMN IF NOT EXISTS "mt5TraderId" TEXT;
CREATE INDEX IF NOT EXISTS auth_tokens_mt5TraderId_idx ON auth_tokens("mt5TraderId");
