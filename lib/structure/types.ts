export type StructureDirection = "BULLISH" | "BEARISH" | "RANGE" | "UNKNOWN";
export type SwingType = "HIGH" | "LOW";
export type BreakType = "BULLISH_BOS" | "BEARISH_BOS" | "BULLISH_CHOCH" | "BEARISH_CHOCH";

export interface StructureBar {
  timestamp: string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface SwingPoint {
  index: number;
  timestamp: string | Date;
  price: number;
  type: SwingType;
  strength: number;
}

export interface StructureBreak {
  index: number;
  timestamp: string | Date;
  type: BreakType;
  level: number;
  direction: "BULLISH" | "BEARISH";
}

export interface MarketStructureSnapshot {
  direction: StructureDirection;
  latestSwingHigh: SwingPoint | null;
  previousSwingHigh: SwingPoint | null;
  latestSwingLow: SwingPoint | null;
  previousSwingLow: SwingPoint | null;
  higherHigh: boolean | null;
  higherLow: boolean | null;
  lowerHigh: boolean | null;
  lowerLow: boolean | null;
  break: StructureBreak | null;
  swingCount: number;
}
