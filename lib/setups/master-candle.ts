export type Candle = {
  timestamp: string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type MasterCandleConfig = {
  lookback?: number;
  maxBodyPercentOfRange?: number;
  minRangePercent?: number;
  requireInsideBars?: boolean;
};

export type MasterCandleResult = {
  detected: boolean;
  masterIndex: number | null;
  master: Candle | null;
  insideBars: Candle[];
  range: number | null;
  body: number | null;
  bodyPercentOfRange: number | null;
  breakoutUp: boolean;
  breakoutDown: boolean;
  reason: string;
};

const DEFAULT_LOOKBACK = 20;
const DEFAULT_MAX_BODY_PERCENT = 45;
const DEFAULT_MIN_RANGE_PERCENT = 0.05;

function validCandle(c: Candle): boolean {
  return [c.open, c.high, c.low, c.close].every(Number.isFinite) && c.high >= c.low && c.high > 0;
}

function inside(child: Candle, parent: Candle): boolean {
  return child.high <= parent.high && child.low >= parent.low;
}

/**
 * Detects a master candle as a relatively wide-range candle followed by
 * one or more candles contained within its high/low range. The current
 * candle is treated as a breakout only when it closes outside that range.
 */
export function detectMasterCandle(
  candles: Candle[],
  config: MasterCandleConfig = {},
): MasterCandleResult {
  const lookback = config.lookback ?? DEFAULT_LOOKBACK;
  const maxBodyPercent = config.maxBodyPercentOfRange ?? DEFAULT_MAX_BODY_PERCENT;
  const minRangePercent = config.minRangePercent ?? DEFAULT_MIN_RANGE_PERCENT;
  const requireInsideBars = config.requireInsideBars ?? true;

  if (!Number.isInteger(lookback) || lookback < 2) throw new Error("Master candle lookback must be at least 2");
  if (!Number.isFinite(maxBodyPercent) || maxBodyPercent <= 0 || maxBodyPercent > 100) throw new Error("Invalid master candle body threshold");
  if (!Number.isFinite(minRangePercent) || minRangePercent < 0) throw new Error("Invalid master candle range threshold");

  const valid = candles.filter(validCandle);
  if (valid.length < 3) return emptyResult("Insufficient candle data");

  const current = valid[valid.length - 1];
  const start = Math.max(0, valid.length - lookback);
  let best: { index: number; candle: Candle; range: number; bodyPercent: number } | null = null;

  for (let i = start; i < valid.length - 1; i++) {
    const candidate = valid[i];
    const range = candidate.high - candidate.low;
    if (range <= 0 || range / candidate.close * 100 < minRangePercent) continue;
    const bodyPercent = Math.abs(candidate.close - candidate.open) / range * 100;
    if (bodyPercent > maxBodyPercent) continue;

    let j = i + 1;
    while (j < valid.length - 1 && inside(valid[j], candidate)) j++;
    const insideBars = valid.slice(i + 1, j);
    if (requireInsideBars && insideBars.length === 0) continue;

    best = { index: i, candle: candidate, range, bodyPercent };
  }

  if (!best) return emptyResult("No master candle pattern found");

  const breakoutUp = current.close > best.candle.high;
  const breakoutDown = current.close < best.candle.low;

  return {
    detected: true,
    masterIndex: best.index,
    master: best.candle,
    insideBars: valid.slice(best.index + 1, valid.length - 1).filter((c) => inside(c, best!.candle)),
    range: best.range,
    body: Math.abs(best.candle.close - best.candle.open),
    bodyPercentOfRange: best.bodyPercent,
    breakoutUp,
    breakoutDown,
    reason: breakoutUp ? "Bullish breakout of master-candle range" : breakoutDown ? "Bearish breakdown of master-candle range" : "Master candle with contained price action",
  };
}

function emptyResult(reason: string): MasterCandleResult {
  return {
    detected: false,
    masterIndex: null,
    master: null,
    insideBars: [],
    range: null,
    body: null,
    bodyPercentOfRange: null,
    breakoutUp: false,
    breakoutDown: false,
    reason,
  };
}
