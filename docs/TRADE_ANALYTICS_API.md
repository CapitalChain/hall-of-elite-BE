# Trade Analytics API – Backend contract & MT5 integration

This document describes the **Trade analytics** backend API used by the dashboard charts and how to plug in MT5 when ready.

---

## 1. API contract

### `GET /user/analytics`

**Auth:** Required (Bearer token). Resolves `userId` from token.

**Query (optional):**

| Param | Type   | Description |
|-------|--------|-------------|
| `days` | number | Limit equity curve to last N days (e.g. `90`). Omit for all-time. |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "winRate": 62.5,
    "profitFactor": 1.85,
    "drawdown": 12.3,
    "totalTradingDays": 24,
    "payoutPercent": 80,
    "equityData": [
      { "date": "2026-01-19", "cumulativePnl": 0 },
      { "date": "2026-01-20", "cumulativePnl": 120.5 }
    ],
    "tradesThisWeek": 14,
    "tradesLastWeek": 11,
    "pathToNextTier": "Lower your daily average to reach 95% payout.",
    "recentTrades": [
      {
        "id": "uuid",
        "symbol": "EURUSD",
        "profitLoss": 50.2,
        "fees": 1.2,
        "closeTime": "2026-02-05T14:00:00.000Z",
        "netPnl": 49.0
      }
    ]
  }
}
```

**Field rules:**

| Field | Type | Chart | Notes |
|-------|------|--------|--------|
| `winRate` | number | Performance metrics | 0–100 (percentage). |
| `profitFactor` | number | Performance metrics | ≥ 0. |
| `drawdown` | number | Performance metrics | 0–100 (percentage). |
| `totalTradingDays` | number | Performance metrics | Count of distinct days with at least one closed trade. |
| `payoutPercent` | number \| null | Performance metrics | 30, 80, or 95; null if not calculated. |
| `equityData` | array | Cumulative P&L | `{ date: "YYYY-MM-DD", cumulativePnl: number }`, **oldest first**. |
| `tradesThisWeek` | number | Trades by week | Current ISO week (Mon–Sun). |
| `tradesLastWeek` | number | Trades by week | Previous ISO week. |
| `pathToNextTier` | string \| null | Optional copy | Human-readable hint for next payout tier. |
| `recentTrades` | array | Recent trades P&L | Last 10 closed trades, **newest first**; `netPnl = profitLoss - fees`. |

When the user has no linked MT5 trader or no data, the same JSON shape is returned with zeros and empty arrays.

---

## 2. Where data comes from today

- **User → trader:** `TradingAccount.accountNumber` ↔ `Mt5TradingAccount.externalId` → `traderId`.
- **Metrics:** `Mt5TraderMetrics` (winRate, profitFactor, drawdown, totalTradingDays).
- **Payout:** `TraderPayout` (payoutPercent, totalTradingDays, etc.).
- **Trades:** `Mt5Trade` for that trader’s accounts, `closeTime` not null, optionally filtered by `?days=`.

All of this is read through the **data source** (see below).

---

## 3. Data source abstraction (MT5-ready)

Analytics are built from an **`ITradeAnalyticsDataSource`** implementation. The rest of the pipeline (equity curve, week counts, response shape) is unchanged.

**Location:** `src/modules/progress/analytics.datasource.types.ts`

```ts
interface ITradeAnalyticsDataSource {
  getMetrics(traderId: string): Promise<TraderMetricsRow | null>;
  getPayout(traderId: string): Promise<TraderPayoutRow | null>;
  getClosedTrades(traderId: string, options?: { fromDate?: Date; toDate?: Date; limit?: number }): Promise<ClosedTradeRow[]>;
}
```

- **Current implementation:** `analytics.datasource.prisma.ts` (Prisma → Mt5TraderMetrics, TraderPayout, Mt5Trade).
- **MT5 integration:** Add e.g. `analytics.datasource.mt5.ts` that implements the same interface using your MT5 API/client, then switch the progress service to use it (or choose by config/env).

**Row types:**

- `TraderMetricsRow`: winRate (0–100), profitFactor, drawdown (0–100), totalTradingDays.
- `TraderPayoutRow`: payoutPercent, averageTradesPerDay, totalTradingDays.
- `ClosedTradeRow`: id, symbol, profitLoss, fees, closeTime (Date).

---

## 4. MT5 integration checklist

When MT5 is ready, ensure the following so the existing API and frontend stay unchanged:

- [ ] **Resolve user → MT5 account/trader**  
  Same logical link as today (e.g. account number or external id). If MT5 uses a different id, add a mapping layer so the backend still works with `traderId` (or equivalent).

- [ ] **Metrics (for Performance metrics chart)**  
  From MT5 or your scoring pipeline: `winRate` (0–100), `profitFactor`, `drawdown` (0–100), `totalTradingDays`. Implement `getMetrics(traderId)` to return these or null.

- [ ] **Payout (for Performance metrics chart)**  
  From your payout service (already uses formula: max trades per day / total days → 30/80/95%). Implement `getPayout(traderId)` or keep using DB if payout is still stored there.

- [ ] **Closed trades (for Cumulative P&L, Trades by week, Recent trades P&L)**  
  From MT5 history: list of closed deals with `id`, `symbol`, `profitLoss`, `fees`, `closeTime`. Implement `getClosedTrades(traderId, { fromDate?, toDate?, limit? })` with:
  - `fromDate`/`toDate`: used for `?days=` (equity window).
  - Return oldest-first for equity; the service will take the last 10 for `recentTrades` and reverse.

- [ ] **Date/time**  
  `closeTime` as a single `Date`; API responds with ISO strings. Use a consistent timezone (e.g. UTC).

- [ ] **Win rate scale**  
  Backend normalises to 0–100. If MT5 gives 0–1, the service can still normalise; otherwise return 0–100 from your MT5 adapter.

After implementing the interface, point the progress service to the MT5 data source (e.g. via env or config). No changes are required to the controller, route, or response shape.

---

## 5. Files reference

| File | Purpose |
|------|--------|
| `src/modules/progress/analytics.datasource.types.ts` | Data source interface and row types. |
| `src/modules/progress/analytics.datasource.prisma.ts` | Current Prisma implementation. |
| `src/modules/progress/progress.service.ts` | Builds analytics from data source; equity curve, week counts, recent trades. |
| `src/modules/progress/progress.controller.ts` | `GET /user/analytics`, optional `?days=`. |
| `src/modules/progress/progress.routes.ts` | Registers `GET /analytics` under `/user`. |
| `src/modules/progress/progress.types.ts` | `UserTradeAnalyticsResponse`, `EquityPoint`, `RecentTradeDto`. |

---

## 6. Summary

- **API:** `GET /user/analytics` (optional `?days=N`) returns a single JSON object that powers all four dashboard charts.
- **Backend is ready:** Data source is abstracted; current implementation uses Prisma/MT5 DB tables.
- **MT5 integration:** Implement `ITradeAnalyticsDataSource` with your MT5 client and swap it in; the rest of the backend and the frontend can stay as-is.
