import crypto from "crypto";
import { prisma } from "../../prisma/client";
import { env } from "../../config/env";
import { AppError } from "../../middlewares/errorHandler";
import { addTraderLink } from "../progress/user-traders.service";

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
 * Optional mt5TraderId = MT5 account ID to link to this Capital Chain user (multi-account: one email → many MT5 IDs).
 */
export async function storeTokenAndGetBypass(
  authHeader: string,
  mt5TraderId?: string | null
): Promise<{ bypassToken: string }> {
  const raw = authHeader?.replace(/^(Token|Bearer)\s+/i, "").trim();
  if (!raw) throw new AppError("Authorization token required", 401);

  const ccUser = await validateCapitalChainToken(raw);
  if (!ccUser) throw new AppError("Invalid token: could not validate with Capital Chain", 401);

  const bypassToken = generateBypassToken();
  const data: { token: string; bypassToken: string; email: string; mt5TraderId?: string } = {
    token: raw,
    bypassToken,
    email: ccUser.email,
  };
  if (mt5TraderId != null && mt5TraderId.trim() !== "") {
    data.mt5TraderId = mt5TraderId.trim();
  }

  const existing = await prisma.storedAuthToken.findFirst({
    where: { ccUserId: ccUser.id },
  });

  if (existing) {
    await prisma.storedAuthToken.update({
      where: { id: existing.id },
      data: { ...data, updatedAt: new Date() },
    });
  } else {
    await prisma.storedAuthToken.create({
      data: {
        ccUserId: ccUser.id,
        ...data,
      },
    });
  }

  if (data.mt5TraderId) {
    try {
      await addTraderLink(ccUser.id, data.mt5TraderId, null);
    } catch (e) {
      if ((e as { statusCode?: number })?.statusCode !== 404) throw e;
    }
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
