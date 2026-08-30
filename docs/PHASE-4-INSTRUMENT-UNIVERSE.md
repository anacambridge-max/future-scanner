# FUTURE SCANNER — Phase 4: NIFTY F&O Instrument Universe

## Goal

Build a deterministic, broker-aware universe for the NIFTY F&O scanner.

## Upstox contract model

Upstox's instrument master uses `instrument_key` as the unique identifier. The current JSON instrument format exposes NSE F&O as `NSE_FO`, futures as `instrument_type: FUT`, and options as `CE`/`PE`, with expiry, strike, lot size, tick size, and underlying fields. The provider recommends using `instrument_key` rather than `exchange_token` because exchange tokens may be reused after expiry.

Source: https://upstox.com/developer/api-documentation/instruments/

## Universe rules

1. Accept only `NSE_INDEX` and `NSE_FO` records at the universe boundary.
2. Identify NIFTY 50 using `NSE_INDEX|Nifty 50` when present, with `NIFTY` / `NIFTY 50` as a display-name fallback.
3. Keep only NIFTY futures whose underlying is `NIFTY` or `NIFTY 50`.
4. Keep only NIFTY options whose underlying is `NIFTY` or `NIFTY 50`.
5. Normalize expiry to `YYYY-MM-DD`.
6. Preserve lot size and tick size from the broker master; do not hard-code them.
7. Sort contracts by expiry, then options by strike.
8. Expose the nearest expiry as the front expiry and the first matching future as the front future.
9. Keep all expiries available so the scanner can later support configurable expiry selection.

## Option-contract API

Upstox also provides a dedicated Option Contracts endpoint for an underlying instrument key and optional expiry. This can be used later as a targeted, low-payload option-chain discovery path. The universe abstraction intentionally keeps the broker source separate so we can choose between the BOD instrument file and the option-contract endpoint without changing scanner code.

Source: https://upstox.com/developer/api-documentation/get-option-contracts/

## Safety

This phase does not place orders. It only identifies instruments for market-data and scanner processing.

## Next

Phase 5 will build the previous-day high/low and market-location engine on top of the normalized instrument universe and market candles.
