# FUTURE SCANNER — Phase 3 Market Data

## Implemented

Phase 3 introduces a broker-neutral `MarketDataProvider` interface and a server-side Upstox implementation.

### Provider capabilities

- `getQuotes()`
- `getOHLC()`
- `getHistoricalData()`
- `getVolume()`
- `getInstrumentMaster()`
- `getMarketStatus()`

### Upstox integration

The implementation uses Upstox REST APIs for:

- full market quotes
- V3 OHLC snapshots
- V3 historical candles
- instrument search
- exchange market status

The access token is read only from `UPSTOX_ACCESS_TOKEN` on the server. It is never included in frontend code or returned by the health endpoint.

### Error handling

Provider errors are normalized as `MarketDataError` and preserve:

- HTTP status
- provider error code when supplied
- retryable/non-retryable classification

HTTP 429 and 5xx responses are treated as retryable. Authentication failures are surfaced as data-provider failures rather than generating trading signals.

### Health endpoint

`GET /api/health` checks the NSE market-status endpoint and reports the provider state. A missing token or unavailable provider returns a disconnected/error state instead of pretending that data is live.

## Important Upstox notes

Upstox currently documents full market quote requests for up to 500 instruments in one request. Historical candles are available through the V3 history endpoints, and the V3 OHLC response includes live OHLC, previous OHLC, volume and timestamp fields.

The provider intentionally does not place orders.

## Phase 3 validation

Validation for this phase is split into two modes:

1. **Configuration validation** — verify that the provider can be constructed without exposing the token.
2. **Live connectivity validation** — once `UPSTOX_ACCESS_TOKEN` is configured in the deployment environment, call `/api/health` and the market-data endpoints against Upstox.

No fake market data is used as a substitute for live provider validation.
