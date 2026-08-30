# FUTURE SCANNER — Phases 11–23

## 11 Gap Setup
Implemented `lib/setups/gap.ts`: opening gap detection, direction, threshold, and fill state.

## 12 Market Context
Implemented time/event filters in `lib/context/filters.ts`. NIFTY/index context remains data-driven and must not be fabricated when market data is unavailable.

## 13 Confluence + Ranking
Implemented `lib/scanner/confluence.ts` and `lib/scanner/scanner-engine.ts`. Each rule has an explicit state, weight, and explanation.

## 14 Risk Engine
Implemented `lib/risk/risk-engine.ts`. Position size is constrained by capital, risk budget, stop distance and lot size. V1 remains paper/manual only.

## 15 Scanner API
Implemented `GET /api/scanner`. It reports configuration state and returns a safe no-data result until live market data is available.

## 16 Dashboard
Implemented the Next.js application shell at `/` with phase/status cards.

## 17 Charts
Chart integration is intentionally left as a UI integration boundary; no synthetic market series are generated. A chart component should consume normalized candle data from the market-data layer.

## 18 Alerts
Alert types and channels already exist in Prisma. Delivery workers are not enabled until a durable runtime is selected.

## 19 Backtesting
Backtest persistence exists in Prisma. The backtest runner should reuse the same pure scanner rules against historical candles to avoid live/backtest drift.

## 20 Journal
Journal persistence exists in Prisma and is designed for manual/paper trade review.

## 21 Testing
Pure engines are isolated so unit tests can be added without broker/network calls. Network integration tests must use mocked Upstox responses in CI.

## 22 Production hardening
Before production: validate Prisma migrations, run typecheck/build, add authentication, rate limiting, structured logging, stale-data guards, and secret checks.

## 23 Vercel deployment
Deploy the Next.js web/API layer to Vercel. Add `UPSTOX_ACCESS_TOKEN` and `DATABASE_URL` as server-side Vercel environment variables. Do not use `NEXT_PUBLIC_UPSTOX_ACCESS_TOKEN`.

### Live data architecture note
Upstox V3 supports historical/intraday candles and a WebSocket market feed. The WebSocket feed is a long-lived process and should not be treated as a Vercel request handler; use a suitable worker/runtime for continuous streaming and publish normalized data to the web/API layer.
