# FUTURE SCANNER — Phase 1 Architecture

## 1. Purpose

FUTURE SCANNER is a professional web-based NIFTY F&O scanner derived from the Prime Technical Professional Trading Course supplied by the user.

Version 1 is a scanner, analysis and alert system. It must not automatically place broker orders.

The architecture must preserve the source decision hierarchy:

CONTEXT → LOCATION → STRUCTURE → SETUP → PRICE CONFIRMATION → VOLUME → EMA → MARKET CONTEXT → EVENTS → RISK → TRIGGER → MANAGEMENT

Price action is primary. Indicators are supporting evidence and cannot independently create a trade signal.

## 2. System architecture

```text
Browser / Next.js UI
  ├─ Dashboard
  ├─ Scanner
  ├─ Signals
  ├─ Chart
  ├─ Watchlist
  ├─ Backtest
  ├─ Journal
  ├─ Daily Review
  └─ Settings
          │
          ▼
Next.js server/API layer
  ├─ Auth boundary
  ├─ Market API
  ├─ Scanner API
  ├─ Signal API
  ├─ Watchlist API
  ├─ Backtest API
  └─ Health API
          │
          ├───────────────┐
          ▼               ▼
MarketDataProvider   PostgreSQL / Prisma
  └─ Upstox adapter
          │
          ▼
Scanner domain layer
  ├─ YH/YL
  ├─ Structure
  ├─ EMA
  ├─ Volume
  ├─ Fake Breakout
  ├─ Master Candle
  ├─ Gap
  ├─ Market Context
  ├─ Event Filter
  ├─ Time Filter
  ├─ Confluence / Ranking
  └─ Risk / Position Sizing
          │
          ▼
Explainable Signal + audit snapshot
          │
          ▼
SSE/WebSocket-compatible realtime delivery
```

## 3. Domain modules

### Market data

`MarketDataProvider` is broker-neutral and exposes:

- getQuotes()
- getOHLC()
- getHistoricalData()
- getVolume()
- getInstrumentMaster()
- getMarketStatus()

`UpstoxMarketDataProvider` implements the adapter. Broker credentials stay on the server.

### Context and indicators

- Previous Day High (YH)
- Previous Day Low (YL)
- Swing highs/lows
- HH/HL/LH/LL
- Break of structure / failed break
- EMA 10
- EMA 20
- EMA slope/alignment
- Current vs average volume
- Relative volume
- ATR for configurable risk methods
- NIFTY market context
- Exchange-time session filter

### Setup modules

Each setup is independent and returns a common setup contract.

```text
setupType
direction
level
trigger
invalidation
stop
target
confidence
volumeState
emaState
timestamp
```

Required setup modules:

1. Fake Breakout
2. Master Candle
3. Gap

Where the course material does not specify a numerical threshold, the implementation must expose a configurable parameter and label it as a configurable/source-threshold-required assumption rather than presenting it as an official source rule.

### Rule engine

Each evaluated rule returns:

```text
RuleResult {
  ruleName
  category
  passed
  value
  threshold
  message
}
```

Rules are visible in signal details and are persisted for auditability.

### Signal lifecycle

```text
WAIT
WATCHLIST
SETUP DETECTED
CONFIRMATION PENDING
QUALIFIED BUY
QUALIFIED SELL
EVENT RISK
INVALIDATED
TRIGGERED
STOPPED
TARGET HIT
EXPIRED
```

Data-quality failures override qualification and prevent new qualified signals.

### Risk engine

For qualified candidates calculate:

- Entry
- Invalidation
- Stop
- Target
- Risk per unit
- Reward/Risk
- Position size
- Estimated brokerage, fees and slippage

Support configurable ATR and structure stops, configurable R:R, per-trade risk, daily loss limit, max trades and correlated-position limits.

## 4. Database tables

Initial tables:

- users
- settings
- instruments
- market_data
- signals
- signal_events
- trades
- journal
- watchlists
- alerts
- backtest_runs
- daily_stats
- event_calendar

Audit-critical records must retain the market-data snapshot and rule evaluations necessary to reproduce the decision.

## 5. API surface

```text
GET  /api/health
GET  /api/market/status
GET  /api/market/nifty
GET  /api/market/quotes
GET  /api/market/ohlc
GET  /api/instruments
GET  /api/instruments/nifty
GET  /api/scanner
GET  /api/scanner/:symbol
GET  /api/signals
GET  /api/signals/:id
GET  /api/watchlist
POST /api/watchlist
DELETE /api/watchlist/:symbol
GET  /api/settings
PUT  /api/settings
GET  /api/backtest
POST /api/backtest
GET  /api/journal
POST /api/journal
GET  /api/daily-review
```

No order placement endpoint is part of Version 1.

## 6. Data quality / safe failure

The UI and backend must distinguish:

- LIVE
- DELAYED
- STALE
- DISCONNECTED
- DATA INVALID
- ERROR

The scanner must not create a qualified signal from stale or invalid data.

## 7. Security

Never expose:

- Upstox access tokens
- API keys
- broker secrets
- database credentials

Use server-side environment variables and server-only API calls. Any persisted credentials must use appropriate secure storage.

## 8. UI architecture

The product is a dark professional trading terminal, not an admin dashboard.

The main dashboard prioritizes:

1. NIFTY market bias
2. ranked scanner candidates
3. setup type
4. qualification state
5. explanation / WHY
6. trigger, invalidation, stop and target
7. R:R and risk
8. volume, EMA and market alignment
9. event risk
10. signal age and data quality

Charts must show the market levels and markers that explain why a signal was generated.

## 9. Technology

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- TradingView Lightweight Charts (or equivalent)
- PostgreSQL
- Prisma (or equivalent)
- SSE/WebSocket depending on provider capabilities
- Vercel-compatible frontend deployment

Keep the design portable so persistent scanner processes can move to a worker host if Vercel execution constraints require it.

## 10. Development phases

1. Architecture
2. Database schema
3. Market-data abstraction
4. Instrument/universe module
5. YH/YL engine
6. EMA engine
7. Volume engine
8. Structure engine
9. Fake Breakout engine
10. Master Candle engine
11. Gap engine
12. Market context engine
13. Event filter
14. Confluence/ranking
15. Risk engine
16. Scanner API
17. Dashboard
18. Chart page
19. Alerts
20. Backtesting
21. Journal
22. Testing
23. Deployment

Every phase should be tested before the next phase is started.

## 11. Testing strategy

Unit and integration coverage will include:

- Fake breakout bullish/bearish
- Master candle bullish/bearish
- Gap up/down
- YH/YL rejection
- EMA alignment
- Volume confirmation
- Market alignment
- Event filter
- Time filter
- Risk calculation
- Position sizing
- Invalidation
- Stop and target handling

A mock/paper scanner mode will support full UI and engine validation without broker connectivity.

## 12. Environment variables

Server secrets:

```text
UPSTOX_ACCESS_TOKEN
DATABASE_URL
```

Application/configuration examples:

```text
SCANNER_MODE
MARKET_DATA_PROVIDER
EMA_FAST
EMA_SLOW
ATR_LENGTH
VOLUME_THRESHOLD
GAP_THRESHOLD
EARLY_SESSION_ENABLED
EARLY_SESSION_START
EARLY_SESSION_END
MARKET_FILTER_ENABLED
EVENT_FILTER_ENABLED
RISK_PER_TRADE
MAX_DAILY_LOSS
TARGET_RR
SLIPPAGE
BROKERAGE
```

## 13. Non-negotiable product rules

- Do not hard-code fake live prices in production.
- Do not hard-code BUY/SELL signals.
- Do not hide failed rules.
- Do not use an opaque ML score.
- Do not claim configurable assumptions are official source rules.
- Do not widen stops after entry.
- Do not average down.
- Do not place real orders in Version 1.
- Every qualified signal must be explainable and reproducible from stored inputs.

## 14. Disclaimer

Educational and analytical tool only. Not investment advice. Trading derivatives involves substantial risk.
