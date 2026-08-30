# Phase 10 — Master Candle Setup

Implemented a broker-independent master-candle detector in `lib/setups/master-candle.ts`.

## Detection model

1. Validate OHLC candles.
2. Search the recent lookback window for a relatively wide-range candle with a controlled body percentage.
3. Require subsequent price action to remain inside the candidate candle's high/low range by default.
4. Track the contained/inside candles.
5. Classify a breakout only when the latest candle closes above the master high or below the master low.

## Defaults

- Lookback: 20 candles
- Maximum body as percentage of range: 45%
- Minimum range as percentage of close: 0.05%
- At least one inside candle required

These are configuration defaults, not claims that the source course specifies these exact thresholds. They can be tuned during validation/backtesting.

## Output

The result exposes the master candle, range, body, body/range percentage, inside bars, bullish/bearish breakout state, and an explanation string for downstream confluence logic.

## Data source compatibility

The setup consumes normalized OHLC candles. Upstox V3 historical candle data provides timestamp, open, high, low, close, volume, and open interest, and supports configurable minute/hour/day/week/month intervals. See the Upstox V3 documentation for current retrieval constraints.
