# Hall of Elite – API & Formula Specification

> Based on Capital Chain documentation: funded traders on Master Accounts (Standard/Atomic) are auto-enrolled after KYC + Master Account contract. Login only (no signup).

---

## 1. Login Flow (Already Integrated)

### Frontend (`hall-of-elite-FE`)

- **Login page:** `app/login/page.tsx` – login form only (no signup link)
- **Auth providers:**
  - **Demo users:** `demo1@hallofelite.com`, `demo2@hallofelite.com` → internal `POST /auth/login`
  - **Capital Chain users:** `POST {NEXT_PUBLIC_AUTH_API_URL}/auth/login/` (Django REST Framework)
- **Token storage:** `localStorage` (`auth_token`, `auth_user`, `auth_provider`)
- **API client:** `lib/fetcher.ts` sends `Authorization: Token <token>` or `Bearer <token>`

### Backend (`hall-of-elite-BE`)

- **Auth routes:** `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- **Auth middleware:** Validates JWT (internal) or calls Capital Chain `GET /authentication/user/` (external)
- **Protected routes:** `GET /user/progress`, `GET /user/analytics` require auth

---

## 2. Sustainability Score Formula (Official)

```
Sustainability Score = 100 × (1 − (Biggest Profitable Day ÷ Total Profit for 14-Day Cycle))
```

- **Biggest Profitable Day:** Max daily profit (sum of profitable trades per calendar day) in the 14-day cycle
- **Total Profit:** Sum of all profits in the 14-day cycle
- **14-day cycle:** Fixed calendar windows (e.g. 1st–14th, 15th–28th/29th/30th/31st of month)

**Example:** $10,000 total profit, biggest day $2,000 →  
`100 × (1 − (2000 ÷ 10000)) = 80`

---

## 3. Reward Tiers (Payout %)

| Score Range | Payout % | Notes |
|-------------|----------|-------|
| 0–70 | 30% | Standard 14-day payout cycle |
| 71–85 | 80% | Standard 14-day payout cycle |
| 86–90 | 95% | Standard 14-day payout cycle |
| 91–100 | 95% | **On-demand payout** – can request payout anytime |

**Payout cycle:** Every 14 calendar days for scores below 91.

**Payout request:** When a trader requests payout on their master account, the sustainability score **resets to 0**.

---

## 4. Current vs Required Implementation

### Sustainability Score

| Aspect | Current | Required |
|--------|---------|----------|
| Formula | Weighted: profit factor (35%), win rate (25%), drawdown (25%), trading days (15%) | `100 × (1 − (Biggest Profitable Day ÷ Total Profit))` |
| Scope | All-time trades | **14-day cycle** |
| Location | `scoring.service.ts` | New `sustainability.service.ts` or update scoring |

### Payout Tiers

| Aspect | Current | Required |
|--------|---------|----------|
| Basis | `averageTradesPerDay = maxTradesPerDay / totalTradingDays` | **Sustainability score** |
| Tiers | BRONZE (30%), SILVER (80%), GOLD (95%) | 0–70 (30%), 71–85 (80%), 86–90 (95%), 91–100 (95% + on-demand) |
| Location | `payout.service.ts` | Update to use sustainability score |

---

## 5. Required APIs

### 5.1 Sustainability Score

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/sustainability/:traderId` | Yes | Current sustainability score for trader (current 14-day cycle) |
| GET | `/sustainability/:traderId/cycle` | Yes | Score + cycle dates (from, to) + breakdown (total profit, biggest day) |
| GET | `/sustainability/cycles` | Yes | List of 14-day cycles (for dropdown/history) |

**Response shape (example):**
```json
{
  "traderId": "uuid",
  "sustainabilityScore": 80,
  "cycleFrom": "2025-02-15",
  "cycleTo": "2025-02-28",
  "totalProfit": 10000,
  "biggestProfitableDay": 2000,
  "biggestProfitableDayDate": "2025-02-20",
  "payoutPercent": 80,
  "onDemandEligible": false
}
```

### 5.2 Payout (Updated)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/payout/tiers` | Yes | Payout tiers by sustainability score (0–70, 71–85, 86–90, 91–100) |
| GET | `/payout/:traderId` | Yes | Trader payout info (score, %, on-demand eligible, next cycle date) |
| POST | `/payout/request` | Yes | **New** – Request payout (resets sustainability to 0) |

### 5.3 Dashboard / Progress (Existing, may need updates)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/user/progress` | Yes | Dashboard progress – should include sustainability score |
| GET | `/user/analytics` | Yes | Trade analytics – should include cycle-aware stats |

---

## 6. Data Model Additions

### 14-Day Cycle

- Define cycle boundaries (e.g. `cycle_start`, `cycle_end` as dates)
- Store cycle-aware metrics per trader per cycle

### Sustainability Score

- `sustainability_score` (0–100) per trader per cycle
- `total_profit`, `biggest_profitable_day`, `biggest_profitable_day_date`
- `payout_percent`, `on_demand_eligible`

### Payout Request

- `PayoutRequest` model: `traderId`, `requestedAt`, `status` (pending/approved/paid/rejected), `amount`
- On request: set `sustainability_score = 0` for next cycle

---

## 7. Implementation Order

1. **14-day cycle logic** – Define cycle boundaries, helper to get current cycle
2. **Sustainability score calculation** – New service using official formula
3. **Update payout tiers** – Replace `averageTradesPerDay` with sustainability score
4. **`POST /payout/request`** – New endpoint, reset score on request
5. **Update `/user/progress` and `/user/analytics`** – Include sustainability + cycle info
6. **FE dashboard** – Display sustainability score, payout %, on-demand eligibility

---

## 8. References

- Capital Chain: "HALL-OF-ELITE, The New Era of Trading"
- Sustainability Score: `100 × (1 − (Biggest Profitable Day ÷ Total Profit for 14-Day Cycle))`
- Reward tiers: 0–70 (30%), 71–85 (80%), 86–90 (95%), 91–100 (95% + on-demand)
