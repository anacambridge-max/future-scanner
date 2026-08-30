# Phase 7 — Volume Engine

## Purpose

Provide a deterministic volume-analysis layer for the scanner. The engine does not generate trade signals by itself; it exposes volume facts that later setup and confluence engines can consume.

## Inputs

Each bar supplies:

- timestamp
- volume

Upstox V3 candle APIs expose volume as candle field 5 and open interest as field 6. The V3 historical API supports configurable minute/hour/day/week/month intervals, while the intraday V3 API supports minute/hour/day intervals for the current session.

## Outputs

- current volume
- average volume baseline
- relative volume (RVOL)
- volume ratio
- above-average flag
- volume-spike flag
- sample size
- configured lookback period

## Default rules

- Baseline period: 20 preceding bars
- Spike threshold: RVOL >= 1.5
- Insufficient history returns `null` for RVOL rather than inventing a value
- The current bar is excluded from its own baseline

## Why the current bar is excluded

Including the current candle in its own average would dilute a volume spike. The baseline must represent preceding activity so that current participation can be compared against a stable reference.

## Scanner usage

Later setup engines can consume this layer for:

1. breakout confirmation
2. fake-breakout validation
3. master-candle breakout confirmation
4. gap confirmation
5. confluence/ranking

The volume engine remains independent of setup logic so thresholds can be configured without changing setup implementations.

## Data quality

Invalid negative/non-finite volumes are ignored. Missing history produces an explicit insufficient-data result. A stale or disconnected market-data state must be handled by the market-data layer and must not be converted into a valid volume confirmation.
