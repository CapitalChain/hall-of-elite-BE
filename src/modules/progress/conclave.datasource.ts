/**
 * Analytics from CC Conclave tables (MT5 data from Collector/Bridge).
 * Tables: accounts, deals, cashflows, positions.
 * Identifier: login (MT5 account number, bigint). user_trader_links.mt5TraderId = login as string.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client";
import type {
  ITradeAnalyticsDataSource,
  TraderMetricsRow,
  TraderPayoutRow,
  ClosedTradeRow,
} from "./analytics.datasource.types";

/** Normalize login to a string that can be used in raw SQL (bigint). */
function toLoginParam(login: string): string {
  const trimmed = String(login).trim();
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) return trimmed;
  return String(Math.floor(n));
}

/**
 * Get closed-trade rows from Conclave "deals" for an account (login).
 * Deals with side buy/sell and profit; we treat each deal as one trade row for simplicity.
 * profit = deal.profit, fees = commission + swap + fee, closeTime from time_msc.
 */
async function getDealsForLogin(loginStr: string): Promise<
  Array<{
    deal_ticket: number | bigint;
    symbol: string;
    profit: number;
    commission: number;
    swap: number;
    fee: number;
    time_msc: number | bigint;
    volume: number;
    position_id: number | bigint;
  }>
> {
  const login = toLoginParam(loginStr);
  try {
    const loginNum = Number(login);
    if (!Number.isFinite(loginNum) || loginNum < 0) return [];
    const rows = await prisma.$queryRaw<
      Array<{
        deal_ticket: bigint;
        symbol: string;
        profit: unknown;
        commission: unknown;
        swap: unknown;
        fee: unknown;
        time_msc: bigint;
        volume: unknown;
        position_id: bigint;
      }>
    >(Prisma.sql`
      SELECT deal_ticket, symbol, profit, commission, swap, fee, time_msc, volume, position_id
      FROM deals
      WHERE login = ${loginNum}
        AND side IN ('buy', 'sell')
      ORDER BY time_msc ASC
    `);
    return rows.map((r) => ({
      deal_ticket: Number(r.deal_ticket),
      symbol: r.symbol ?? "",
      profit: Number(r.profit ?? 0),
      commission: Number(r.commission ?? 0),
      swap: Number(r.swap ?? 0),
      fee: Number(r.fee ?? 0),
      time_msc: Number(r.time_msc),
      volume: Number(r.volume ?? 0),
      position_id: Number(r.position_id),
    }));
  } catch {
    return [];
  }
}

/**
 * Get cashflows for an account (login) from Conclave "cashflows".
 * Used to compute current balance: sum(amount) with sign by type (deposit/credit +, withdraw -).
 */
async function getCashflowsForLogin(loginStr: string): Promise<Array<{ type: string; amount: number; time_msc: number }>> {
  const login = toLoginParam(loginStr);
  try {
    const loginNum = Number(login);
    if (!Number.isFinite(loginNum) || loginNum < 0) return [];
    const rows = await prisma.$queryRaw<
      Array<{ type: string; amount: unknown; time_msc: bigint }>
    >(Prisma.sql`
      SELECT type, amount, time_msc
      FROM cashflows
      WHERE login = ${loginNum}
      ORDER BY time_msc ASC
    `);
    return rows.map((r) => ({
      type: String(r.type ?? "").toLowerCase(),
      amount: Number(r.amount ?? 0),
      time_msc: Number(r.time_msc),
    }));
  } catch {
    return [];
  }
}

/**
 * Get open positions for an account (login) from Conclave "positions".
 */
export async function getOpenPositionsForLogin(loginStr: string): Promise<
  Array<{
    position_id: number;
    symbol: string;
    volume: number;
    avg_price: number;
    floating_pnl: number;
    time_msc: number;
  }>
> {
  const login = toLoginParam(loginStr);
  try {
    const loginNum = Number(login);
    if (!Number.isFinite(loginNum) || loginNum < 0) return [];
    const rows = await prisma.$queryRaw<
      Array<{
        position_id: bigint;
        symbol: string;
        volume: unknown;
        avg_price: unknown;
        floating_pnl: unknown;
        time_msc: bigint;
      }>
    >(Prisma.sql`
      SELECT position_id, symbol, volume, avg_price, floating_pnl, time_msc
      FROM positions
      WHERE login = ${loginNum}
      ORDER BY time_msc ASC
    `);
    return rows.map((r) => ({
      position_id: Number(r.position_id),
      symbol: r.symbol ?? "",
      volume: Number(r.volume ?? 0),
      avg_price: Number(r.avg_price ?? 0),
      floating_pnl: Number(r.floating_pnl ?? 0),
      time_msc: Number(r.time_msc),
    }));
  } catch {
    return [];
  }
}

/** Check if CC Conclave "deals" table exists and is queryable. */
export async function isConclaveAvailable(): Promise<boolean> {
  try {
    await prisma.$queryRaw(Prisma.sql`SELECT 1 FROM deals LIMIT 1`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get account display name from CC Conclave "accounts" by login.
 * Used when mt5_traders is not present (cc-conclave is the only DB).
 */
export async function getConclaveAccountNameByLogin(loginStr: string): Promise<string | null> {
  const login = toLoginParam(loginStr);
  const loginNum = Number(login);
  if (!Number.isFinite(loginNum) || loginNum < 0) return null;
  try {
    const rows = await prisma.$queryRaw<Array<{ name: string | null }>>(
      Prisma.sql`SELECT name FROM accounts WHERE login = ${loginNum} LIMIT 1`
    );
    const name = rows[0]?.name;
    return name != null && String(name).trim() !== "" ? String(name).trim() : null;
  } catch {
    return null;
  }
}

/**
 * Resolve MT5 login(s) from CC Conclave "accounts" by email (case-insensitive).
 * Used so Capital Chain login (email) can show dashboard data without manual link when accounts.email matches.
 */
export async function getLoginsByEmailFromConclave(userEmail: string): Promise<string[]> {
  const email = String(userEmail ?? "").trim();
  if (!email) return [];
  try {
    const rows = await prisma.$queryRaw<Array<{ login: bigint }>>(
      Prisma.sql`SELECT login FROM accounts WHERE LOWER(TRIM(email)) = LOWER(TRIM(${email})) ORDER BY login ASC`
    );
    return rows.map((r) => String(Number(r.login)));
  } catch {
    return [];
  }
}

/**
 * Get accounts from CC Conclave by email (login + name). For listing "your" MT5 accounts when no links exist.
 */
export async function getConclaveAccountsByEmail(userEmail: string): Promise<Array<{ login: string; name: string | null }>> {
  const email = String(userEmail ?? "").trim();
  if (!email) return [];
  try {
    const rows = await prisma.$queryRaw<Array<{ login: bigint; name: string | null }>>(
      Prisma.sql`SELECT login, name FROM accounts WHERE LOWER(TRIM(email)) = LOWER(TRIM(${email})) ORDER BY login ASC`
    );
    return rows.map((r) => ({ login: String(Number(r.login)), name: r.name?.trim() ?? null }));
  } catch {
    return [];
  }
}

/**
 * Check if a login exists in CC Conclave "accounts". Used to validate link without mt5_traders.
 */
export async function conclaveAccountExists(loginStr: string): Promise<boolean> {
  const login = toLoginParam(loginStr);
  const loginNum = Number(login);
  if (!Number.isFinite(loginNum) || loginNum < 0) return false;
  try {
    const rows = await prisma.$queryRaw<Array<{ login: unknown }>>(
      Prisma.sql`SELECT login FROM accounts WHERE login = ${loginNum} LIMIT 1`
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

/**
 * Conclave-backed analytics datasource.
 * Uses "deals" and "cashflows" only. login = MT5 account number (string).
 */
export const conclaveAnalyticsDataSource: ITradeAnalyticsDataSource = {
  async getMetrics(loginStr: string): Promise<TraderMetricsRow | null> {
    const deals = await getDealsForLogin(loginStr);
    if (deals.length === 0) return null;
    const profits = deals.map((d) => d.profit);
    const grossProfit = profits.filter((p) => p > 0).reduce((a, b) => a + b, 0);
    const grossLoss = Math.abs(profits.filter((p) => p < 0).reduce((a, b) => a + b, 0));
    const wins = profits.filter((p) => p > 0).length;
    const winRate = profits.length > 0 ? (wins / profits.length) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
    const daysSet = new Set(deals.map((d) => new Date(Number(d.time_msc)).toISOString().slice(0, 10)));
    const totalTradingDays = daysSet.size;
    let cumulative = 0;
    let peak = 0;
    let maxDrawdown = 0;
    for (const p of profits) {
      cumulative += p;
      peak = Math.max(peak, cumulative);
      const dd = peak - cumulative;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }
    const peakPct = peak > 0 ? (maxDrawdown / peak) * 100 : 0;
    return {
      winRate,
      profitFactor,
      drawdown: peakPct,
      totalTradingDays,
    };
  },

  async getPayout(_loginStr: string): Promise<TraderPayoutRow | null> {
    return null;
  },

  async getClosedTrades(
    loginStr: string,
    options?: { fromDate?: Date; toDate?: Date; limit?: number }
  ): Promise<ClosedTradeRow[]> {
    const deals = await getDealsForLogin(loginStr);
    let list = deals.map((d) => {
      const closeTime = new Date(Number(d.time_msc));
      const fees = d.commission + d.swap + d.fee;
      return {
        id: String(d.deal_ticket),
        symbol: d.symbol,
        profitLoss: d.profit,
        fees,
        closeTime,
        volume: d.volume,
        openTime: undefined as Date | undefined,
        time_msc: d.time_msc,
      };
    });
    if (options?.fromDate) {
      list = list.filter((t) => t.closeTime >= options!.fromDate!);
    }
    if (options?.toDate) {
      list = list.filter((t) => t.closeTime <= options!.toDate!);
    }
    list.sort((a, b) => a.closeTime.getTime() - b.closeTime.getTime());
    if (options?.limit != null) {
      list = list.slice(-options.limit);
    }
    return list.map(({ id, symbol, profitLoss, fees, closeTime, volume, openTime }) => ({
      id,
      symbol,
      profitLoss,
      fees,
      closeTime,
      volume,
      openTime,
    }));
  },
};

/**
 * Get current balance for a Conclave account (login).
 * balance = sum(cashflows with sign) + sum(deals.profit).
 */
export async function getConclaveBalanceAndHwm(loginStr: string): Promise<{
  currentBalance: number | null;
  hwmBalance: number | null;
}> {
  const login = toLoginParam(loginStr);
  try {
    const [cashflows, deals] = await Promise.all([
      getCashflowsForLogin(login),
      getDealsForLogin(login),
    ]);
    let balanceFromCash = 0;
    for (const c of cashflows) {
      if (c.type === "withdraw") balanceFromCash -= c.amount;
      else balanceFromCash += c.amount;
    }
    const totalProfit = deals.reduce((s, d) => s + d.profit, 0);
    const currentBalance = balanceFromCash + totalProfit;

    const events: Array<{ time_msc: number; delta: number }> = [];
    for (const c of cashflows) {
      const amt = c.type === "withdraw" ? -c.amount : c.amount;
      events.push({ time_msc: c.time_msc, delta: amt });
    }
    for (const d of deals) {
      events.push({ time_msc: Number(d.time_msc), delta: d.profit });
    }
    events.sort((a, b) => a.time_msc - b.time_msc);
    let running = 0;
    let hwm = 0;
    for (const e of events) {
      running += e.delta;
      if (running > hwm) hwm = running;
    }
    const hwmBalance = events.length > 0 ? hwm : null;
    return { currentBalance, hwmBalance };
  } catch {
    return { currentBalance: null, hwmBalance: null };
  }
}

/** Row from accounts table (CC Conclave). */
export interface ConclaveAccountRow {
  login: number;
  name: string | null;
  email: string | null;
  currency: string | null;
  leverage: number | null;
  status: string | null;
}

/**
 * Get one account by login from CC Conclave "accounts".
 */
export async function getConclaveAccountByLogin(loginStr: string): Promise<ConclaveAccountRow | null> {
  const loginNum = Number(toLoginParam(loginStr));
  if (!Number.isFinite(loginNum) || loginNum < 0) return null;
  try {
    const rows = await prisma.$queryRaw<
      Array<{ login: bigint; name: string | null; email: string | null; currency: string | null; leverage: unknown; status: string | null }>
    >(Prisma.sql`
      SELECT login, name, email, currency, leverage, status
      FROM accounts
      WHERE login = ${loginNum}
      LIMIT 1
    `);
    const r = rows[0];
    if (!r) return null;
    return {
      login: Number(r.login),
      name: r.name,
      email: r.email,
      currency: r.currency,
      leverage: r.leverage != null ? Number(r.leverage) : null,
      status: r.status,
    };
  } catch {
    return null;
  }
}
