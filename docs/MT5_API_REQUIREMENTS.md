# MT5 API Requirements for Hall of Elite

This document describes **what APIs or data you need from MT5** so the Hall of Elite app can connect, sync traders/accounts/trades, run scoring, and show the elite leaderboard.

---

## Two ways to integrate MT5

1. **Pull model (recommended for MVP)**  
   Your app **calls** an MT5 bridge/API (HTTP). The bridge sits between MT5 and the app: it connects to MT5 (Manager API, or a plugin that reads from MT5) and exposes REST endpoints. The app uses these to **fetch** accounts and trades.

2. **Push model**  
   An MT5-side service (Expert Advisor, Manager API script, or bridge) **sends** data to your app (e.g. webhooks or REST POST to your backend). The app then normalizes and persists it.

The codebase is set up for the **pull model** (app calls MT5 API). The sections below describe what that API must provide. If you use a push model instead, the **data shapes** are the same; only the direction of calls changes.

---

## 1. Connection & authentication

The app expects to **connect** to an MT5 service using credentials, then use a token (or session) for subsequent calls.

| Purpose        | What you need to provide |
|----------------|---------------------------|
| **Connect**    | A way to authenticate (e.g. `POST /auth` or `POST /connect`) with: `server`, `login`, `password`. Optional: `apiUrl`, `apiKey` for HTTP API auth. |
| **Response**   | A token or session id the app can send in `Authorization: Bearer <token>` (or equivalent) on every request. |
| **Disconnect** | Optional: endpoint to invalidate the token/session (e.g. `POST /auth/logout` or `POST /disconnect`). |

**App env vars (for pull model):**

- `MT5_SERVER` – MT5 server name (e.g. `YourBroker-Live`).
- `MT5_LOGIN` – Manager/API login.
- `MT5_PASSWORD` – Password.
- `MT5_API_URL` – Base URL of your **MT5 bridge/API** (e.g. `https://mt5-bridge.yourdomain.com`).
- `MT5_API_KEY` – Optional API key if your bridge uses key-based auth.

So from MT5 side you need: **an auth endpoint** that accepts server + login + password and returns a token (or equivalent) the app will send on each request.

---

## 2. Accounts API (list of trading accounts)

The app calls something like: **GET /accounts** (or the path your bridge uses).

**Response:** array of account objects. Each object should support at least:

| Field          | Type    | Required | Description |
|----------------|---------|----------|-------------|
| `accountId`    | string  | Yes      | Unique account id (can be login number as string). |
| `accountNumber`| string  | Yes      | Account number / login. |
| `broker`       | string  | Yes      | Broker name. |
| `balance`      | number  | Yes      | Account balance. |
| `equity`       | number  | Yes      | Equity. |
| `margin`       | number  | Yes      | Margin used. |
| `freeMargin`   | number  | Yes      | Free margin (can be derived: equity - margin). |
| `marginLevel`  | number  | Yes      | Margin level % (can be derived: margin > 0 ? (equity/margin)*100 : 0). |
| `currency`     | string  | Yes      | e.g. `"USD"`. |
| `leverage`     | number  | Yes      | e.g. 100, 200. |
| `server`       | string  | Yes      | MT5 server name. |
| `isActive`     | boolean | Yes      | Whether the account is active. |
| `createdAt`    | date/string | Yes   | Account creation / first seen. |

These map to **MT5AccountDTO** in the app. Your MT5 bridge can map Manager API / terminal fields to these names.

---

## 3. Trades API (trades per account)

The app calls something like: **GET /trades?accountId=...&startDate=...&endDate=...** (or **GET /accounts/:accountId/trades** with optional query params).

**Response:** array of trade objects. Each object should support at least:

| Field         | Type    | Required | Description |
|---------------|---------|----------|-------------|
| `ticket`      | string  | Yes      | Deal/ticket id. |
| `accountId`   | string  | Yes      | Same as the account id used in accounts list. |
| `symbol`      | string  | Yes      | e.g. `"EURUSD"`. |
| `type`        | string  | Yes      | `"BUY"` or `"SELL"`. |
| `volume`      | number  | Yes      | Lot size. |
| `openPrice`    | number  | Yes      | Open price. |
| `closePrice`  | number  | No       | For closed deals. |
| `currentPrice`| number  | Yes      | Current price (for open) or close price (for closed). |
| `profit`      | number  | No       | Profit/loss. |
| `swap`        | number  | No       | Swap; default 0. |
| `commission`  | number  | No       | Commission; default 0. |
| `openTime`    | date    | Yes      | Open time (ISO string or ms). |
| `closeTime`   | date    | No       | Close time for closed deals. |
| `comment`     | string  | No       | Comment. |
| `isOpen`      | boolean | Yes      | true if position is still open. |

These map to **MT5TradeDTO** in the app. The app uses **closed** trades for scoring (profit/loss, fees, close time).

---

## 4. Data used for scoring and leaderboard (database)

The **scoring pipeline** and **elite leaderboard** read from the app’s database. Data gets there either by:

- The app **pulling** from your MT5 API (accounts + trades), then a **sync job** that normalizes and writes to `Mt5Trader`, `Mt5TradingAccount`, `Mt5Trade`, and optionally `Mt5TraderMetrics`, or  
- Your MT5 side **pushing** the same shapes into the app (e.g. POST to your backend).

Required concepts:

| Entity   | What you need to provide (conceptually) |
|----------|------------------------------------------|
| **Trader** | One per MT5 user/login: `externalId` (e.g. login id), `name`, `accountStatus`. |
| **Account**| Per MT5 account: `externalId`, **trader** (link by same external id or trader id), `balance`, `leverage`, `currency`, `status`. |
| **Trade** | Per deal: `externalId`, `accountId`, `symbol`, `volume`, `profitLoss`, `fees`, `openTime`, `closeTime` (if closed), `status`. |
| **Metrics** (optional) | Per trader: `profitFactor`, `winRate`, `drawdown`, `totalTradingDays`. If you don’t provide these, the app can **derive** them from closed trades. |

So from MT5 you need to **expose or send**:

- **Traders** – list of users (login, name, status).
- **Accounts** – list of accounts with balance, leverage, currency, status, and which trader they belong to.
- **Trades** – list of deals with symbol, volume, P/L, fees, open/close time, status.
- **Metrics** (optional) – pre-aggregated per-trader metrics; otherwise the app computes them from trades.

---

## 5. Summary: what to build on the MT5 side

**Option A – REST bridge (pull; matches current app design)**

1. **Auth**  
   - `POST /auth` (or `/connect`)  
   - Body: `{ "server": "...", "login": "...", "password": "..." }`  
   - Response: `{ "token": "..." }` (or similar).  
   - Optional: `POST /auth/logout` or `/disconnect` to invalidate.

2. **Accounts**  
   - `GET /accounts`  
   - Headers: `Authorization: Bearer <token>`  
   - Response: array of account objects matching the **Accounts API** table above.

3. **Trades**  
   - `GET /trades?accountId=...&startDate=...&endDate=...` (or `GET /accounts/:accountId/trades`)  
   - Headers: `Authorization: Bearer <token>`  
   - Response: array of trade objects matching the **Trades API** table above.

4. **Connection status** (optional)  
   - `GET /status` returning e.g. `{ "connected": true, "server": "..." }`.

Then in the app you set `MT5_API_URL` to this bridge’s base URL and wire the existing **MT5 client** (in code) to call these paths and map responses to **MT5AccountDTO** and **MT5TradeDTO**. A **sync job** (or existing persistence layer) should then write to the DB so scoring and leaderboard use real data.

**Option B – Push (webhook / POST to app)**

- Implement a service (e.g. MT5 Manager API script or a bridge) that:
  - Periodically (or on event) sends **traders**, **accounts**, **trades**, and optionally **metrics** to your backend.
- Use the same **field names and types** as in the **Persistence** DTOs (`Mt5TraderInput`, `Mt5AccountInput`, `Mt5TradeInput`, `Mt5TraderMetricsInput`) so the app’s persistence layer can normalize and save without change.

---

## 6. App endpoints that use MT5 (for reference)

| App route            | Purpose              | Uses from MT5 / DB        |
|----------------------|----------------------|----------------------------|
| `GET /mt5/accounts`  | List accounts        | Accounts API or DB        |
| `GET /mt5/trades/:accountId` | Trades for account | Trades API or DB        |
| `GET /mt5/status`    | Connection status    | Your bridge status        |
| `POST /mt5/connect`  | Connect to MT5       | Your auth endpoint        |
| `POST /mt5/disconnect` | Disconnect         | Your logout (optional)    |
| Scoring / leaderboard | Scores, tiers, ranks | DB: Mt5Trader, Mt5Trade, Mt5TraderScore, etc. |

---

## 7. Checklist for MT5 API you need to generate

- [ ] **Authentication** – endpoint that accepts server + login + password and returns a token (or session id).
- [ ] **Accounts** – endpoint that returns a list of accounts with: accountId, accountNumber, broker, balance, equity, margin, freeMargin, marginLevel, currency, leverage, server, isActive, createdAt.
- [ ] **Trades** – endpoint that returns trades for an account (and optional date range) with: ticket, accountId, symbol, type (BUY/SELL), volume, openPrice, closePrice/currentPrice, profit, swap, commission, openTime, closeTime, isOpen.
- [ ] **Trader/user list** (for DB sync) – either part of accounts (e.g. unique users by login) or a separate endpoint: externalId, name, accountStatus.
- [ ] **(Optional)** Pre-aggregated **metrics** per trader: profitFactor, winRate, drawdown, totalTradingDays; otherwise the app will derive them from closed trades.

Once these are available (as REST endpoints or as push payloads), the app can be wired to use them (and the existing MT5 client/persistence code adapted to your exact paths and response format if needed).
