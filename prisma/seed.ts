import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data
  console.log("🧹 Clearing existing data...");
  await prisma.rewardEntitlement.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.traderScore.deleteMany();
  await prisma.traderMetrics.deleteMany();
  await prisma.trade.deleteMany();
  await prisma.tradingAccount.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tier.deleteMany();

  // Create Tiers
  console.log("📊 Creating tiers...");
  const bronzeTier = await prisma.tier.create({
    data: {
      name: "BRONZE",
      minScore: 0,
      maxScore: 50,
      color: "#cd7f32",
      description: "Bronze tier traders",
    },
  });

  const silverTier = await prisma.tier.create({
    data: {
      name: "SILVER",
      minScore: 50,
      maxScore: 70,
      color: "#c0c0c0",
      description: "Silver tier traders",
    },
  });

  const goldTier = await prisma.tier.create({
    data: {
      name: "GOLD",
      minScore: 70,
      maxScore: 85,
      color: "#ffd700",
      description: "Gold tier traders",
    },
  });

  const platinumTier = await prisma.tier.create({
    data: {
      name: "PLATINUM",
      minScore: 85,
      maxScore: 95,
      color: "#e5e4e2",
      description: "Platinum tier traders",
    },
  });

  const eliteTier = await prisma.tier.create({
    data: {
      name: "ELITE",
      minScore: 95,
      maxScore: null,
      color: "#b9f2ff",
      description: "Elite tier traders - Top performers",
    },
  });

  // Create Users
  console.log("👥 Creating users...");
  const adminPassword = await hashPassword("admin123");
  const admin = await prisma.user.create({
    data: {
      email: "admin@hallofelite.com",
      password: adminPassword,
      displayName: "Admin User",
      role: "ADMIN",
    },
  });

  const trader1Password = await hashPassword("trader123");
  const trader1 = await prisma.user.create({
    data: {
      email: "john.trader@example.com",
      password: trader1Password,
      displayName: "John Trader",
      role: "TRADER",
    },
  });

  const trader2Password = await hashPassword("trader123");
  const trader2 = await prisma.user.create({
    data: {
      email: "sarah.elite@example.com",
      password: trader2Password,
      displayName: "Sarah Elite",
      role: "TRADER",
    },
  });

  const trader3Password = await hashPassword("trader123");
  const trader3 = await prisma.user.create({
    data: {
      email: "mike.pro@example.com",
      password: trader3Password,
      displayName: "Mike Pro",
      role: "TRADER",
    },
  });

  const trader4Password = await hashPassword("trader123");
  const trader4 = await prisma.user.create({
    data: {
      email: "emma.master@example.com",
      password: trader4Password,
      displayName: "Emma Master",
      role: "TRADER",
    },
  });

  const trader5Password = await hashPassword("trader123");
  const trader5 = await prisma.user.create({
    data: {
      email: "alex.champion@example.com",
      password: trader5Password,
      displayName: "Alex Champion",
      role: "TRADER",
    },
  });

  // Create Trading Accounts
  console.log("💼 Creating trading accounts...");
  const account1 = await prisma.tradingAccount.create({
    data: {
      userId: trader1.id,
      accountNumber: "MT5-001234",
      broker: "Capital Chain",
    },
  });

  const account2 = await prisma.tradingAccount.create({
    data: {
      userId: trader2.id,
      accountNumber: "MT5-002345",
      broker: "Capital Chain",
    },
  });

  const account3 = await prisma.tradingAccount.create({
    data: {
      userId: trader3.id,
      accountNumber: "MT5-003456",
      broker: "Capital Chain",
    },
  });

  const account4 = await prisma.tradingAccount.create({
    data: {
      userId: trader4.id,
      accountNumber: "MT5-004567",
      broker: "Capital Chain",
    },
  });

  const account5 = await prisma.tradingAccount.create({
    data: {
      userId: trader5.id,
      accountNumber: "MT5-005678",
      broker: "Capital Chain",
    },
  });

  // Create Trader Metrics
  console.log("📈 Creating trader metrics...");
  const metrics1 = await prisma.traderMetrics.create({
    data: {
      tradingAccountId: account1.id,
      totalTrades: 150,
      winningTrades: 90,
      losingTrades: 60,
      totalProfit: 12500.50,
      totalLoss: 4500.25,
      winRate: 60.0,
      profitFactor: 2.78,
      averageWin: 138.89,
      averageLoss: 75.00,
      largestWin: 500.00,
      largestLoss: 200.00,
      currentDrawdown: 5.2,
      maxDrawdown: 12.5,
      sharpeRatio: 1.85,
    },
  });

  const metrics2 = await prisma.traderMetrics.create({
    data: {
      tradingAccountId: account2.id,
      totalTrades: 280,
      winningTrades: 196,
      losingTrades: 84,
      totalProfit: 35000.75,
      totalLoss: 8500.50,
      winRate: 70.0,
      profitFactor: 4.12,
      averageWin: 178.57,
      averageLoss: 101.19,
      largestWin: 1200.00,
      largestLoss: 350.00,
      currentDrawdown: 2.1,
      maxDrawdown: 8.5,
      sharpeRatio: 2.45,
    },
  });

  const metrics3 = await prisma.traderMetrics.create({
    data: {
      tradingAccountId: account3.id,
      totalTrades: 200,
      winningTrades: 130,
      losingTrades: 70,
      totalProfit: 18000.00,
      totalLoss: 6000.00,
      winRate: 65.0,
      profitFactor: 3.00,
      averageWin: 138.46,
      averageLoss: 85.71,
      largestWin: 800.00,
      largestLoss: 250.00,
      currentDrawdown: 3.8,
      maxDrawdown: 10.2,
      sharpeRatio: 2.10,
    },
  });

  const metrics4 = await prisma.traderMetrics.create({
    data: {
      tradingAccountId: account4.id,
      totalTrades: 350,
      winningTrades: 280,
      losingTrades: 70,
      totalProfit: 55000.00,
      totalLoss: 7000.00,
      winRate: 80.0,
      profitFactor: 7.86,
      averageWin: 196.43,
      averageLoss: 100.00,
      largestWin: 2000.00,
      largestLoss: 400.00,
      currentDrawdown: 1.5,
      maxDrawdown: 5.8,
      sharpeRatio: 3.20,
    },
  });

  const metrics5 = await prisma.traderMetrics.create({
    data: {
      tradingAccountId: account5.id,
      totalTrades: 500,
      winningTrades: 425,
      losingTrades: 75,
      totalProfit: 125000.00,
      totalLoss: 8000.00,
      winRate: 85.0,
      profitFactor: 15.63,
      averageWin: 294.12,
      averageLoss: 106.67,
      largestWin: 5000.00,
      largestLoss: 500.00,
      currentDrawdown: 0.8,
      maxDrawdown: 3.2,
      sharpeRatio: 4.50,
    },
  });

  // Create Trader Scores
  console.log("🏆 Creating trader scores...");
  await prisma.traderScore.create({
    data: {
      tradingAccountId: account1.id,
      tier: "BRONZE",
      rank: 5,
      score: 45.5,
    },
  });

  await prisma.traderScore.create({
    data: {
      tradingAccountId: account2.id,
      tier: "GOLD",
      rank: 3,
      score: 78.2,
    },
  });

  await prisma.traderScore.create({
    data: {
      tradingAccountId: account3.id,
      tier: "SILVER",
      rank: 4,
      score: 62.8,
    },
  });

  await prisma.traderScore.create({
    data: {
      tradingAccountId: account4.id,
      tier: "PLATINUM",
      rank: 2,
      score: 92.5,
    },
  });

  await prisma.traderScore.create({
    data: {
      tradingAccountId: account5.id,
      tier: "ELITE",
      rank: 1,
      score: 98.7,
    },
  });

  // Create Sample Trades
  console.log("📊 Creating sample trades...");
  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Trades for account 1
  for (let i = 0; i < 10; i++) {
    const openTime = new Date(oneMonthAgo.getTime() + i * 3 * 24 * 60 * 60 * 1000);
    const closeTime = new Date(openTime.getTime() + 2 * 60 * 60 * 1000);
    const profit = i % 2 === 0 ? 100 + Math.random() * 200 : -(50 + Math.random() * 100);

    await prisma.trade.create({
      data: {
        tradingAccountId: account1.id,
        symbol: "EURUSD",
        type: i % 2 === 0 ? "BUY" : "SELL",
        volume: 0.1 + Math.random() * 0.4,
        openPrice: 1.0850 + Math.random() * 0.01,
        closePrice: 1.0850 + Math.random() * 0.01,
        profit: profit,
        openTime: openTime,
        closeTime: closeTime,
      },
    });
  }

  // Trades for account 2
  for (let i = 0; i < 15; i++) {
    const openTime = new Date(oneMonthAgo.getTime() + i * 2 * 24 * 60 * 60 * 1000);
    const closeTime = new Date(openTime.getTime() + 3 * 60 * 60 * 1000);
    const profit = i % 3 !== 0 ? 150 + Math.random() * 300 : -(80 + Math.random() * 120);

    await prisma.trade.create({
      data: {
        tradingAccountId: account2.id,
        symbol: "GBPUSD",
        type: i % 2 === 0 ? "BUY" : "SELL",
        volume: 0.2 + Math.random() * 0.5,
        openPrice: 1.2650 + Math.random() * 0.015,
        closePrice: 1.2650 + Math.random() * 0.015,
        profit: profit,
        openTime: openTime,
        closeTime: closeTime,
      },
    });
  }

  // Create Rewards
  console.log("🎁 Creating rewards...");
  const reward1 = await prisma.reward.create({
    data: {
      tier: "GOLD",
      rewardType: "BONUS",
      name: "Gold Tier Bonus",
      description: "Exclusive bonus for Gold tier traders",
      amount: 500.0,
      isActive: true,
    },
  });

  const reward2 = await prisma.reward.create({
    data: {
      tier: "PLATINUM",
      rewardType: "BONUS",
      name: "Platinum Tier Bonus",
      description: "Premium bonus for Platinum tier traders",
      amount: 1000.0,
      isActive: true,
    },
  });

  const reward3 = await prisma.reward.create({
    data: {
      tier: "ELITE",
      rewardType: "BONUS",
      name: "Elite Tier Bonus",
      description: "Exclusive bonus for Elite tier traders",
      amount: 2500.0,
      isActive: true,
    },
  });

  const reward4 = await prisma.reward.create({
    data: {
      tier: "ELITE",
      rewardType: "MERCHANDISE",
      name: "Elite Merchandise Package",
      description: "Premium merchandise for Elite traders",
      amount: 0,
      isActive: true,
    },
  });

  // Create Reward Entitlements
  console.log("🎫 Creating reward entitlements...");
  await prisma.rewardEntitlement.create({
    data: {
      traderId: account2.id,
      rewardId: reward1.id,
      rewardType: "BONUS",
      amount: 500.0,
      status: "PENDING",
      eligibleAt: new Date(),
    },
  });

  await prisma.rewardEntitlement.create({
    data: {
      traderId: account4.id,
      rewardId: reward2.id,
      rewardType: "BONUS",
      amount: 1000.0,
      status: "PENDING",
      eligibleAt: new Date(),
    },
  });

  await prisma.rewardEntitlement.create({
    data: {
      traderId: account5.id,
      rewardId: reward3.id,
      rewardType: "BONUS",
      amount: 2500.0,
      status: "PENDING",
      eligibleAt: new Date(),
    },
  });

  await prisma.rewardEntitlement.create({
    data: {
      traderId: account5.id,
      rewardId: reward4.id,
      rewardType: "MERCHANDISE",
      amount: 0,
      status: "PENDING",
      eligibleAt: new Date(),
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log("\n📝 Test Credentials:");
  console.log("Admin: admin@hallofelite.com / admin123");
  console.log("Trader 1: john.trader@example.com / trader123");
  console.log("Trader 2: sarah.elite@example.com / trader123");
  console.log("Trader 3: mike.pro@example.com / trader123");
  console.log("Trader 4: emma.master@example.com / trader123");
  console.log("Trader 5: alex.champion@example.com / trader123");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
