export type MarketDataInterval =
  | "1minute"
  | "3minute"
  | "5minute"
  | "10minute"
  | "15minute"
  | "30minute"
  | "60minute"
  | "day"
  | "week"
  | "month";

export type DataQuality = "LIVE" | "DELAYED" | "STALE" | "DISCONNECTED" | "DATA_INVALID" | "ERROR";

export interface QuoteSnapshot {
  instrumentKey: string;
  lastPrice: number | null;
  lastQuantity: number | null;
  volume: number | null;
  averagePrice: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  openInterest: number | null;
  timestamp: Date | null;
  dataQuality: DataQuality;
  raw: unknown;
}

export interface Candle {
  instrumentKey: string;
  timeframe: MarketDataInterval;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
  openInterest: number | null;
}

export interface InstrumentInfo {
  instrumentKey: string;
  tradingSymbol: string;
  name: string;
  exchange: string;
  segment: string;
  instrumentType: "INDEX" | "FUTURE" | "OPTION";
  underlyingSymbol: string | null;
  expiry: Date | null;
  strike: number | null;
  optionType: "CE" | "PE" | null;
  lotSize: number | null;
  tickSize: number | null;
  raw: unknown;
}

export interface MarketStatus {
  exchange: string;
  status: "OPEN" | "CLOSED" | "PRE_OPEN" | "UNKNOWN";
  timestamp: Date;
  raw: unknown;
}

export interface HistoricalDataRequest {
  instrumentKey: string;
  interval: MarketDataInterval;
  toDate: string;
  fromDate?: string;
}

export interface MarketDataProvider {
  getQuotes(instrumentKeys: string[]): Promise<QuoteSnapshot[]>;
  getOHLC(instrumentKeys: string[], interval?: "1d" | "1minute" | "5minute" | "30minute"): Promise<QuoteSnapshot[]>;
  getHistoricalData(request: HistoricalDataRequest): Promise<Candle[]>;
  getVolume(instrumentKeys: string[]): Promise<Map<string, number | null>>;
  getInstrumentMaster(query: string, options?: InstrumentSearchOptions): Promise<InstrumentInfo[]>;
  getMarketStatus(exchange: string): Promise<MarketStatus>;
}

export interface InstrumentSearchOptions {
  exchanges?: string;
  segments?: string;
  instrumentTypes?: string;
  expiry?: string;
  atmOffset?: number;
  pageNumber?: number;
  records?: number;
}

export class MarketDataError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly providerCode?: string,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = "MarketDataError";
  }
}
