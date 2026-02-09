/**
 * Demo seed: 2 users with last 2 months of trades, achievements, and levels.
 * Deterministic so the same data is produced locally and on the server.
 *
 * Run: npm run prisma:seed
 *
 * On the server: install deps on the server (do not copy node_modules from Mac/Windows),
 * then run the seed. E.g. npm ci && npm run prisma:seed
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

const SYMBOLS = ["EURUSD", "GBPUSD", "XAUUSD", "USDJPY", "BTCUSD"];
const TWO_MONTHS_MS = 60 * 24 * 60 * 60 * 1000;

/** Fixed seed so the same data is generated on every run (local + server). */
const DEMO_SEED = 42;

function seededRandom(seed: number): () => number {
  return function next() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

const rng = seededRandom(DEMO_SEED);

function randomBetween(min: number, max: number): number {
  return min + rng() * (max - min);
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

/** Fixed end date for "last 2 months" so server and local get identical trade dates. */
function getDemoDateRange(): { end: Date; twoMonthsAgo: Date } {
  const end = new Date(Date.UTC(2025, 1, 8, 12, 0, 0)); // 2025-02-08 12:00 UTC
  const twoMonthsAgo = new Date(end.getTime() - TWO_MONTHS_MS);
  return { end, twoMonthsAgo };
}

async function main() {
  console.log("🌱 Seeding demo data (2 users, 2 months trades + achievements)...");
  const { end: now, twoMonthsAgo } = getDemoDateRange();

  // ─── Optional: ensure payout tiers exist ───
  const payoutTierCount = await prisma.payoutTier.count();
  if (payoutTierCount === 0) {
    console.log("📊 Creating payout tiers...");
    await prisma.payoutTier.createMany({
      data: [
        { minAverage: 0.4, maxAverage: 1, payoutPercent: 30, tier: "BRONZE", color: "#10B981", description: "High activity - 30%", order: 1 },
        { minAverage: 0.2, maxAverage: 0.4, payoutPercent: 80, tier: "SILVER", color: "#F59E0B", description: "Medium activity - 80%", order: 2 },
        { minAverage: 0, maxAverage: 0.2, payoutPercent: 95, tier: "GOLD", color: "#FBBF24", description: "Low activity - 95%", order: 3 },
      ],
    });
  }

  // ─── 1. Create 2 Users + TradingAccounts (for progress resolution) ───
  console.log("👥 Creating 2 demo users and trading accounts...");
  const deleteIfExists = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (e: unknown) {
      if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2021") return;
      throw e;
    }
  };
  await deleteIfExists(() => prisma.traderPayout.deleteMany({}));
  await deleteIfExists(() => prisma.rewardEntitlement.deleteMany({}));
  await deleteIfExists(() => prisma.reward.deleteMany({}));
  await prisma.traderScore.deleteMany({});
  await prisma.traderMetrics.deleteMany({});
  await prisma.trade.deleteMany({});
  await deleteIfExists(() => prisma.traderSnapshot.deleteMany({}));
  await deleteIfExists(() => prisma.snapshotRun.deleteMany({}));
  await deleteIfExists(() => prisma.mt5Trade.deleteMany({}));
  await deleteIfExists(() => prisma.mt5TraderMetrics.deleteMany({}));
  await deleteIfExists(() => prisma.mt5TraderScore.deleteMany({}));
  await deleteIfExists(() => prisma.mt5TradingAccount.deleteMany({}));
  await deleteIfExists(() => prisma.mt5Trader.deleteMany({}));
  await prisma.tradingAccount.deleteMany({});
  await prisma.user.deleteMany({});

  const DEMO_PASSWORD_PLAIN = "Demo123!";
  const demoPassword = await hashPassword(DEMO_PASSWORD_PLAIN);
  const pwCheck = await bcrypt.compare(DEMO_PASSWORD_PLAIN, demoPassword);
  if (!pwCheck) throw new Error("Seed: bcrypt hash verify failed for demo password");
  const user1 = await prisma.user.create({
    data: {
      email: "demo1@hallofelite.com",
      password: demoPassword,
      displayName: "Alex Rivera",
      role: "TRADER",
    },
  });
  const user2 = await prisma.user.create({
    data: {
      email: "demo2@hallofelite.com",
      password: demoPassword,
      displayName: "Jordan Chen",
      role: "TRADER",
    },
  });

  const accountNumber1 = "MT5-DEMO-1001";
  const accountNumber2 = "MT5-DEMO-1002";
  const acc1 = await prisma.tradingAccount.create({
    data: { userId: user1.id, accountNumber: accountNumber1, broker: "Capital Chain" },
  });
  const acc2 = await prisma.tradingAccount.create({
    data: { userId: user2.id, accountNumber: accountNumber2, broker: "Capital Chain" },
  });

  // ─── 2. MT5 traders + accounts (externalId = accountNumber for progress link) ───
  console.log("📈 Creating MT5 traders and accounts...");
  const mt5_1 = await prisma.mt5Trader.create({
    data: {
      externalId: "EXT-" + accountNumber1,
      name: "Alex Rivera",
      accountStatus: "ACTIVE",
    },
  });
  const mt5_2 = await prisma.mt5Trader.create({
    data: {
      externalId: "EXT-" + accountNumber2,
      name: "Jordan Chen",
      accountStatus: "ACTIVE",
    },
  });

  const mt5Acc1 = await prisma.mt5TradingAccount.create({
    data: {
      traderId: mt5_1.id,
      externalId: accountNumber1,
      balance: 25400,
      leverage: 100,
      currency: "USD",
      status: "ACTIVE",
    },
  });
  const mt5Acc2 = await prisma.mt5TradingAccount.create({
    data: {
      traderId: mt5_2.id,
      externalId: accountNumber2,
      balance: 31800,
      leverage: 100,
      currency: "USD",
      status: "ACTIVE",
    },
  });

  // ─── 3. Last 2 months of trades (both accounts) ───
  console.log("📊 Generating last 2 months of trades...");
  const trades1: { symbol: string; volume: number; profitLoss: number; fees: number; openTime: Date; closeTime: Date }[] = [];
  const trades2: { symbol: string; volume: number; profitLoss: number; fees: number; openTime: Date; closeTime: Date }[] = [];

  for (let d = 0; d < 60; d++) {
    const dayStart = addDays(twoMonthsAgo, d);
    const numTrades1 = Math.floor(randomBetween(2, 6));
    const numTrades2 = Math.floor(randomBetween(3, 8));
    for (let t = 0; t < numTrades1; t++) {
      const openTime = new Date(dayStart.getTime() + t * 2 * 60 * 60 * 1000);
      const closeTime = new Date(openTime.getTime() + (1 + rng() * 2) * 60 * 60 * 1000);
      const pnl = (rng() > 0.45 ? 1 : -1) * randomBetween(20, 180);
      trades1.push({
        symbol: SYMBOLS[Math.floor(rng() * SYMBOLS.length)],
        volume: randomBetween(0.01, 0.5),
        profitLoss: pnl,
        fees: 1.0,
        openTime,
        closeTime,
      });
    }
    for (let t = 0; t < numTrades2; t++) {
      const openTime = new Date(dayStart.getTime() + t * 1.5 * 60 * 60 * 1000);
      const closeTime = new Date(openTime.getTime() + (0.5 + rng() * 2) * 60 * 60 * 1000);
      const pnl = (rng() > 0.42 ? 1 : -1) * randomBetween(30, 220);
      trades2.push({
        symbol: SYMBOLS[Math.floor(rng() * SYMBOLS.length)],
        volume: randomBetween(0.02, 0.6),
        profitLoss: pnl,
        fees: 1.2,
        openTime,
        closeTime,
      });
    }
  }

  for (let i = 0; i < trades1.length; i++) {
    const t = trades1[i];
    await prisma.mt5Trade.create({
      data: {
        externalId: `MT5-1-${i}-${t.openTime.getTime()}`,
        accountId: mt5Acc1.id,
        symbol: t.symbol,
        volume: t.volume,
        profitLoss: t.profitLoss,
        fees: t.fees,
        openTime: t.openTime,
        closeTime: t.closeTime,
        status: "CLOSED",
      },
    });
  }
  for (let i = 0; i < trades2.length; i++) {
    const t = trades2[i];
    await prisma.mt5Trade.create({
      data: {
        externalId: `MT5-2-${i}-${t.openTime.getTime()}`,
        accountId: mt5Acc2.id,
        symbol: t.symbol,
        volume: t.volume,
        profitLoss: t.profitLoss,
        fees: t.fees,
        openTime: t.openTime,
        closeTime: t.closeTime,
        status: "CLOSED",
      },
    });
  }

  // ─── 4. Mt5TraderMetrics (from trades) ───
  const wins1 = trades1.filter((t) => t.profitLoss > 0).length;
  const wins2 = trades2.filter((t) => t.profitLoss > 0).length;
  const grossProfit1 = trades1.filter((t) => t.profitLoss > 0).reduce((s, t) => s + t.profitLoss, 0);
  const grossLoss1 = Math.abs(trades1.filter((t) => t.profitLoss < 0).reduce((s, t) => s + t.profitLoss, 0));
  const grossProfit2 = trades2.filter((t) => t.profitLoss > 0).reduce((s, t) => s + t.profitLoss, 0);
  const grossLoss2 = Math.abs(trades2.filter((t) => t.profitLoss < 0).reduce((s, t) => s + t.profitLoss, 0));
  const pf1 = grossLoss1 > 0 ? grossProfit1 / grossLoss1 : 2;
  const pf2 = grossLoss2 > 0 ? grossProfit2 / grossLoss2 : 2;
  const wr1 = trades1.length > 0 ? (wins1 / trades1.length) * 100 : 60;
  const wr2 = trades2.length > 0 ? (wins2 / trades2.length) * 100 : 65;

  await prisma.mt5TraderMetrics.create({
    data: {
      traderId: mt5_1.id,
      profitFactor: Math.round(pf1 * 100) / 100,
      winRate: Math.round(wr1 * 10) / 10,
      drawdown: 8.5,
      totalTradingDays: 58,
    },
  });
  await prisma.mt5TraderMetrics.create({
    data: {
      traderId: mt5_2.id,
      profitFactor: Math.round(pf2 * 100) / 100,
      winRate: Math.round(wr2 * 10) / 10,
      drawdown: 6.2,
      totalTradingDays: 60,
    },
  });

  // ─── 5. Mt5TraderScore (tier & rank for leaderboard) ───
  await prisma.mt5TraderScore.create({
    data: {
      traderId: mt5_1.id,
      consistencyScore: 72,
      tier: "GOLD",
      rank: 2,
      eligible: true,
      lastCalculatedAt: now,
    },
  });
  await prisma.mt5TraderScore.create({
    data: {
      traderId: mt5_2.id,
      consistencyScore: 88,
      tier: "PLATINUM",
      rank: 1,
      eligible: true,
      lastCalculatedAt: now,
    },
  });

  // ─── 6. SnapshotRun + TraderSnapshots (so leaderboard shows real data) ───
  console.log("📸 Creating snapshot run and trader snapshots...");
  const snapshotRun = await prisma.snapshotRun.create({
    data: {
      runKey: `demo-${now.toISOString().slice(0, 10)}`,
      version: "V1",
      label: "Demo snapshot – 2 months",
      generatedAt: now,
    },
  });

  const metricsSummary = (pf: number, wr: number, dd: number, days: number, total: number) => ({
    profitFactor: pf,
    winRatePct: wr,
    drawdownPct: dd,
    tradingDays: days,
    totalTrades: total,
  });
  const badges = (phoenix: boolean, payout: boolean, cash: boolean, merch: boolean) => ({
    phoenixAddOn: phoenix,
    payoutBoost: payout,
    cashback: cash,
    merchandise: merch,
  });

  await prisma.traderSnapshot.create({
    data: {
      snapshotId: snapshotRun.id,
      traderId: mt5_1.id,
      externalTraderId: mt5_1.externalId,
      score: 72,
      rank: 2,
      tier: "GOLD",
      badges: badges(true, true, false, false),
      metrics: metricsSummary(pf1, wr1, 8.5, 58, trades1.length),
    },
  });
  await prisma.traderSnapshot.create({
    data: {
      snapshotId: snapshotRun.id,
      traderId: mt5_2.id,
      externalTraderId: mt5_2.externalId,
      score: 88,
      rank: 1,
      tier: "PLATINUM",
      badges: badges(true, true, true, false),
      metrics: metricsSummary(pf2, wr2, 6.2, 60, trades2.length),
    },
  });

  // ─── 7. Legacy TraderMetrics + TraderScore (for getTraderProfile by tradingAccountId if ever used) ───
  await prisma.traderMetrics.create({
    data: {
      tradingAccountId: acc1.id,
      totalTrades: trades1.length,
      winningTrades: wins1,
      losingTrades: trades1.length - wins1,
      totalProfit: grossProfit1,
      totalLoss: grossLoss1,
      winRate: wr1,
      profitFactor: pf1,
      averageWin: wins1 > 0 ? grossProfit1 / wins1 : 0,
      averageLoss: trades1.length - wins1 > 0 ? grossLoss1 / (trades1.length - wins1) : 0,
      largestWin: Math.max(...trades1.filter((t) => t.profitLoss > 0).map((t) => t.profitLoss), 0),
      largestLoss: Math.min(...trades1.filter((t) => t.profitLoss < 0).map((t) => t.profitLoss), 0),
      currentDrawdown: 5,
      maxDrawdown: 8.5,
      sharpeRatio: 1.8,
    },
  });
  await prisma.traderMetrics.create({
    data: {
      tradingAccountId: acc2.id,
      totalTrades: trades2.length,
      winningTrades: wins2,
      losingTrades: trades2.length - wins2,
      totalProfit: grossProfit2,
      totalLoss: grossLoss2,
      winRate: wr2,
      profitFactor: pf2,
      averageWin: wins2 > 0 ? grossProfit2 / wins2 : 0,
      averageLoss: trades2.length - wins2 > 0 ? grossLoss2 / (trades2.length - wins2) : 0,
      largestWin: Math.max(...trades2.filter((t) => t.profitLoss > 0).map((t) => t.profitLoss), 0),
      largestLoss: Math.min(...trades2.filter((t) => t.profitLoss < 0).map((t) => t.profitLoss), 0),
      currentDrawdown: 3,
      maxDrawdown: 6.2,
      sharpeRatio: 2.2,
    },
  });
  await prisma.traderScore.create({ data: { tradingAccountId: acc1.id, tier: "GOLD", rank: 2, score: 72 } });
  await prisma.traderScore.create({ data: { tradingAccountId: acc2.id, tier: "PLATINUM", rank: 1, score: 88 } });

  // ─── 8. Payout tiers + TraderPayout ───
  const goldTier = await prisma.payoutTier.findFirst({ where: { tier: "GOLD" } });
  const silverTier = await prisma.payoutTier.findFirst({ where: { tier: "SILVER" } });
  if (goldTier && silverTier) {
    await prisma.traderPayout.create({
      data: {
        traderId: mt5_1.id,
        payoutTierId: silverTier.id,
        payoutPercent: 80,
        averageTradesPerDay: 0.28,
        totalTradingDays: 58,
        maxTradesPerDay: 6,
      },
    });
    await prisma.traderPayout.create({
      data: {
        traderId: mt5_2.id,
        payoutTierId: goldTier.id,
        payoutPercent: 95,
        averageTradesPerDay: 0.18,
        totalTradingDays: 60,
        maxTradesPerDay: 8,
      },
    });
  }

  console.log("✅ Demo seed complete.");
  console.log("\n📝 Demo credentials (password for both): Demo123!");
  console.log("   User 1: demo1@hallofelite.com – Alex Rivera (GOLD, Rank 2)");
  console.log("   User 2: demo2@hallofelite.com – Jordan Chen (PLATINUM, Rank 1)");
  console.log("\n   Leader board and profiles are populated from snapshot + MT5 data.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
