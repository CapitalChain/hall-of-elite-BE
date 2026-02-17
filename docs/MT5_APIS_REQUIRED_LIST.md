# MT5 APIs Required – Complete List

This document lists **all MT5 APIs (or data) the Hall of Elite backend requires**, based on the existing functionality in the codebase.

---

## Integration model

The app is designed for a **pull model**: your backend calls an **MT5 bridge/API** (HTTP). The bridge connects to MT5 (Manager API or plugin) and exposes REST endpoints. Alternatively, you can use a **push model** (MT5 sends data to your app); the **data shapes** below apply in both cases.

---

## 1. List of required APIs (summary)

| # | API / capability | Purpose | Required? |
|---|------------------|--------|-----------|
| 1 | **Authentication (Connect)** | Login to MT5 service; get token for subsequent calls | **Yes** |
| 2 | **Disconnect (Logout)** | Invalidate token/session | Optional |
| 3 | **Accounts** | List all trading accounts (for sync + UI) | **Yes** |
| 4 | **Trades (per account)** | List trades for an account, with optional date range | **Yes** |
| 5 | **Connection status** | Check if connected and which server | Optional (for UI) |
| 6 | **Trader/user list** | For DB sync: map accounts to traders (can be derived from accounts) | **Yes** (or derived from accounts) |
| 7 | **Pre-aggregated metrics** | profitFactor, winRate, drawdown, totalTradingDays per trader | **Optional** (app can derive from trades) |

---

## 2. API details and data shapes

### 2.1 Authentication (Connect)

**Purpose:** Establish session with MT5 bridge; obtain token for all other calls.

**What the app does:**  
- `POST /mt5/connect` → calls `MT5Client.connect()` → `authenticate()`.
- Sends: `server`, `login`, `password` (from env: `MT5_SERVER`, `MT5_LOGIN`, `MT5_PASSWORD`).
- Optional: `MT5_API_URL`, `MT5_API_KEY` for HTTP API auth.

**Required from MT5 bridge:**

| Item | Description |
|------|--------------|
| **Endpoint** | e.g. `POST /auth` or `POST /connect` |
| **Request body** | `{ "server": string, "login": string, "password": string }` |
| **Response** | Token or session id, e.g. `{ "token": "..." }` |
| **Usage** | App sends `Authorization: Bearer <token>` on every subsequent request |

**Where used in app:**  
- `src/modules/mt5/mt5.client.ts` – `authenticate()`, `connect()`, `ensureConnected()`.

---

### 2.2 Disconnect (Logout)

**Purpose:** Invalidate token when user disconnects.

**What the app does:**  
- `POST /mt5/disconnect` → `MT5Client.disconnect()`.
- Clears local state; optional call to bridge logout.

**Required from MT5 bridge (optional):**

| Item | Description |
|------|--------------|
| **Endpoint** | e.g. `POST /auth/logout` or `POST /disconnect` |
| **Headers** | `Authorization: Bearer <token>` |

**Where used in app:**  
- `src/modules/mt5/mt5.client.ts` – `disconnect()` (TODO: uncomment actual API call when bridge is ready).

---

### 2.3 Accounts API

**Purpose:** List all trading accounts for display (`GET /mt5/accounts`) and for syncing to DB (traders/accounts).

**What the app does:**  
- `GET /mt5/accounts` → `MT5Service.getAccounts()` → `MT5Client.fetchAccounts()`.
- Normalizes and validates; returns array of `MT5AccountDTO`.

**Required from MT5 bridge:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accountId` | string | Yes | Unique account id (e.g. login as string). |
| `accountNumber` | string | Yes | Account number / login. |
| `broker` | string | Yes | Broker name. |
| `balance` | number | Yes | Account balance. |
| `equity` | number | Yes | Equity. |
| `margin` | number | Yes | Margin used. |
| `freeMargin` | number | Yes | Free margin (can be derived: equity - margin). |
| `marginLevel` | number | Yes | Margin level % (can be derived: margin > 0 ? (equity/margin)*100 : 0). |
| `currency` | string | Yes | e.g. `"USD"`. |
| `leverage` | number | Yes | e.g. 100, 200. |
| `server` | string | Yes | MT5 server name. |
| `isActive` | boolean | Yes | Whether the account is active. |
| `createdAt` | date/string | Yes | Account creation / first seen. |

**Endpoint:**  
- `GET /accounts` (or your bridge path), with `Authorization: Bearer <token>`.

**Where used in app:**  
- `src/modules/mt5/mt5.client.ts` – `fetchAccounts()`  
- `src/modules/mt5/mt5.service.ts` – `getAccounts()`, `normalizeAccount()`  
- `src/modules/mt5/mt5.dto.ts` – `MT5AccountDTO`

---

### 2.4 Trades API (per account)

**Purpose:** Fetch trades for a given account; used for `GET /mt5/trades/:accountId`, scoring, analytics, and payout.

**What the app does:**  
- `GET /mt5/trades/:accountId?startDate=...&endDate=...` → `MT5Service.getTrades(accountId, startDate, endDate)` → `MT5Client.fetchTrades()`.
- Closed trades feed: scoring, leaderboard, trade analytics (`GET /user/analytics`), payout calculation.

**Required from MT5 bridge:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ticket` | string | Yes | Deal/ticket id. |
| `accountId` | string | Yes | Same as account id in accounts list. |
| `symbol` | string | Yes | e.g. `"EURUSD"`. |
| `type` | string | Yes | `"BUY"` or `"SELL"`. |
| `volume` | number | Yes | Lot size. |
| `openPrice` | number | Yes | Open price. |
| `closePrice` | number | No | For closed deals. |
| `currentPrice` | number | Yes | Current price (open) or close price (closed). |
| `profit` | number | No | Profit/loss. |
| `swap` | number | No | Swap; default 0. |
| `commission` | number | No | Commission; default 0. |
| `openTime` | date | Yes | Open time (ISO string or ms). |
| `closeTime` | date | No | Close time for closed deals. |
| `comment` | string | No | Comment. |
| `isOpen` | boolean | Yes | true if position still open. |

**Endpoint:**  
- `GET /trades?accountId=...&startDate=...&endDate=...` or `GET /accounts/:accountId/trades` with optional query params, and `Authorization: Bearer <token>`.

**Where used in app:**  
- `src/modules/mt5/mt5.client.ts` – `fetchTrades()`  
- `src/modules/mt5/mt5.service.ts` – `getTrades()`, `normalizeTrade()`  
- `src/modules/mt5/mt5.dto.ts` – `MT5TradeDTO`  
- Scoring: `ScoringService.fetchClosedTrades()` (from DB after sync)  
- Progress/analytics: `analytics.datasource.prisma.ts` → `Mt5Trade` (closed trades)  
- Payout: `payout.service.ts` – `getTradeStatsForTrader()`, `calculatePayoutFromTrades()` (from DB after sync)

---

### 2.5 Connection status

**Purpose:** Show connection state in UI.

**What the app does:**  
- `GET /mt5/status` → `MT5Service.getConnectionStatus()` → `MT5Client.getConnectionStatus()`.
- Returns `{ connected, server?, lastSync?, error? }`. Can be local-only or from bridge.

**Required from MT5 bridge (optional):**  
- `GET /status` returning e.g. `{ "connected": true, "server": "..." }` if you want status to reflect bridge state.

**Where used in app:**  
- `src/modules/mt5/mt5.client.ts` – `getConnectionStatus()`  
- `src/modules/mt5/mt5.dto.ts` – `MT5ConnectionStatusDTO`

---

### 2.6 Trader / user list (for DB sync)

**Purpose:** Persist traders and link accounts to traders. Required for scoring, leaderboard, progress, and payout (all use `Mt5Trader` / `Mt5TradingAccount`).

**Options:**  
1. **Derive from accounts** – unique users by login/accountNumber; one “trader” per login.  
2. **Separate endpoint** – e.g. `GET /traders` or `/users` with list of traders.

**Required shape per trader (for persistence):**

| Field | Type | Description |
|-------|------|-------------|
| `externalId` | string | e.g. login id (must match link to accounts). |
| `name` | string | Display name. |
| `accountStatus` | string | e.g. active, suspended. |

**Persistence layer:**  
- `src/modules/persistence/persistence.dto.ts` – `Mt5TraderInput`  
- `src/modules/persistence/persistence.service.ts` – `persistNormalizedPayload()`  
- `src/modules/persistence/persistence.repository.ts` – `upsertTrader()`

---

### 2.7 Pre-aggregated metrics (optional)

**Purpose:** Per-trader metrics for scoring and analytics. If not provided, the app **derives** them from closed trades.

**Required shape per trader (if provided):**

| Field | Type | Description |
|-------|------|-------------|
| `traderExternalId` | string | Links to trader. |
| `profitFactor` | number | ≥ 0. |
| `winRate` | number | 0–100 (or 0–1; app can normalise). |
| `drawdown` | number | 0–100 (max drawdown %). |
| `totalTradingDays` | number | Count of distinct days with at least one closed trade. |

**Where used in app:**  
- `src/modules/scoring/scoring.service.ts` – `computeMetrics()` (prefers stored metrics, else derives from trades)  
- `src/modules/progress/analytics.datasource.prisma.ts` – `getMetrics()` reads `Mt5TraderMetrics`  
- `src/modules/persistence/persistence.dto.ts` – `Mt5TraderMetricsInput`

---

## 3. How data flows in the app

| App feature | Data source | MT5 APIs / data needed |
|-------------|-------------|--------------------------|
| **MT5 connect/disconnect** | MT5 client | Auth, optional logout |
| **List accounts** | MT5 client → service | Accounts API |
| **List trades for account** | MT5 client → service | Trades API |
| **Connection status** | MT5 client | Optional status endpoint or local state |
| **Scoring & leaderboard** | DB (Mt5Trader, Mt5Trade, Mt5TraderMetrics, Mt5TraderScore) | Accounts + Trades (and optionally Traders + Metrics) → sync job or push writes to DB |
| **User progress** | DB + progress service | Same as above; user linked via TradingAccount.accountNumber ↔ Mt5TradingAccount.externalId |
| **User analytics** | DB via `ITradeAnalyticsDataSource` | Closed trades + metrics (from DB after sync) |
| **Payout calculation** | DB (Mt5Trade, Mt5TradingAccount) | Trades per account (after sync) |
| **Elite leaderboard / profiles** | Snapshots + DB (Mt5TraderScore, Mt5TraderMetrics) | All of the above so scoring and snapshots have data |

**Sync:** Today the app **does not** implement an automatic sync job. To populate the DB you can:  
1. Implement a **sync job** that calls your MT5 bridge (Accounts + Trades), normalises to `Mt5NormalizedPayload`, and calls `PersistenceService.persistNormalizedPayload()`.  
2. Or use a **push model**: your MT5 bridge POSTs the same payload shapes to your backend; backend persists with the same persistence layer.

---

## 4. Checklist – MT5 APIs you need to provide

- [ ] **Authentication** – endpoint that accepts `server`, `login`, `password` and returns a token (or session id).
- [ ] **Accounts** – endpoint that returns a list of accounts with: `accountId`, `accountNumber`, `broker`, `balance`, `equity`, `margin`, `freeMargin`, `marginLevel`, `currency`, `leverage`, `server`, `isActive`, `createdAt`.
- [ ] **Trades** – endpoint that returns trades for an account (and optional `startDate`/`endDate`) with: `ticket`, `accountId`, `symbol`, `type` (BUY/SELL), `volume`, `openPrice`, `closePrice`/`currentPrice`, `profit`, `swap`, `commission`, `openTime`, `closeTime`, `isOpen`.
- [ ] **Trader/user list** – either part of accounts (derive unique users by login) or separate endpoint: `externalId`, `name`, `accountStatus`.
- [ ] **(Optional)** **Disconnect** – endpoint to invalidate token.
- [ ] **(Optional)** **Status** – endpoint returning `{ connected, server }`.
- [ ] **(Optional)** **Pre-aggregated metrics** per trader: `profitFactor`, `winRate`, `drawdown`, `totalTradingDays`; otherwise the app derives them from closed trades.

---

## 5. App routes that depend on MT5 (reference)

| App route | Purpose | Uses from MT5 / DB |
|-----------|---------|---------------------|
| `GET /mt5/accounts` | List accounts | Accounts API or DB |
| `GET /mt5/trades/:accountId` | Trades for account | Trades API or DB |
| `GET /mt5/status` | Connection status | Bridge status or local |
| `POST /mt5/connect` | Connect to MT5 | Auth endpoint |
| `POST /mt5/disconnect` | Disconnect | Logout (optional) |
| Scoring / leaderboard / analytics / payout | Scores, tiers, ranks, charts, payout | DB: Mt5Trader, Mt5TradingAccount, Mt5Trade, Mt5TraderMetrics, Mt5TraderScore (populated via sync or push from MT5 data) |

---

## 6. Related docs

- **MT5_API_REQUIREMENTS.md** – Same requirements with Option A (REST bridge) vs Option B (push).
- **TRADE_ANALYTICS_API.md** – Contract for `GET /user/analytics` and `ITradeAnalyticsDataSource` (metrics, payout, closed trades).
- **Persistence DTOs** – `src/modules/persistence/persistence.dto.ts` (Mt5TraderInput, Mt5AccountInput, Mt5TradeInput, Mt5TraderMetricsInput) for push/sync payload shapes.
