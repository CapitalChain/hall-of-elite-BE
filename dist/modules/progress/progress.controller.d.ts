import { Request, Response, NextFunction } from "express";
/** GET /user/progress – progress for the resolved MT5 account. Optional ?traderId= or X-Selected-Trader-Id to pick which account. */
export declare function getUserProgress(req: Request, res: Response, _next: NextFunction): Promise<void>;
/** GET /user/analytics – analytics for the resolved MT5 account. Optional ?traderId= or X-Selected-Trader-Id to pick which account. */
export declare function getUserTradeAnalytics(req: Request, res: Response, next: NextFunction): Promise<void>;
/** GET /user/traders – list MT5 accounts (logins) linked to the current Capital Chain user. Returns [] if table missing or error. */
export declare function getLinkedTraders(req: Request, res: Response, next: NextFunction): Promise<void>;
/** POST /user/traders – link an MT5 account (by ID) to current user. Body: { mt5TraderId, displayLabel? }. */
export declare function postLinkTrader(req: Request, res: Response, next: NextFunction): Promise<void>;
/** PATCH /user/traders/:traderId/primary – set this linked MT5 account as primary for the user. */
export declare function patchSetPrimaryTrader(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=progress.controller.d.ts.map