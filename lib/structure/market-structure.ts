import type {
  BreakType,
  MarketStructureSnapshot,
  StructureBar,
  StructureBreak,
  SwingPoint,
  SwingType,
} from "./types";

export interface StructureConfig {
  pivotLeft?: number;
  pivotRight?: number;
  breakOnClose?: boolean;
}

const DEFAULT_PIVOT_LEFT = 2;
const DEFAULT_PIVOT_RIGHT = 2;
const DEFAULT_BREAK_ON_CLOSE = true;

function isFiniteBar(bar: StructureBar): boolean {
  return [bar.open, bar.high, bar.low, bar.close].every(Number.isFinite) && bar.high >= bar.low;
}

function isPivotHigh(bars: StructureBar[], index: number, left: number, right: number): boolean {
  const price = bars[index].high;
  for (let offset = 1; offset <= left; offset += 1) if (bars[index - offset].high >= price) return false;
  for (let offset = 1; offset <= right; offset += 1) if (bars[index + offset].high > price) return false;
  return true;
}

function isPivotLow(bars: StructureBar[], index: number, left: number, right: number): boolean {
  const price = bars[index].low;
  for (let offset = 1; offset <= left; offset += 1) if (bars[index - offset].low <= price) return false;
  for (let offset = 1; offset <= right; offset += 1) if (bars[index + offset].low < price) return false;
  return true;
}

export function detectSwingPoints(
  bars: StructureBar[],
  config: StructureConfig = {},
): SwingPoint[] {
  const left = config.pivotLeft ?? DEFAULT_PIVOT_LEFT;
  const right = config.pivotRight ?? DEFAULT_PIVOT_RIGHT;
  if (!Number.isInteger(left) || left < 1 || !Number.isInteger(right) || right < 1) {
    throw new Error("Pivot left/right must be positive integers");
  }
  if (bars.length < left + right + 1) return [];
  if (bars.some((bar) => !isFiniteBar(bar))) throw new Error("Structure input contains an invalid bar");

  const swings: SwingPoint[] = [];
  for (let i = left; i < bars.length - right; i += 1) {
    if (isPivotHigh(bars, i, left, right)) {
      swings.push({ index: i, timestamp: bars[i].timestamp, price: bars[i].high, type: "HIGH", strength: left + right });
    }
    if (isPivotLow(bars, i, left, right)) {
      swings.push({ index: i, timestamp: bars[i].timestamp, price: bars[i].low, type: "LOW", strength: left + right });
    }
  }
  return swings.sort((a, b) => a.index - b.index);
}

function latestTwo(swings: SwingPoint[], type: SwingType): [SwingPoint | null, SwingPoint | null] {
  const points = swings.filter((swing) => swing.type === type);
  return [points.at(-1) ?? null, points.at(-2) ?? null];
}

export function detectStructureBreak(
  bars: StructureBar[],
  swings: SwingPoint[],
  breakOnClose = DEFAULT_BREAK_ON_CLOSE,
): StructureBreak | null {
  if (bars.length === 0 || swings.length === 0) return null;
  const lastIndex = bars.length - 1;
  const current = bars[lastIndex];
  const highs = swings.filter((s) => s.type === "HIGH" && s.index < lastIndex);
  const lows = swings.filter((s) => s.type === "LOW" && s.index < lastIndex);
  const resistance = highs.at(-1);
  const support = lows.at(-1);
  const bullishPrice = breakOnClose ? current.close : current.high;
  const bearishPrice = breakOnClose ? current.close : current.low;

  if (resistance && bullishPrice > resistance.price) {
    return {
      index: lastIndex,
      timestamp: current.timestamp,
      type: "BULLISH_BOS",
      level: resistance.price,
      direction: "BULLISH",
    };
  }
  if (support && bearishPrice < support.price) {
    return {
      index: lastIndex,
      timestamp: current.timestamp,
      type: "BEARISH_BOS",
      level: support.price,
      direction: "BEARISH",
    };
  }
  return null;
}

export function analyzeMarketStructure(
  bars: StructureBar[],
  config: StructureConfig = {},
): MarketStructureSnapshot {
  const swings = detectSwingPoints(bars, config);
  const [latestHigh, previousHigh] = latestTwo(swings, "HIGH");
  const [latestLow, previousLow] = latestTwo(swings, "LOW");
  const higherHigh = latestHigh && previousHigh ? latestHigh.price > previousHigh.price : null;
  const higherLow = latestLow && previousLow ? latestLow.price > previousLow.price : null;
  const lowerHigh = latestHigh && previousHigh ? latestHigh.price < previousHigh.price : null;
  const lowerLow = latestLow && previousLow ? latestLow.price < previousLow.price : null;

  let direction: MarketStructureSnapshot["direction"] = "UNKNOWN";
  if (higherHigh && higherLow) direction = "BULLISH";
  else if (lowerHigh && lowerLow) direction = "BEARISH";
  else if (higherHigh || higherLow || lowerHigh || lowerLow) direction = "RANGE";

  return {
    direction,
    latestSwingHigh: latestHigh,
    previousSwingHigh: previousHigh,
    latestSwingLow: latestLow,
    previousSwingLow: previousLow,
    higherHigh,
    higherLow,
    lowerHigh,
    lowerLow,
    break: detectStructureBreak(bars, swings, config.breakOnClose ?? DEFAULT_BREAK_ON_CLOSE),
    swingCount: swings.length,
  };
}

export { type BreakType, type SwingPoint, type SwingType };
