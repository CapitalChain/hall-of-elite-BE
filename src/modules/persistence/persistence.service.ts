import { prisma } from "./prisma/client";
import { PersistenceLogger } from "./logger";
import {
  Mt5AccountInput,
  Mt5NormalizedPayload,
  Mt5RawUser,
  Mt5TradeInput,
  Mt5TraderInput,
  Mt5TraderMetricsInput,
  PersistSummary,
  mt5RawUserSchema,
  mt5AccountSchema,
  mt5TraderSchema,
} from "./persistence.dto";
import { PersistenceRepository, TraderBundle } from "./persistence.repository";

const DEFAULT_CURRENCY = "USD";
const DEFAULT_LEVERAGE = 100;
const DEFAULT_STATUS = "UNKNOWN";

const sanitizeString = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeStatus = (status?: string | null): string => {
  const cleaned = sanitizeString(status);
  if (!cleaned) {
    return DEFAULT_STATUS;
  }
  return cleaned.toUpperCase();
};

const normalizeCurrency = (currency?: string | null): string => {
  const cleaned = sanitizeString(currency);
  return cleaned ? cleaned.toUpperCase() : DEFAULT_CURRENCY;
};

const normalizeLeverage = (leverage?: number | null): number => {
  if (typeof leverage !== "number" || !Number.isFinite(leverage) || leverage <= 0) {
    return DEFAULT_LEVERAGE;
  }
  return Math.round(leverage);
};

const normalizeBalance = (balance: number): number => {
  if (!Number.isFinite(balance)) {
    return 0;
  }
  return Math.round(balance * 100) / 100;
};

const normalizeLogin = (login: string | number): string => String(login).trim();

const buildSummary = (): PersistSummary => ({
  tradersInserted: 0,
  tradersUpdated: 0,
  accountsInserted: 0,
  accountsUpdated: 0,
  tradesInserted: 0,
  tradesUpdated: 0,
  metricsInserted: 0,
  metricsUpdated: 0,
  skippedRecords: 0,
});

export class PersistenceService {
  private readonly repository: PersistenceRepository;

  constructor(repository?: PersistenceRepository) {
    this.repository = repository ?? new PersistenceRepository(prisma);
  }

  normalizeMt5Users(rawUsers: unknown[]): { payload: Mt5NormalizedPayload; skipped: number } {
    const tradersByExternalId = new Map<string, Mt5TraderInput>();
    const accountsByExternalId = new Map<string, Mt5AccountInput>();
    let skipped = 0;

    for (const raw of rawUsers) {
      const parsed = mt5RawUserSchema.safeParse(raw);
      if (!parsed.success) {
        skipped += 1;
        continue;
      }

      const user = parsed.data as Mt5RawUser;
      const externalId = normalizeLogin(user.login);
      const name = sanitizeString(user.name) ?? `Trader ${externalId}`;
      const accountStatus = normalizeStatus(user.status);

      const traderCandidate = {
        externalId,
        name,
        accountStatus,
      };

      const traderValidated = mt5TraderSchema.safeParse(traderCandidate);
      if (!traderValidated.success) {
        skipped += 1;
        continue;
      }

      tradersByExternalId.set(externalId, traderValidated.data);

      const accountCandidate = {
        externalId,
        traderExternalId: externalId,
        balance: normalizeBalance(user.balance),
        leverage: normalizeLeverage(user.leverage ?? undefined),
        currency: normalizeCurrency(user.currency ?? undefined),
        status: accountStatus,
      };

      const accountValidated = mt5AccountSchema.safeParse(accountCandidate);
      if (!accountValidated.success) {
        skipped += 1;
        continue;
      }

      accountsByExternalId.set(externalId, accountValidated.data);
    }

    return {
      payload: {
        traders: Array.from(tradersByExternalId.values()),
        accounts: Array.from(accountsByExternalId.values()),
        trades: [],
        metrics: [],
      },
      skipped,
    };
  }

  async persistNormalizedPayload(payload: Mt5NormalizedPayload): Promise<PersistSummary> {
    const summary = buildSummary();

    const accountsByTrader = new Map<string, Mt5AccountInput[]>();
    for (const account of payload.accounts) {
      const list = accountsByTrader.get(account.traderExternalId) ?? [];
      list.push(account);
      accountsByTrader.set(account.traderExternalId, list);
    }

    const tradesByAccount = new Map<string, Mt5TradeInput[]>();
    for (const trade of payload.trades) {
      const list = tradesByAccount.get(trade.accountExternalId) ?? [];
      list.push(trade);
      tradesByAccount.set(trade.accountExternalId, list);
    }

    const metricsByTrader = new Map<string, Mt5TraderMetricsInput>();
    for (const metrics of payload.metrics) {
      metricsByTrader.set(metrics.traderExternalId, metrics);
    }

    for (const trader of payload.traders) {
      const accounts = accountsByTrader.get(trader.externalId) ?? [];
      const trades = accounts.flatMap((account) => tradesByAccount.get(account.externalId) ?? []);
      const metrics = metricsByTrader.get(trader.externalId);

      const bundle: TraderBundle = {
        trader,
        accounts,
        trades,
        metrics,
      };

      try {
        const counts = await this.repository.persistTraderBundle(bundle);
        summary.tradersInserted += counts.tradersInserted;
        summary.tradersUpdated += counts.tradersUpdated;
        summary.accountsInserted += counts.accountsInserted;
        summary.accountsUpdated += counts.accountsUpdated;
        summary.tradesInserted += counts.tradesInserted;
        summary.tradesUpdated += counts.tradesUpdated;
        summary.metricsInserted += counts.metricsInserted;
        summary.metricsUpdated += counts.metricsUpdated;
      } catch (error) {
        summary.skippedRecords += accounts.length + trades.length + (metrics ? 1 : 0) + 1;
        PersistenceLogger.error(
          "PERSISTENCE_SERVICE",
          "Failed to persist trader bundle",
          error as Error,
          { traderExternalId: trader.externalId }
        );
      }
    }

    return summary;
  }

  async persistFromRawUsers(rawUsers: unknown[]): Promise<PersistSummary> {
    PersistenceLogger.info("PERSISTENCE_SERVICE", "Normalizing MT5 user payload", {
      total: rawUsers.length,
    });

    const { payload, skipped } = this.normalizeMt5Users(rawUsers);
    const summary = await this.persistNormalizedPayload(payload);
    summary.skippedRecords += skipped;

    PersistenceLogger.info("PERSISTENCE_SERVICE", "MT5 persistence complete", {
      tradersInserted: summary.tradersInserted,
      tradersUpdated: summary.tradersUpdated,
      accountsInserted: summary.accountsInserted,
      accountsUpdated: summary.accountsUpdated,
      tradesInserted: summary.tradesInserted,
      tradesUpdated: summary.tradesUpdated,
      metricsInserted: summary.metricsInserted,
      metricsUpdated: summary.metricsUpdated,
      skippedRecords: summary.skippedRecords,
    });

    return summary;
  }
}
