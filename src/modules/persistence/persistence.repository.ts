import { Prisma, PrismaClient } from "@prisma/client";
import {
  Mt5AccountInput,
  Mt5TradeInput,
  Mt5TraderInput,
  Mt5TraderMetricsInput,
} from "./persistence.dto";

interface UpsertResult<T> {
  record: T;
  created: boolean;
}

export interface TraderBundle {
  trader: Mt5TraderInput;
  accounts: Mt5AccountInput[];
  trades: Mt5TradeInput[];
  metrics?: Mt5TraderMetricsInput;
}

export interface PersistCounts {
  tradersInserted: number;
  tradersUpdated: number;
  accountsInserted: number;
  accountsUpdated: number;
  tradesInserted: number;
  tradesUpdated: number;
  metricsInserted: number;
  metricsUpdated: number;
}

const emptyCounts = (): PersistCounts => ({
  tradersInserted: 0,
  tradersUpdated: 0,
  accountsInserted: 0,
  accountsUpdated: 0,
  tradesInserted: 0,
  tradesUpdated: 0,
  metricsInserted: 0,
  metricsUpdated: 0,
});

export class PersistenceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async persistTraderBundle(bundle: TraderBundle): Promise<PersistCounts> {
    return this.prisma.$transaction(async (tx) => {
      const counts = emptyCounts();

      const traderResult = await this.upsertTrader(tx, bundle.trader);
      if (traderResult.created) {
        counts.tradersInserted += 1;
      } else {
        counts.tradersUpdated += 1;
      }

      const accountIdByExternalId = new Map<string, string>();
      for (const account of bundle.accounts) {
        const accountResult = await this.upsertAccount(tx, account, traderResult.record.id);
        accountIdByExternalId.set(account.externalId, accountResult.record.id);
        if (accountResult.created) {
          counts.accountsInserted += 1;
        } else {
          counts.accountsUpdated += 1;
        }
      }

      for (const trade of bundle.trades) {
        const accountId = await this.resolveAccountId(tx, trade.accountExternalId, accountIdByExternalId);
        if (!accountId) {
          continue;
        }
        const tradeResult = await this.upsertTrade(tx, trade, accountId);
        if (tradeResult.created) {
          counts.tradesInserted += 1;
        } else {
          counts.tradesUpdated += 1;
        }
      }

      if (bundle.metrics) {
        const metricsResult = await this.upsertMetrics(tx, bundle.metrics, traderResult.record.id);
        if (metricsResult.created) {
          counts.metricsInserted += 1;
        } else {
          counts.metricsUpdated += 1;
        }
      }

      return counts;
    });
  }

  private async upsertTrader(tx: Prisma.TransactionClient, trader: Mt5TraderInput) {
    const existing = await tx.mt5Trader.findUnique({
      where: { externalId: trader.externalId },
    });

    const record = await tx.mt5Trader.upsert({
      where: { externalId: trader.externalId },
      create: {
        externalId: trader.externalId,
        name: trader.name,
        accountStatus: trader.accountStatus,
      },
      update: {
        name: trader.name,
        accountStatus: trader.accountStatus,
      },
    });

    return { record, created: !existing } as UpsertResult<typeof record>;
  }

  private async upsertAccount(
    tx: Prisma.TransactionClient,
    account: Mt5AccountInput,
    traderId: string
  ) {
    const existing = await tx.mt5TradingAccount.findUnique({
      where: { externalId: account.externalId },
    });

    const record = await tx.mt5TradingAccount.upsert({
      where: { externalId: account.externalId },
      create: {
        externalId: account.externalId,
        traderId,
        balance: account.balance,
        leverage: account.leverage,
        currency: account.currency,
        status: account.status,
      },
      update: {
        traderId,
        balance: account.balance,
        leverage: account.leverage,
        currency: account.currency,
        status: account.status,
      },
    });

    return { record, created: !existing } as UpsertResult<typeof record>;
  }

  private async upsertTrade(
    tx: Prisma.TransactionClient,
    trade: Mt5TradeInput,
    accountId: string
  ) {
    const existing = await tx.mt5Trade.findUnique({
      where: { externalId: trade.externalId },
    });

    const record = await tx.mt5Trade.upsert({
      where: { externalId: trade.externalId },
      create: {
        externalId: trade.externalId,
        accountId,
        symbol: trade.symbol,
        volume: trade.volume,
        profitLoss: trade.profitLoss,
        fees: trade.fees,
        openTime: trade.openTime,
        closeTime: trade.closeTime,
        status: trade.status,
      },
      update: {
        accountId,
        symbol: trade.symbol,
        volume: trade.volume,
        profitLoss: trade.profitLoss,
        fees: trade.fees,
        openTime: trade.openTime,
        closeTime: trade.closeTime,
        status: trade.status,
      },
    });

    return { record, created: !existing } as UpsertResult<typeof record>;
  }

  private async upsertMetrics(
    tx: Prisma.TransactionClient,
    metrics: Mt5TraderMetricsInput,
    traderId: string
  ) {
    const existing = await tx.mt5TraderMetrics.findUnique({
      where: { traderId },
    });

    const record = await tx.mt5TraderMetrics.upsert({
      where: { traderId },
      create: {
        traderId,
        profitFactor: metrics.profitFactor,
        winRate: metrics.winRate,
        drawdown: metrics.drawdown,
        totalTradingDays: metrics.totalTradingDays,
      },
      update: {
        profitFactor: metrics.profitFactor,
        winRate: metrics.winRate,
        drawdown: metrics.drawdown,
        totalTradingDays: metrics.totalTradingDays,
      },
    });

    return { record, created: !existing } as UpsertResult<typeof record>;
  }

  private async resolveAccountId(
    tx: Prisma.TransactionClient,
    accountExternalId: string,
    cache: Map<string, string>
  ): Promise<string | null> {
    const cached = cache.get(accountExternalId);
    if (cached) {
      return cached;
    }

    const existing = await tx.mt5TradingAccount.findUnique({
      where: { externalId: accountExternalId },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    cache.set(accountExternalId, existing.id);
    return existing.id;
  }
}
