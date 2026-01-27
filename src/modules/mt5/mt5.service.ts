/**
 * MT5 service layer.
 * Created to normalize, validate, and orchestrate MT5 client data.
 */
import { MT5Client } from "./mt5.client";
import { MT5AccountDTO, MT5TradeDTO, MT5ConnectionStatusDTO } from "./mt5.dto";
import { MT5Logger } from "./mt5.logger";
import { AppError } from "../../middlewares/errorHandler";

/**
 * MT5 Service
 * Business logic layer for MT5 operations
 * Handles data normalization, validation, and orchestration
 */
export class MT5Service {
  private client: MT5Client;

  constructor() {
    this.client = new MT5Client();
  }

  /**
   * Normalize and validate MT5 account data
   */
  private normalizeAccount(account: MT5AccountDTO): MT5AccountDTO {
    // Validate required fields
    if (!account.accountId || !account.accountNumber) {
      throw new AppError("Invalid account: missing required fields", 400, "INVALID_ACCOUNT");
    }

    // Ensure numeric fields are valid
    if (
      typeof account.balance !== "number" ||
      typeof account.equity !== "number" ||
      typeof account.margin !== "number"
    ) {
      throw new AppError("Invalid account: invalid numeric fields", 400, "INVALID_ACCOUNT");
    }

    // Normalize data
    return {
      ...account,
      accountId: account.accountId.trim(),
      accountNumber: account.accountNumber.trim(),
      broker: account.broker?.trim() || "Unknown",
      currency: account.currency?.toUpperCase() || "USD",
      balance: Math.round(account.balance * 100) / 100, // Round to 2 decimals
      equity: Math.round(account.equity * 100) / 100,
      margin: Math.round(account.margin * 100) / 100,
      freeMargin: Math.round((account.freeMargin || account.equity - account.margin) * 100) / 100,
      marginLevel: account.marginLevel || (account.margin > 0 ? (account.equity / account.margin) * 100 : 0),
      leverage: account.leverage || 100,
      isActive: account.isActive !== undefined ? account.isActive : true,
      createdAt: account.createdAt instanceof Date ? account.createdAt : new Date(account.createdAt),
    };
  }

  /**
   * Normalize and validate MT5 trade data
   */
  private normalizeTrade(trade: MT5TradeDTO, accountId: string): MT5TradeDTO {
    // Validate required fields
    if (!trade.ticket || !trade.symbol || !trade.type) {
      throw new AppError("Invalid trade: missing required fields", 400, "INVALID_TRADE");
    }

    // Validate trade type
    if (trade.type !== "BUY" && trade.type !== "SELL") {
      throw new AppError("Invalid trade: invalid type", 400, "INVALID_TRADE");
    }

    // Validate numeric fields
    if (
      typeof trade.volume !== "number" ||
      trade.volume <= 0 ||
      typeof trade.openPrice !== "number" ||
      trade.openPrice <= 0
    ) {
      throw new AppError("Invalid trade: invalid numeric fields", 400, "INVALID_TRADE");
    }

    // Validate timestamps
    const openTime = trade.openTime instanceof Date ? trade.openTime : new Date(trade.openTime);
    if (isNaN(openTime.getTime())) {
      throw new AppError("Invalid trade: invalid open time", 400, "INVALID_TRADE");
    }

    const closeTime = trade.closeTime
      ? trade.closeTime instanceof Date
        ? trade.closeTime
        : new Date(trade.closeTime)
      : undefined;

    if (closeTime && isNaN(closeTime.getTime())) {
      throw new AppError("Invalid trade: invalid close time", 400, "INVALID_TRADE");
    }

    // Determine if trade is open
    const isOpen = trade.isOpen !== undefined ? trade.isOpen : !closeTime;

    // Normalize data
    return {
      ...trade,
      ticket: trade.ticket.toString().trim(),
      accountId: accountId,
      symbol: trade.symbol.toUpperCase().trim(),
      type: trade.type,
      volume: Math.round(trade.volume * 10000) / 10000, // Round to 4 decimals (lot size)
      openPrice: Math.round(trade.openPrice * 100000) / 100000, // Round to 5 decimals (price precision)
      closePrice: trade.closePrice
        ? Math.round(trade.closePrice * 100000) / 100000
        : undefined,
      currentPrice: trade.currentPrice
        ? Math.round(trade.currentPrice * 100000) / 100000
        : trade.openPrice,
      profit: trade.profit !== undefined ? Math.round(trade.profit * 100) / 100 : undefined,
      swap: trade.swap !== undefined ? Math.round(trade.swap * 100) / 100 : 0,
      commission: trade.commission !== undefined ? Math.round(trade.commission * 100) / 100 : 0,
      openTime,
      closeTime,
      comment: trade.comment?.trim(),
      isOpen,
    };
  }

  /**
   * Get all trader accounts
   */
  async getAccounts(): Promise<MT5AccountDTO[]> {
    try {
      MT5Logger.info("MT5_SERVICE", "Fetching accounts");

      const accounts = await this.client.fetchAccounts();

      // Normalize and validate all accounts
      const normalizedAccounts: MT5AccountDTO[] = [];
      const errors: string[] = [];

      for (const account of accounts) {
        try {
          const normalized = this.normalizeAccount(account);
          normalizedAccounts.push(normalized);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push(`Account ${account.accountId}: ${errorMsg}`);
          MT5Logger.warn("MT5_SERVICE", "Failed to normalize account", {
            accountId: account.accountId,
            error: errorMsg,
          });
        }
      }

      if (normalizedAccounts.length === 0 && accounts.length > 0) {
        throw new AppError(
          "All accounts failed validation",
          500,
          "ACCOUNT_VALIDATION_ERROR"
        );
      }

      if (errors.length > 0) {
        MT5Logger.warn("MT5_SERVICE", "Some accounts failed normalization", {
          total: accounts.length,
          valid: normalizedAccounts.length,
          errors: errors.length,
        });
      }

      MT5Logger.info("MT5_SERVICE", `Successfully normalized ${normalizedAccounts.length} accounts`, {
        total: accounts.length,
        valid: normalizedAccounts.length,
      });

      return normalizedAccounts;
    } catch (error) {
      MT5Logger.error("MT5_SERVICE", "Error fetching accounts", error as Error);
      throw error;
    }
  }

  /**
   * Get trades for a specific account
   */
  async getTrades(
    accountId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<MT5TradeDTO[]> {
    try {
      if (!accountId || accountId.trim().length === 0) {
        throw new AppError("Account ID is required", 400, "INVALID_ACCOUNT_ID");
      }

      MT5Logger.info("MT5_SERVICE", `Fetching trades for account: ${accountId}`, {
        accountId,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      });

      const trades = await this.client.fetchTrades(accountId, startDate, endDate);

      // Normalize and validate all trades
      const normalizedTrades: MT5TradeDTO[] = [];
      const errors: string[] = [];

      for (const trade of trades) {
        try {
          const normalized = this.normalizeTrade(trade, accountId);
          normalizedTrades.push(normalized);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push(`Trade ${trade.ticket}: ${errorMsg}`);
          MT5Logger.warn("MT5_SERVICE", "Failed to normalize trade", {
            ticket: trade.ticket,
            accountId,
            error: errorMsg,
          });
        }
      }

      if (errors.length > 0) {
        MT5Logger.warn("MT5_SERVICE", "Some trades failed normalization", {
          accountId,
          total: trades.length,
          valid: normalizedTrades.length,
          errors: errors.length,
        });
      }

      MT5Logger.info("MT5_SERVICE", `Successfully normalized ${normalizedTrades.length} trades`, {
        accountId,
        total: trades.length,
        valid: normalizedTrades.length,
      });

      return normalizedTrades;
    } catch (error) {
      MT5Logger.error("MT5_SERVICE", `Error fetching trades for account ${accountId}`, error as Error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(): Promise<MT5ConnectionStatusDTO> {
    try {
      return this.client.getConnectionStatus();
    } catch (error) {
      MT5Logger.error("MT5_SERVICE", "Error getting connection status", error as Error);
      throw error;
    }
  }

  /**
   * Connect to MT5
   */
  async connect(): Promise<MT5ConnectionStatusDTO> {
    try {
      MT5Logger.info("MT5_SERVICE", "Connecting to MT5");
      const status = await this.client.connect();
      return status;
    } catch (error) {
      MT5Logger.error("MT5_SERVICE", "Error connecting to MT5", error as Error);
      throw error;
    }
  }

  /**
   * Disconnect from MT5
   */
  async disconnect(): Promise<void> {
    try {
      MT5Logger.info("MT5_SERVICE", "Disconnecting from MT5");
      await this.client.disconnect();
    } catch (error) {
      MT5Logger.error("MT5_SERVICE", "Error disconnecting from MT5", error as Error);
      throw error;
    }
  }
}
