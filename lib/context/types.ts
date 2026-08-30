export type MarketLocation =
  | "ABOVE_YH"
  | "NEAR_YH"
  | "MID_RANGE"
  | "NEAR_YL"
  | "BELOW_YL"
  | "INSIDE_RANGE"
  | "NO_DATA";

export interface PreviousDayLevels {
  instrumentKey: string;
  tradingDate: string;
  high: number;
  low: number;
  source: "historical";
}

export interface MarketLocationResult {
  price: number;
  previousDayHigh: number;
  previousDayLow: number;
  range: number;
  location: MarketLocation;
  distanceToHigh: number;
  distanceToLow: number;
  distanceToHighPct: number;
  distanceToLowPct: number;
  nearLevelPct: number;
  evaluatedAt: string;
}
