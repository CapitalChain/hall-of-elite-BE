/**
 * MT5 data transfer objects.
 * Created to define MT5 request/response contracts and types.
 */

export interface MT5AccountDTO {
  accountId: string;
  accountNumber: string;
  broker: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  currency: string;
  leverage: number;
  server: string;
  isActive: boolean;
  createdAt: Date;
}

export interface MT5TradeDTO {
  ticket: string;
  accountId: string;
  symbol: string;
  type: "BUY" | "SELL";
  volume: number;
  openPrice: number;
  closePrice?: number;
  currentPrice: number;
  profit?: number;
  swap: number;
  commission: number;
  openTime: Date;
  closeTime?: Date;
  comment?: string;
  isOpen: boolean;
}

export interface MT5ConnectionStatusDTO {
  connected: boolean;
  server?: string;
  lastSync?: Date;
  error?: string;
}

export interface MT5FetchTradesParams {
  accountId: string;
  startDate?: Date;
  endDate?: Date;
}

export interface MT5ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export interface MT5SuccessResponse<T> {
  success: true;
  data: T;
  metadata?: {
    timestamp: Date;
    operation: string;
    count?: number;
  };
}

export type MT5Response<T> = MT5SuccessResponse<T> | MT5ErrorResponse;
