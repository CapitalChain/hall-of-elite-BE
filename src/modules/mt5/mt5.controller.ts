/**
 * MT5 controller layer.
 * Created to expose MT5 endpoints and handle HTTP request/response flow.
 */
import { Request, Response, NextFunction } from "express";
import { MT5Service } from "./mt5.service";
import { MT5AccountDTO, MT5TradeDTO, MT5ConnectionStatusDTO } from "./mt5.dto";
import { MT5Logger } from "./mt5.logger";
import { AppError } from "../../middlewares/errorHandler";

const mt5Service = new MT5Service();

/**
 * Get all MT5 accounts
 */
export const getAccounts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    MT5Logger.info("MT5_CONTROLLER", "GET /mt5/accounts");

    const accounts = await mt5Service.getAccounts();

    res.json({
      success: true,
      data: accounts,
      metadata: {
        timestamp: new Date(),
        operation: "getAccounts",
        count: accounts.length,
      },
    });
  } catch (error) {
    MT5Logger.error("MT5_CONTROLLER", "Error in getAccounts", error as Error);
    next(error);
  }
};

/**
 * Get trades for a specific account
 */
export const getTrades = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accountId } = req.params;
    const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;
    const { startDate, endDate } = req.query;

    MT5Logger.info("MT5_CONTROLLER", `GET /mt5/trades/${accountIdStr}`, {
      accountId: accountIdStr,
      startDate,
      endDate,
    });

    // Parse date parameters if provided
    const startDateStr: string | undefined = Array.isArray(startDate)
      ? (startDate[0] as string)
      : typeof startDate === "string"
      ? startDate
      : undefined;
    const endDateStr: string | undefined = Array.isArray(endDate)
      ? (endDate[0] as string)
      : typeof endDate === "string"
      ? endDate
      : undefined;

    const startDateParsed = startDateStr
      ? new Date(startDateStr)
      : undefined;
    const endDateParsed = endDateStr ? new Date(endDateStr) : undefined;

    // Validate dates
    if (startDateParsed && isNaN(startDateParsed.getTime())) {
      throw new AppError("Invalid startDate format", 400, "INVALID_DATE");
    }

    if (endDateParsed && isNaN(endDateParsed.getTime())) {
      throw new AppError("Invalid endDate format", 400, "INVALID_DATE");
    }

    if (
      startDateParsed &&
      endDateParsed &&
      startDateParsed > endDateParsed
    ) {
      throw new AppError("startDate must be before endDate", 400, "INVALID_DATE_RANGE");
    }

    const trades = await mt5Service.getTrades(accountIdStr, startDateParsed, endDateParsed);

    res.json({
      success: true,
      data: trades,
      metadata: {
        timestamp: new Date(),
        operation: "getTrades",
        count: trades.length,
        accountId,
      },
    });
  } catch (error) {
    MT5Logger.error("MT5_CONTROLLER", "Error in getTrades", error as Error, {
      accountId: Array.isArray(req.params.accountId) ? req.params.accountId[0] : req.params.accountId,
    });
    next(error);
  }
};

/**
 * Get MT5 connection status
 */
export const getConnectionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    MT5Logger.info("MT5_CONTROLLER", "GET /mt5/status");

    const status = await mt5Service.getConnectionStatus();

    res.json({
      success: true,
      data: status,
      metadata: {
        timestamp: new Date(),
        operation: "getConnectionStatus",
      },
    });
  } catch (error) {
    MT5Logger.error("MT5_CONTROLLER", "Error in getConnectionStatus", error as Error);
    next(error);
  }
};

/**
 * Connect to MT5
 */
export const connect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    MT5Logger.info("MT5_CONTROLLER", "POST /mt5/connect");

    const status = await mt5Service.connect();

    if (!status.connected) {
      throw new AppError(
        status.error || "Failed to connect to MT5",
        503,
        "MT5_CONNECTION_FAILED"
      );
    }

    res.json({
      success: true,
      data: status,
      metadata: {
        timestamp: new Date(),
        operation: "connect",
      },
    });
  } catch (error) {
    MT5Logger.error("MT5_CONTROLLER", "Error in connect", error as Error);
    next(error);
  }
};

/**
 * Disconnect from MT5
 */
export const disconnect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    MT5Logger.info("MT5_CONTROLLER", "POST /mt5/disconnect");

    await mt5Service.disconnect();

    res.json({
      success: true,
      data: {
        message: "Disconnected from MT5 successfully",
      },
      metadata: {
        timestamp: new Date(),
        operation: "disconnect",
      },
    });
  } catch (error) {
    MT5Logger.error("MT5_CONTROLLER", "Error in disconnect", error as Error);
    next(error);
  }
};
