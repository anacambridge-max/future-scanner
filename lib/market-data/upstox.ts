import {
  Candle,
  HistoricalDataRequest,
  InstrumentInfo,
  InstrumentSearchOptions,
  MarketDataError,
  MarketDataInterval,
  MarketDataProvider,
  MarketStatus,
  QuoteSnapshot,
} from "./types";

const UPSTOX_BASE_URL = "https://api.upstox.com";

interface UpstoxResponse<T> {
  status: string;
  data: T;
  errors?: Array<{ errorCode?: string; message?: string }>;
}

interface UpstoxQuote {
  last_price?: number;
  last_trade_time?: number;
  volume?: number;
  average_price?: number;
  ohlc?: { open?: number; high?: number; low?: number; close?: number };
  oi?: number;
}

interface UpstoxCandleResponse {
  candles?: Array<[string, number, number, number, number, number, number?]>;
}

interface UpstoxInstrument {
  instrument_key?: string;
  trading_symbol?: string;
  name?: string;
  exchange?: string;
  segment?: string;
  instrument_type?: string;
  underlying_symbol?: string;
  expiry?: string;
  strike_price?: number;
  option_type?: string;
  lot_size?: number;
  tick_size?: number;
}

interface UpstoxMarketStatus {
  exchange?: string;
  status?: string;
}

export class UpstoxMarketDataProvider implements MarketDataProvider {
  private readonly accessToken: string;

  constructor(accessToken = process.env.UPSTOX_ACCESS_TOKEN) {
    if (!accessToken) {
      throw new MarketDataError(
        "UPSTOX_ACCESS_TOKEN is not configured. Add it as a server-side environment variable.",
      );
    }
    this.accessToken = accessToken;
  }

  async getQuotes(instrumentKeys: string[]): Promise<QuoteSnapshot[]> {
    if (instrumentKeys.length === 0) return [];

    const data = await this.request<Record<string, UpstoxQuote>>(
      "/v2/market-quote/quotes",
      { instrument_key: instrumentKeys.join(",") },
    );

    return Object.entries(data).map(([instrumentKey, quote]) => this.mapQuote(instrumentKey, quote));
  }

  async getOHLC(
    instrumentKeys: string[],
    interval: "1d" | "1minute" | "5minute" | "30minute" = "1d",
  ): Promise<QuoteSnapshot[]> {
    if (instrumentKeys.length === 0) return [];

    const data = await this.request<Record<string, { live_ohlc?: UpstoxQuote; prev_ohlc?: UpstoxQuote }>>(
      "/v3/market-quote/ohlc",
      { instrument_key: instrumentKeys.join(","), interval },
    );

    return Object.entries(data).map(([instrumentKey, wrapper]) =>
      this.mapQuote(instrumentKey, wrapper.live_ohlc ?? wrapper.prev_ohlc ?? {}),
    );
  }

  async getHistoricalData(request: HistoricalDataRequest): Promise<Candle[]> {
    const path = request.fromDate
      ? `/v3/historical-candle/${encodeURIComponent(request.instrumentKey)}/${this.toV3Unit(request.interval)}/${this.toV3Interval(request.interval)}/${request.toDate}/${request.fromDate}`
      : `/v3/historical-candle/${encodeURIComponent(request.instrumentKey)}/${this.toV3Unit(request.interval)}/${this.toV3Interval(request.interval)}/${request.toDate}`;

    const data = await this.request<UpstoxCandleResponse>(path);
    return (data.candles ?? []).map((row) => ({
      instrumentKey: request.instrumentKey,
      timeframe: request.interval,
      timestamp: new Date(row[0]),
      open: row[1],
      high: row[2],
      low: row[3],
      close: row[4],
      volume: row[5] ?? null,
      openInterest: row[6] ?? null,
    }));
  }

  async getVolume(instrumentKeys: string[]): Promise<Map<string, number | null>> {
    const quotes = await this.getOHLC(instrumentKeys, "1d");
    return new Map(quotes.map((quote) => [quote.instrumentKey, quote.volume]));
  }

  async getInstrumentMaster(
    query: string,
    options: InstrumentSearchOptions = {},
  ): Promise<InstrumentInfo[]> {
    const data = await this.request<UpstoxInstrument[]>("/v2/instruments/search", {
      query,
      exchanges: options.exchanges ?? "NSE",
      segments: options.segments ?? "FO,INDEX",
      instrument_types: options.instrumentTypes,
      expiry: options.expiry,
      atm_offset: options.atmOffset,
      page_number: options.pageNumber ?? 1,
      records: options.records ?? 30,
    });

    return data.map((instrument) => ({
      instrumentKey: instrument.instrument_key ?? "",
      tradingSymbol: instrument.trading_symbol ?? "",
      name: instrument.name ?? "",
      exchange: instrument.exchange ?? "",
      segment: instrument.segment ?? "",
      instrumentType: this.mapInstrumentType(instrument.instrument_type, instrument.segment),
      underlyingSymbol: instrument.underlying_symbol ?? null,
      expiry: instrument.expiry ? new Date(instrument.expiry) : null,
      strike: instrument.strike_price ?? null,
      optionType: instrument.option_type === "CE" || instrument.option_type === "PE" ? instrument.option_type : null,
      lotSize: instrument.lot_size ?? null,
      tickSize: instrument.tick_size ?? null,
      raw: instrument,
    }));
  }

  async getMarketStatus(exchange: string): Promise<MarketStatus> {
    const data = await this.request<UpstoxMarketStatus>(`/v2/market/status/${encodeURIComponent(exchange)}`);
    const rawStatus = String(data.status ?? "").toUpperCase();
    const status = rawStatus.includes("OPEN")
      ? "OPEN"
      : rawStatus.includes("PRE")
        ? "PRE_OPEN"
        : rawStatus.includes("CLOSE")
          ? "CLOSED"
          : "UNKNOWN";

    return { exchange, status, timestamp: new Date(), raw: data };
  }

  private async request<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const url = new URL(`${UPSTOX_BASE_URL}${path}`);
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        cache: "no-store",
      });
    } catch (error) {
      throw new MarketDataError(
        `Upstox network request failed: ${error instanceof Error ? error.message : "unknown error"}`,
        undefined,
        undefined,
        true,
      );
    }

    const payload = (await response.json().catch(() => null)) as UpstoxResponse<T> | null;
    if (!response.ok) {
      const providerError = payload?.errors?.[0];
      const retryable = response.status === 429 || response.status >= 500;
      throw new MarketDataError(
        providerError?.message ?? `Upstox request failed with HTTP ${response.status}`,
        response.status,
        providerError?.errorCode,
        retryable,
      );
    }

    if (!payload || payload.status === "error") {
      throw new MarketDataError("Upstox returned an invalid response payload.");
    }

    return payload.data;
  }

  private mapQuote(instrumentKey: string, quote: UpstoxQuote): QuoteSnapshot {
    return {
      instrumentKey,
      lastPrice: quote.last_price ?? null,
      lastQuantity: null,
      volume: quote.volume ?? null,
      averagePrice: quote.average_price ?? null,
      open: quote.ohlc?.open ?? null,
      high: quote.ohlc?.high ?? null,
      low: quote.ohlc?.low ?? null,
      close: quote.ohlc?.close ?? null,
      openInterest: quote.oi ?? null,
      timestamp: quote.last_trade_time ? new Date(quote.last_trade_time) : null,
      dataQuality: "LIVE",
      raw: quote,
    };
  }

  private mapInstrumentType(type?: string, segment?: string): InstrumentInfo["instrumentType"] {
    const normalized = `${type ?? ""} ${segment ?? ""}`.toUpperCase();
    if (normalized.includes("OPT")) return "OPTION";
    if (normalized.includes("FUT")) return "FUTURE";
    return "INDEX";
  }

  private toV3Unit(interval: MarketDataInterval): string {
    if (interval === "day") return "days";
    if (interval === "week") return "weeks";
    if (interval === "month") return "months";
    if (interval.endsWith("minute")) return "minutes";
    if (interval.endsWith("hour")) return "hours";
    return "days";
  }

  private toV3Interval(interval: MarketDataInterval): string {
    const map: Record<MarketDataInterval, string> = {
      "1minute": "1",
      "3minute": "3",
      "5minute": "5",
      "10minute": "10",
      "15minute": "15",
      "30minute": "30",
      "60minute": "1",
      day: "1",
      week: "1",
      month: "1",
    };
    return map[interval];
  }
}
