# Phase 6 — EMA 10/20 Engine

## Purpose

Provide a deterministic EMA calculation layer for the scanner. This layer measures trend state; it does not create trade signals by itself.

## Implemented

- Standard recursive EMA calculation.
- SMA seed using the first `period` closes.
- Configurable period support, with scanner defaults of EMA 10 and EMA 20.
- Availability state when insufficient candles exist.
- Current EMA value and previous EMA value.
- One-step EMA slope.
- Price above/below EMA 10 and EMA 20.
- EMA 10/20 bullish and bearish alignment.
- Absolute and percentage EMA spread.
- Input validation for periods and non-finite prices.

## Scanner interpretation

`bullishAlignment` means EMA 10 is above EMA 20.

`bearishAlignment` means EMA 10 is below EMA 20.

These are trend/context measurements. A setup engine must still perform its own price-action, volume, location and confirmation checks before a signal can qualify.

## Data requirements

The engine accepts ordered closing prices. Upstox historical V3 provides OHLC candles and supports configurable intervals, including minute intervals and daily candles, so the same calculation layer can be reused across scanner timeframes. citeturn0search1

## Next phase

Phase 7 adds volume analysis and relative-volume confirmation.
