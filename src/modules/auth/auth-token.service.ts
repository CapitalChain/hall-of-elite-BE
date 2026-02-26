import crypto from "crypto";
import { prisma } from "../../prisma/client";
import { env } from "../../config/env";
import { AppError } from "../../middlewares/errorHandler";

/** Validate token with Capital Chain and return user info */
async function validateCapitalChainToken(
  token: string
): Promise<{ id: string; email: string } | null> {
  const base = (env.AUTH_API_URL ?? "").trim().replace(/\/+$/, "");
  if (!base) return null;
  const clean = token.trim().replace(/^(Token|Bearer)\s+/i, "");
  const url = `${base}/authentication/user/`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${clean}`,
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    const id = String(data.pk ?? data.id ?? "");
    const email = String(data.email ?? "");
    if (!email) return null;
    return { id, email };
  } catch {
    return null;
  }
}

function generateBypassToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

/**
 * Validate token with Capital Chain, store it in DB, and return a bypass token.
 * Call this after the user has logged in via Capital Chain (send their token in Authorization).
 */
export async function storeTokenAndGetBypass(authHeader: string): Promise<{ bypassToken: string }> {
  const raw = authHeader?.replace(/^(Token|Bearer)\s+/i, "").trim();
  if (!raw) throw new AppError("Authorization token required", 401);

  const ccUser = await validateCapitalChainToken(raw);
  if (!ccUser) throw new AppError("Invalid token: could not validate with Capital Chain", 401);

  const bypassToken = generateBypassToken();

  const existing = await prisma.storedAuthToken.findFirst({
    where: { ccUserId: ccUser.id },
  });

  if (existing) {
    await prisma.storedAuthToken.update({
      where: { id: existing.id },
      data: { token: raw, bypassToken, email: ccUser.email, updatedAt: new Date() },
    });
  } else {
    await prisma.storedAuthToken.create({
      data: {
        ccUserId: ccUser.id,
        email: ccUser.email,
        token: raw,
        bypassToken,
      },
    });
  }

  return { bypassToken };
}

/**
 * Return stored Capital Chain token for a valid bypass token (for URL login).
 */
export async function getTokenByBypass(
  bypassToken: string
): Promise<{ token: string; email: string } | null> {
  const trimmed = bypassToken?.trim();
  if (!trimmed) return null;
  const row = await prisma.storedAuthToken.findUnique({
    where: { bypassToken: trimmed },
    select: { token: true, email: true },
  });
  return row ? { token: row.token, email: row.email } : null;
}
