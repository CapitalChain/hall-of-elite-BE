-- Create table to store Capital Chain tokens and bypass tokens
CREATE TABLE IF NOT EXISTS auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ccUserId" TEXT NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  "bypassToken" TEXT UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS auth_tokens_ccUserId_idx ON auth_tokens("ccUserId");
CREATE INDEX IF NOT EXISTS auth_tokens_email_idx ON auth_tokens(email);
