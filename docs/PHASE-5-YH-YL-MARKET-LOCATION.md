# FUTURE SCANNER — Phase 5

## Previous-Day High/Low + Market Location

Phase 5 creates the context layer used by later setup engines.

### Inputs

- Completed daily OHLC candles from the market-data provider.
- Current price supplied by the quote/intraday layer.
- Trading date in `YYYY-MM-DD` format.

### Previous-day levels

`getPreviousDayLevels()` selects the latest completed daily candle whose date is before the requested trading date. It returns the previous day's high and low and records the source as historical data.

Upstox Historical Candle Data V3 provides OHLC and volume/open-interest fields and supports daily candles through the historical endpoint. The scanner should use historical candles for previous-day levels rather than treating a live OHLC quote as the previous day. citeturn0search0turn0search1

### Location classification

The market-location engine returns:

- `ABOVE_YH` — price is above previous-day high.
- `NEAR_YH` — price is inside the prior-day range and within the configured percentage of YH.
- `MID_RANGE` — price is away from both YH and YL.
- `NEAR_YL` — price is inside the prior-day range and within the configured percentage of YL.
- `BELOW_YL` — price is below previous-day low.
- `NO_DATA` — invalid or unavailable levels.

The default near-level threshold is **10% of the previous-day range**. It is configurable and is deliberately kept out of the setup rules so the same context engine can be reused by Fake Breakout, Master Candle, and Gap setups.

### Important trading-data rule

Previous-day levels must be based on the completed prior session. Current-day intraday candles are not substituted for those levels. Upstox's V3 historical API supports daily and intraday candle retrieval, while the V3 OHLC quote endpoint provides live/current OHLC information. citeturn0search0turn0search3turn0search5

### Files

```text
lib/context/types.ts
lib/context/previous-day-levels.ts
lib/context/market-location.ts
```

### Next phase

Phase 6 will add the EMA engine and expose trend state without coupling indicator calculations to UI components.
