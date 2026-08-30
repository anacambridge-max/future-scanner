import type { MarketLocation, MarketLocationResult } from "./types";

export interface MarketLocationOptions {
  /** Percentage of the YH-YL range used to define "near" a level. */
  nearLevelPct?: number;
}

function classify(price: number, high: number, low: number, nearLevelPct: number): MarketLocation {
  if (price > high) return "ABOVE_YH";
  if (price < low) return "BELOW_YL";

  const range = high - low;
  if (range <= 0) return "NO_DATA";

  const highDistancePct = ((high - price) / range) * 100;
  const lowDistancePct = ((price - low) / range) * 100;

  if (highDistancePct <= nearLevelPct) return "NEAR_YH";
  if (lowDistancePct <= nearLevelPct) return "NEAR_YL";
  return "MID_RANGE";
}

export function evaluateMarketLocation(
  price: number,
  previousDayHigh: number,
  previousDayLow: number,
  options: MarketLocationOptions = {},
): MarketLocationResult {
  const nearLevelPct = options.nearLevelPct ?? 10;
  const range = previousDayHigh - previousDayLow;

  if (!Number.isFinite(price) || !Number.isFinite(previousDayHigh) || !Number.isFinite(previousDayLow) || range <= 0) {
    return {
      price,
      previousDayHigh,
      previousDayLow,
      range,
      location: "NO_DATA",
      distanceToHigh: Number.NaN,
      distanceToLow: Number.NaN,
      distanceToHighPct: Number.NaN,
      distanceToLowPct: Number.NaN,
      nearLevelPct,
      evaluatedAt: new Date().toISOString(),
    };
  }

  const distanceToHigh = previousDayHigh - price;
  const distanceToLow = price - previousDayLow;

  return {
    price,
    previousDayHigh,
    previousDayLow,
    range,
    location: classify(price, previousDayHigh, previousDayLow, nearLevelPct),
    distanceToHigh,
    distanceToLow,
    distanceToHighPct: (distanceToHigh / range) * 100,
    distanceToLowPct: (distanceToLow / range) * 100,
    nearLevelPct,
    evaluatedAt: new Date().toISOString(),
  };
}
