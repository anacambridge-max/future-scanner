import type { PreviousDayLevels } from "./types";

export interface DailyCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  openInterest?: number;
}

/**
 * Returns the latest completed daily candle before the supplied trading date.
 * The caller is responsible for supplying candles in chronological order.
 */
export function getPreviousDayLevels(
  instrumentKey: string,
  candles: DailyCandle[],
  tradingDate: string,
): PreviousDayLevels | null {
  const candidates = candles
    .filter((candle) => candle.timestamp.slice(0, 10) < tradingDate)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const previous = candidates.at(-1);
  if (!previous) return null;

  return {
    instrumentKey,
    tradingDate,
    high: previous.high,
    low: previous.low,
    source: "historical",
  };
}
