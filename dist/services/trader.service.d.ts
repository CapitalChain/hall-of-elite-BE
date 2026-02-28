import { TraderProfile } from "../types";
export declare class TraderService {
    getAllTraders(filters: {
        page?: number;
        limit?: number;
        tier?: string;
    }): Promise<never[]>;
    getTraderById(id: string): Promise<null>;
    getTraderMetrics(traderId: string): Promise<null>;
    /**
     * Get trader profile from current DB tables only: mt5_traders, mt5_trader_scores, mt5_trader_metrics.
     * id = mt5_traders.id (UUID).
     */
    getTraderProfile(id: string): Promise<TraderProfile | null>;
}
//# sourceMappingURL=trader.service.d.ts.map