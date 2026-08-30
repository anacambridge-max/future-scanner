# FUTURE SCANNER — Phase 2 Database

## Purpose

Phase 2 defines the PostgreSQL persistence model for the NIFTY F&O scanner. The schema supports market-data snapshots, explainable signals, signal lifecycle events, risk/trade journaling, watchlists, alerts, backtests, daily review and event risk.

## Design principles

- PostgreSQL is the source of persisted application state.
- Prisma is the ORM/schema layer.
- Market-data snapshots required to reproduce a signal are retained on the signal record.
- Rule evaluations are persisted individually so every signal can explain itself.
- Market data is uniquely keyed by instrument + timeframe + candle time to prevent duplicate candles.
- Instrument metadata is normalized separately from market observations.
- User settings contain configurable thresholds; source methodology is not silently replaced with invented constants.
- V1 has no order-placement model/API. `Trade` represents paper/manual journaled execution only.
- Decimal database types are used for prices, quantities, risk and monetary values rather than floating-point persistence.

## Tables

| Table | Purpose |
|---|---|
| users | Application users and ownership boundary |
| settings | Per-user scanner/risk/configuration settings |
| instruments | Broker-neutral NIFTY F&O instrument master |
| market_data | OHLCV/OI observations and data-quality state |
| signals | Explainable scanner candidates and qualification state |
| signal_rules | Individual rule evaluations supporting each signal |
| signal_events | Signal lifecycle transitions |
| trades | Paper/manual execution and realized results |
| journal | Detailed trader notes and execution review |
| watchlists | User instrument monitoring/pinning |
| alerts | Browser/future channel alert configuration |
| backtest_runs | Backtest parameters and aggregate results |
| daily_stats | Per-day setup, execution and risk review |
| event_calendar | Manual/current/future event-risk records |

## Important relationships

```text
User
 ├── Settings
 ├── Watchlists ── Instrument
 ├── Alerts
 ├── Signals ── Instrument
 │      ├── SignalRules
 │      └── SignalEvents
 ├── Trades ── Instrument
 ├── Journal ── Instrument
 ├── BacktestRuns
 └── DailyStats

Instrument
 ├── MarketData
 ├── Signals
 ├── Trades
 ├── Journal
 └── Watchlists
```

## Signal audit model

A qualified signal contains:

1. Market snapshot
2. Setup snapshot
3. Risk snapshot
4. Data-quality state
5. Direction/setup/status
6. Entry, invalidation, stop, target and R:R where defined
7. Every evaluated rule and its state/message
8. Lifecycle events

This is intentional: a later audit should be able to determine what the scanner knew and why it made the decision.

## Data quality safety

`DataQuality` is persisted with market observations and signals. A future scanner implementation must prevent `STALE`, `DISCONNECTED`, `DATA_INVALID` or `ERROR` inputs from producing a new qualified signal.

## Configuration safety

The schema provides fields for thresholds that the source methodology does not specify numerically. Those values must be treated in the application UI as configurable/source-threshold-required assumptions, not as official Prime Technical rules.

## Next phase

Phase 3 will implement the broker-neutral `MarketDataProvider` contract and the Upstox adapter. Credentials remain server-side and are supplied through environment variables.
