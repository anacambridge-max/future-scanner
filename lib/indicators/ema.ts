export type EmaPeriod = 10 | 20 | number;

export interface EmaPoint {
  timestamp: string;
  close: number;
  ema: number;
}

export interface EmaSnapshot {
  period: number;
  value: number | null;
  previousValue: number | null;
  slope: number | null;
  available: boolean;
}

/**
 * Calculate an EMA series using the standard recursive EMA formula.
 * The first value is seeded with the SMA of the first `period` closes.
 */
export function calculateEma(closes: number[], period: number): number[] {
  if (!Number.isInteger(period) || period <= 0) {
    throw new Error("EMA period must be a positive integer");
  }

  if (closes.length < period) return [];
  if (closes.slice(0, period).some((value) => !Number.isFinite(value))) {
    throw new Error("EMA input contains a non-finite close");
  }

  const multiplier = 2 / (period + 1);
  const result: number[] = [];
  let ema = closes.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  result.push(ema);

  for (let i = period; i < closes.length; i += 1) {
    const close = closes[i];
    if (!Number.isFinite(close)) throw new Error("EMA input contains a non-finite close");
    ema = (close - ema) * multiplier + ema;
    result.push(ema);
  }

  return result;
}

export function emaSnapshot(closes: number[], period: number): EmaSnapshot {
  const series = calculateEma(closes, period);
  if (series.length === 0) {
    return { period, value: null, previousValue: null, slope: null, available: false };
  }

  const value = series.at(-1) ?? null;
  const previousValue = series.length > 1 ? series.at(-2) ?? null : null;

  return {
    period,
    value,
    previousValue,
    slope: value !== null && previousValue !== null ? value - previousValue : null,
    available: value !== null,
  };
}

export interface EmaTrendSnapshot {
  ema10: EmaSnapshot;
  ema20: EmaSnapshot;
  price: number | null;
  priceAboveEma10: boolean | null;
  priceAboveEma20: boolean | null;
  bullishAlignment: boolean;
  bearishAlignment: boolean;
  emaSpread: number | null;
  emaSpreadPct: number | null;
}

/**
 * Trend state used by the scanner. No signal is emitted here; this module only
 * measures EMA state so setup engines can apply their own confirmation rules.
 */
export function calculateEmaTrend(closes: number[]): EmaTrendSnapshot {
  const price = closes.length ? closes.at(-1) ?? null : null;
  const ema10 = emaSnapshot(closes, 10);
  const ema20 = emaSnapshot(closes, 20);

  const priceAboveEma10 = price !== null && ema10.value !== null ? price > ema10.value : null;
  const priceAboveEma20 = price !== null && ema20.value !== null ? price > ema20.value : null;
  const bullishAlignment = ema10.value !== null && ema20.value !== null && ema10.value > ema20.value;
  const bearishAlignment = ema10.value !== null && ema20.value !== null && ema10.value < ema20.value;
  const emaSpread = ema10.value !== null && ema20.value !== null ? ema10.value - ema20.value : null;
  const emaSpreadPct = emaSpread !== null && ema20.value ? (emaSpread / ema20.value) * 100 : null;

  return {
    ema10,
    ema20,
    price,
    priceAboveEma10,
    priceAboveEma20,
    bullishAlignment,
    bearishAlignment,
    emaSpread,
    emaSpreadPct,
  };
}
