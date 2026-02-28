/**
 * Elite list and trader profile from CC Conclave tables only: accounts, deals.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { TraderTier } from "../../types";
import type { TraderProfile } from "../../types";
import type {
  TraderSnapshotBadges,
  TraderSnapshotMetricsSummary,
} from "../snapshots/types/snapshot.types";
import {
  conclaveAnalyticsDataSource,
  getConclaveBalanceAndHwm,
  getConclaveAccountByLogin,
  isConclaveAvailable,
} from "./conclave.datasource";

/** Same shape as EliteListItem for elite leaderboard from Conclave. */
export interface ConclaveEliteItem {
  traderId: string;
  externalTraderId: string;
  displayName: string;
  score: number;
  rank: number;
  tier: TraderTier;
  badges: TraderSnapshotBadges;
  metrics: TraderSnapshotMetricsSummary;
}

const TIER_ORDER = Object.values(TraderTier);

function scoreToTier(rank: number, total: number): TraderTier {
  if (total === 0) return TraderTier.BRONZE;
  const pct = rank / total;
  if (pct <= 0.01) return TraderTier.ELITE;
  if (pct <= 0.05) return TraderTier.DIAMOND;
  if (pct <= 0.15) return TraderTier.PLATINUM;
  if (pct <= 0.35) return TraderTier.GOLD;
  if (pct <= 0.65) return TraderTier.SILVER;
  return TraderTier.BRONZE;
}

/**
 * Elite leaderboard from CC Conclave: accounts + deals aggregated by login.
 * Ranked by total profit (deals.profit), tier from rank percentile.
 */
export async function getEliteLeaderboardFromConclave(limit = 100): Promise<ConclaveEliteItem[]> {
  try {
    const rows = await prisma.$queryRaw<
      Array<{
        login: bigint;
        name: string | null;
        total_profit: unknown;
        trade_count: bigint;
        wins: bigint;
        gross_profit: unknown;
        gross_loss: unknown;
      }>
    >(Prisma.sql`
      WITH deal_agg AS (
        SELECT login,
          SUM(profit) AS total_profit,
          COUNT(*) AS trade_count,
          SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END) AS wins,
          SUM(CASE WHEN profit > 0 THEN profit ELSE 0 END) AS gross_profit,
          SUM(CASE WHEN profit < 0 THEN -profit ELSE 0 END) AS gross_loss
        FROM deals
        WHERE side IN ('buy', 'sell')
        GROUP BY login
      )
      SELECT d.login, a.name, d.total_profit, d.trade_count, d.wins, d.gross_profit, d.gross_loss
      FROM deal_agg d
      JOIN accounts a ON a.login = d.login
      ORDER BY d.total_profit DESC NULLS LAST
      LIMIT ${limit}
    `);

    if (rows.length === 0) return [];

    const total = rows.length;
    return rows.map((r, index) => {
      const rank = index + 1;
      const tradeCount = Number(r.trade_count) || 0;
      const wins = Number(r.wins) || 0;
      const grossLoss = Number(r.gross_loss) || 0;
      const grossProfit = Number(r.gross_profit) || 0;
      const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
      const winRatePct = tradeCount > 0 ? (wins / tradeCount) * 100 : 0;
      return {
        traderId: String(Number(r.login)),
        externalTraderId: String(Number(r.login)),
        displayName: r.name?.trim() || String(Number(r.login)),
        score: Number(r.total_profit) || 0,
        rank,
        tier: scoreToTier(rank, total),
        badges: { phoenixAddOn: false, payoutBoost: false, cashback: false, merchandise: false },
        metrics: {
          profitFactor,
          winRatePct,
          drawdownPct: 0,
          tradingDays: 0,
          totalTrades: tradeCount,
        },
      };
    });
  } catch {
    return [];
  }
}

/**
 * Trader profile from CC Conclave by login (accounts + deals metrics).
 */
export async function getTraderProfileFromConclave(loginStr: string): Promise<TraderProfile | null> {
  const login = String(loginStr).trim();
  if (!/^\d+$/.test(login)) return null;
  try {
    const [account, metrics, balanceHwm] = await Promise.all([
      getConclaveAccountByLogin(login),
      conclaveAnalyticsDataSource.getMetrics(login),
      getConclaveBalanceAndHwm(login),
    ]);
    if (!account) return null;

    const m = metrics;
    return {
      id: login,
      displayName: account.name?.trim() || login,
      tier: TraderTier.BRONZE,
      rank: 0,
      overallScore: balanceHwm.currentBalance ?? 0,
      metrics: {
        profitFactor: m?.profitFactor ?? 0,
        winRate: m?.winRate ?? 0,
        maxDrawdown: m?.drawdown ?? 0,
        totalProfit: 0,
        totalTrades: 0,
        tradingDays: m?.totalTradingDays ?? 0,
        sharpeRatio: 0,
        averageWin: 0,
        averageLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        currentDrawdown: m?.drawdown ?? 0,
      },
      rewards: {
        phoenixAddOn: false,
        payoutBoost: false,
        cashback: false,
        merchandise: false,
      },
    };
  } catch {
    return null;
  }
}

export { isConclaveAvailable };
