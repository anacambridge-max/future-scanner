import type { FuturesScannerUniverse, ScannerInstrument, UpstoxInstrumentRecord } from "./types";

const NIFTY_NAMES = new Set(["NIFTY", "NIFTY 50"]);
const NIFTY_INDEX_KEY = "NSE_INDEX|Nifty 50";

function toIsoDate(value?: string | number): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const date = typeof value === "number" ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

export function mapUpstoxInstrument(record: UpstoxInstrumentRecord): ScannerInstrument | null {
  if (!record.instrument_key || !record.trading_symbol) return null;

  const expiry = toIsoDate(record.expiry);
  const base = {
    instrumentKey: record.instrument_key,
    symbol: record.trading_symbol,
    exchange: record.exchange,
    underlyingSymbol: record.underlying_symbol ?? record.name,
    expiry,
    lotSize: record.lot_size,
    tickSize: record.tick_size,
    weekly: record.weekly,
    tradingSymbol: record.trading_symbol,
  };

  if (record.instrument_type === "INDEX") {
    return { ...base, kind: "INDEX" };
  }

  if (record.instrument_type === "FUT") {
    return { ...base, kind: "FUTURE" };
  }

  if (record.instrument_type === "CE" || record.instrument_type === "PE") {
    return {
      ...base,
      kind: "OPTION",
      strike: record.strike_price,
      optionSide: record.instrument_type,
    };
  }

  return null;
}

export function buildNiftyUniverse(records: UpstoxInstrumentRecord[]): FuturesScannerUniverse {
  const instruments = records
    .filter((record) => record.segment === "NSE_FO" || record.segment === "NSE_INDEX")
    .map(mapUpstoxInstrument)
    .filter((instrument): instrument is ScannerInstrument => instrument !== null);

  const underlying = instruments.find(
    (instrument) =>
      instrument.instrumentKey === NIFTY_INDEX_KEY ||
      (instrument.kind === "INDEX" && NIFTY_NAMES.has(instrument.symbol)),
  ) ?? null;

  const futures = instruments
    .filter(
      (instrument) =>
        instrument.kind === "FUTURE" &&
        NIFTY_NAMES.has(instrument.underlyingSymbol),
    )
    .sort((a, b) => (a.expiry ?? "").localeCompare(b.expiry ?? ""));

  const options = instruments
    .filter(
      (instrument) =>
        instrument.kind === "OPTION" &&
        NIFTY_NAMES.has(instrument.underlyingSymbol),
    )
    .sort((a, b) => {
      const expiryCompare = (a.expiry ?? "").localeCompare(b.expiry ?? "");
      if (expiryCompare !== 0) return expiryCompare;
      return (a.strike ?? 0) - (b.strike ?? 0);
    });

  const expiries = [...new Set(
    [...futures, ...options]
      .map((instrument) => instrument.expiry)
      .filter((expiry): expiry is string => Boolean(expiry)),
  )].sort();

  return { underlying, futures, options, expiries };
}

export function selectNearestExpiry(universe: FuturesScannerUniverse): string | undefined {
  return universe.expiries[0];
}

export function selectFrontFuture(universe: FuturesScannerUniverse): ScannerInstrument | null {
  const expiry = selectNearestExpiry(universe);
  return universe.futures.find((future) => future.expiry === expiry) ?? universe.futures[0] ?? null;
}

export function selectOptionsForExpiry(
  universe: FuturesScannerUniverse,
  expiry: string,
): ScannerInstrument[] {
  return universe.options.filter((option) => option.expiry === expiry);
}
