export type Direction = "BULLISH" | "BEARISH";

export type BreakoutLevel = {
  name: string;
  price: number;
};

export type FakeBreakoutInput = {
  direction: Direction;
  level: BreakoutLevel;
  open: number;
  high: number;
  low: number;
  close: number;
  previousClose?: number;
  volumeRatio?: number | null;
  minWickToBodyRatio?: number;
  maxCloseDistanceFromLevelPct?: number;
};

export type FakeBreakoutResult = {
  detected: boolean;
  direction: Direction;
  level: BreakoutLevel;
  breached: boolean;
  closedBackInside: boolean;
  rejectionConfirmed: boolean;
  volumeConfirmed: boolean | null;
  wickToBodyRatio: number;
  closeDistanceFromLevelPct: number;
  reasons: string[];
};

function pctDistance(a: number, b: number): number {
  return b === 0 ? Number.POSITIVE_INFINITY : (Math.abs(a - b) / Math.abs(b)) * 100;
}

/**
 * Detects a single-candle liquidity sweep/fake breakout around a supplied level.
 * The caller is responsible for selecting the relevant YH/YL or swing level.
 */
export function detectFakeBreakout(input: FakeBreakoutInput): FakeBreakoutResult {
  const {
    direction,
    level,
    open,
    high,
    low,
    close,
    volumeRatio = null,
    minWickToBodyRatio = 1,
    maxCloseDistanceFromLevelPct = 0.25,
  } = input;

  const body = Math.abs(close - open);
  const safeBody = Math.max(body, Number.EPSILON);
  const upperWick = Math.max(0, high - Math.max(open, close));
  const lowerWick = Math.max(0, Math.min(open, close) - low);
  const wick = direction === "BEARISH" ? upperWick : lowerWick;
  const wickToBodyRatio = wick / safeBody;
  const closeDistanceFromLevelPct = pctDistance(close, level.price);

  const breached = direction === "BEARISH" ? high > level.price : low < level.price;
  const closedBackInside = direction === "BEARISH" ? close < level.price : close > level.price;
  const rejectionConfirmed = breached && closedBackInside && wickToBodyRatio >= minWickToBodyRatio;
  const volumeConfirmed = volumeRatio == null ? null : volumeRatio >= 1.5;
  const closeNearLevel = closeDistanceFromLevelPct <= maxCloseDistanceFromLevelPct;

  const reasons: string[] = [];
  if (breached) reasons.push(`Price breached ${level.name}`);
  if (closedBackInside) reasons.push("Candle closed back inside the level");
  if (wickToBodyRatio >= minWickToBodyRatio) reasons.push("Rejection wick confirmed");
  if (closeNearLevel) reasons.push("Close remains near the swept level");
  if (volumeConfirmed === true) reasons.push("Relative volume confirms the move");
  if (volumeConfirmed === false) reasons.push("Relative volume is below confirmation threshold");

  return {
    detected: rejectionConfirmed && closeNearLevel,
    direction,
    level,
    breached,
    closedBackInside,
    rejectionConfirmed,
    volumeConfirmed,
    wickToBodyRatio,
    closeDistanceFromLevelPct,
    reasons,
  };
}
