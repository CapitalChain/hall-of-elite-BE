import { Request, Response } from "express";
/** GET /auth/me – use token payload only (no User table). Capital Chain users have id, email, role from token. */
export declare const getMe: (req: Request, res: Response) => Promise<void>;
export declare const register: (req: Request, res: Response) => Promise<void>;
export declare const login: (req: Request, res: Response) => Promise<void>;
export declare const logout: (req: Request, res: Response) => Promise<void>;
/** POST /auth/store-token: Store Capital Chain token in DB; send token in Authorization. Body: { mt5TraderId? }. Returns bypassToken for URL login. */
export declare const storeToken: (req: Request, res: Response) => Promise<void>;
/** GET /auth/bypass/:bypassToken: Return stored token for bypass URL login (no auth required). */
export declare const getBypass: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map