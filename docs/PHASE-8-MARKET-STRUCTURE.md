# Phase 8 — Market Structure

## Purpose

Provide a deterministic, reusable structure layer for the scanner. This module identifies confirmed pivot swings, compares recent swing highs/lows, classifies directional structure, and detects close-based breaks of the latest confirmed swing level.

## Swing methodology

The default pivot uses 2 bars to the left and 2 bars to the right. A swing high must exceed the highs of the left bars and be at least as high as the right bars; a swing low uses the mirrored condition. Because right-side bars are required, the most recent `pivotRight` bars cannot be confirmed pivots.

## Structure states

- `BULLISH`: latest swing high is higher than the previous swing high **and** latest swing low is higher than the previous swing low.
- `BEARISH`: latest swing high is lower and latest swing low is lower.
- `RANGE`: at least one comparison exists but the complete bullish/bearish pattern is absent.
- `UNKNOWN`: insufficient confirmed swing information.

## Break detection

A bullish BOS is reported when the latest bar closes above the latest confirmed swing high. A bearish BOS is reported when it closes below the latest confirmed swing low. The implementation can be configured to use the candle high/low instead of close.

This module deliberately does not create a trade signal. Setup engines decide how structure interacts with fake breakouts, master candles, gaps, EMA, volume, location and other confluence rules.

## Data contract

The engine consumes normalized OHLC bars. Upstox Historical Candle V3 provides timestamp, OHLC, volume and open interest, and supports configurable minute/hour/day/week/month intervals. The scanner can therefore feed the same structure engine from the selected timeframe without coupling the engine to Upstox-specific response formats.

Reference: https://upstox.com/developer/api-documentation/v3/get-historical-candle-data/
