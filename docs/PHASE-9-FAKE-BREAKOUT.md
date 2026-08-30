# Phase 9 — Fake Breakout / Liquidity Sweep Engine

The first Prime Technical setup engine is now implemented as a broker-neutral pure function.

## Detection model

A bearish fake breakout requires:

1. Price trades above the supplied resistance/liquidity level.
2. The candle closes back below that level.
3. The rejection wick meets the configurable wick/body threshold.
4. The close remains sufficiently close to the swept level.

A bullish fake breakout mirrors the logic below support:

1. Price trades below the supplied support/liquidity level.
2. The candle closes back above that level.
3. The rejection wick meets the configurable wick/body threshold.
4. The close remains sufficiently close to the swept level.

Relative volume is reported as confirmation when supplied, but it is not silently required for detection. This keeps the setup engine explainable and lets the later confluence engine decide whether volume is mandatory for a particular signal grade.

## API

`detectFakeBreakout(input)` returns:

- `detected`
- direction and swept level
- `breached`
- `closedBackInside`
- `rejectionConfirmed`
- optional `volumeConfirmed`
- wick/body ratio
- close distance from level
- human-readable reasons

## Integration

The scanner will later call this engine with levels produced by the YH/YL and market-structure modules. It does not place orders and does not emit a trade by itself.
