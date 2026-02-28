import { Request, Response, NextFunction } from "express";
/** Elite list from cc-conclave only (mt5_traders + mt5_trader_scores). No mock data. */
export declare const getAllTraders: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/** Trader profile: CC Conclave (accounts + deals) by login first, else mt5_traders + scores + metrics. 404 when not found. */
export declare const getTraderById: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=trader.controller.d.ts.map