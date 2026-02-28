import { prisma } from "../../prisma/client";
import { AppError } from "../../middlewares/errorHandler";
import {
  getConclaveAccountNameByLogin,
  conclaveAccountExists,
  getConclaveAccountsByEmail,
  isConclaveAvailable,
} from "./conclave.datasource";

/**
 * Multi-account: one Capital Chain account (email) can have multiple MT5 account IDs (logins).
 * Data lives in cc-conclave (accounts, deals, cashflows). user_trader_links stores login as mt5TraderId.
 */

export interface LinkedTraderDto {
  /** MT5 account login (number as string). */
  traderId: string;
  displayName: string;
  displayLabel: string | null;
  isPrimary: boolean;
}

/**
 * List all MT5 accounts (logins) linked to this Capital Chain user.
 * When no links exist, returns Conclave accounts matching userEmail (accounts.email) so dashboard can show data without manual link.
 * Returns [] if user_trader_links table is missing or any query fails (avoids 500).
 */
export async function getLinkedTradersForUser(
  ccUserId: string,
  userEmail?: string | null
): Promise<LinkedTraderDto[]> {
  try {
    const links = await prisma.userTraderLink.findMany({
      where: { ccUserId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
    if (links.length === 0) {
      if (userEmail?.trim() && (await isConclaveAvailable())) {
        const accounts = await getConclaveAccountsByEmail(userEmail);
        return accounts.map((a, i) => ({
          traderId: a.login,
          displayName: a.name ?? a.login,
          displayLabel: null,
          isPrimary: i === 0,
        }));
      }
      return [];
    }

    const nameById = new Map<string, string>();
    try {
      const traders = await prisma.mt5Trader.findMany({
        where: { id: { in: links.map((l) => l.mt5TraderId) } },
        select: { id: true, name: true },
      });
      traders.forEach((t) => nameById.set(t.id, t.name));
    } catch {
      // mt5_traders may not exist in cc-conclave DB; use Conclave accounts
    }
    if (nameById.size === 0) {
      for (const l of links) {
        try {
          const name = await getConclaveAccountNameByLogin(l.mt5TraderId);
          if (name) nameById.set(l.mt5TraderId, name);
        } catch {
          // skip name for this link
        }
      }
    }
    return links.map((l) => ({
      traderId: l.mt5TraderId,
      displayName: nameById.get(l.mt5TraderId) ?? l.displayLabel?.trim() ?? l.mt5TraderId,
      displayLabel: l.displayLabel,
      isPrimary: l.isPrimary,
    }));
  } catch {
    return [];
  }
}

/**
 * Link an MT5 account (by login) to this Capital Chain user. First link becomes primary.
 * Validates that the account exists in cc-conclave "accounts" (or mt5_traders if present).
 */
export async function addTraderLink(
  ccUserId: string,
  mt5TraderId: string,
  displayLabel?: string | null
): Promise<LinkedTraderDto> {
  const tid = mt5TraderId.trim();
  let displayName: string = tid;

  try {
    const trader = await prisma.mt5Trader.findUnique({
      where: { id: tid },
      select: { id: true, name: true },
    });
    if (trader) {
      displayName = trader.name;
    }
  } catch {
    // mt5_traders may not exist in cc-conclave
  }

  if (displayName === tid) {
    const exists = await conclaveAccountExists(tid);
    if (!exists) throw new AppError("Account not found in cc-conclave", 404);
    const name = await getConclaveAccountNameByLogin(tid);
    if (name) displayName = name;
  }

  const existing = await prisma.userTraderLink.findUnique({
    where: { ccUserId_mt5TraderId: { ccUserId, mt5TraderId: tid } },
  });
  if (existing) {
    return {
      traderId: tid,
      displayName,
      displayLabel: existing.displayLabel,
      isPrimary: existing.isPrimary,
    };
  }
  const count = await prisma.userTraderLink.count({ where: { ccUserId } });
  const isPrimary = count === 0;
  await prisma.userTraderLink.create({
    data: {
      ccUserId,
      mt5TraderId: tid,
      displayLabel: displayLabel?.trim() ?? null,
      isPrimary,
    },
  });
  return {
    traderId: tid,
    displayName,
    displayLabel: displayLabel?.trim() ?? null,
    isPrimary,
  };
}

/**
 * Set which linked MT5 account is primary for this Capital Chain user (used when no account is selected).
 */
export async function setPrimaryTrader(ccUserId: string, mt5TraderId: string): Promise<void> {
  const tid = mt5TraderId.trim();
  const link = await prisma.userTraderLink.findUnique({
    where: { ccUserId_mt5TraderId: { ccUserId, mt5TraderId: tid } },
  });
  if (!link) {
    throw new AppError("Link not found", 404);
  }
  await prisma.$transaction([
    prisma.userTraderLink.updateMany({
      where: { ccUserId },
      data: { isPrimary: false },
    }),
    prisma.userTraderLink.update({
      where: { id: link.id },
      data: { isPrimary: true },
    }),
  ]);
}
