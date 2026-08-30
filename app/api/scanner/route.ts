import { NextResponse } from "next/server";
import { calculateEmaTrend } from "@/lib/indicators/ema";
import { UpstoxMarketDataProvider } from "@/lib/market-data/upstox";

function istDate(offsetDays = 0): string {
  const now = new Date();
  const value = new Date(now.getTime() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function previousTradingDate(): string {
  const now = new Date();
  for (let i = 1; i <= 7; i += 1) {
    const candidate = new Date(now.getTime() - i * 86_400_000);
    const weekday = Number(new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
    }).format(candidate) === "Sun" ? 0 : new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
    }).format(candidate) === "Mon" ? 1 : new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
    }).format(candidate) === "Tue" ? 2 : new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
    }).format(candidate) === "Wed" ? 3 : new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
    }).format(candidate) === "Thu" ? 4 : new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
    }).format(candidate) === "Fri" ? 5 : 6);
    if (weekday >= 1 && weekday <= 5) return istDate(-i);
  }
  return istDate(-1);
}

function subtractDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
}

export async function GET() {
  if (!process.env.UPSTOX_ACCESS_TOKEN) {
    return NextResponse.json({
      status: "CONFIG_REQUIRED",
      dataQuality: "DISCONNECTED",
      paperMode: true,
      message: "Add UPSTOX_ACCESS_TOKEN in Vercel to connect live market data.",
    });
  }

  try {
    const provider = new UpstoxMarketDataProvider();
    const instruments = await provider.getInstrumentMaster("NIFTY", {
      exchanges: "NSE",
      segments: "FO,INDEX",
      records: 100,
    });

    const futures = instruments
      .filter((instrument) => instrument.instrumentType === "FUTURE")
      .filter((instrument) => (instrument.underlyingSymbol ?? "").toUpperCase().includes("NIFTY"))
      .sort((a, b) => (a.expiry?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.expiry?.getTime() ?? Number.MAX_SAFE_INTEGER));

    const frontFuture = futures[0];
    if (!frontFuture) {
      return NextResponse.json({
        status: "NO_FUTURE_FOUND",
        dataQuality: "ERROR",
        paperMode: true,
        message: "Upstox returned no active NIFTY futures contract.",
      }, { status: 502 });
    }

    const toDate = previousTradingDate();
    const fromDate = subtractDays(toDate, 30);
    const [intraday, daily, quote] = await Promise.all([
      provider.getHistoricalData({ instrumentKey: frontFuture.instrumentKey, interval: "5minute", toDate, fromDate: subtractDays(toDate, 7) }),
      provider.getHistoricalData({ instrumentKey: frontFuture.instrumentKey, interval: "day", toDate, fromDate }),
      provider.getQuotes([frontFuture.instrumentKey]),
    ]);

    const candles = [...intraday].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const closes = candles.map((candle) => candle.close);
    const trend = calculateEmaTrend(closes);
    const volumes = daily.map((candle) => candle.volume ?? 0).filter((volume) => volume > 0);
    const currentVolume = candles.at(-1)?.volume ?? null;
    const averageVolume = volumes.length ? volumes.reduce((sum, volume) => sum + volume, 0) / volumes.length : null;
    const rvol = currentVolume !== null && averageVolume ? currentVolume / averageVolume : null;
    const latest = quote[0] ?? null;

    return NextResponse.json({
      status: "READY",
      dataQuality: latest?.dataQuality ?? "LIVE",
      paperMode: true,
      marketStatus: await provider.getMarketStatus("NSE"),
      instrument: {
        instrumentKey: frontFuture.instrumentKey,
        tradingSymbol: frontFuture.tradingSymbol,
        expiry: frontFuture.expiry,
        lotSize: frontFuture.lotSize,
      },
      snapshot: {
        price: latest?.lastPrice ?? trend.price,
        open: latest?.open ?? null,
        high: latest?.high ?? null,
        low: latest?.low ?? null,
        volume: latest?.volume ?? currentVolume,
        openInterest: latest?.openInterest ?? null,
        ema10: trend.ema10.value,
        ema20: trend.ema20.value,
        emaAlignment: trend.bullishAlignment ? "BULLISH" : trend.bearishAlignment ? "BEARISH" : "NEUTRAL",
        rvol,
        candles: candles.length,
        asOf: candles.at(-1)?.timestamp ?? latest?.timestamp ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json({
      status: "UPSTOX_ERROR",
      dataQuality: "ERROR",
      paperMode: true,
      message: error instanceof Error ? error.message : "Unable to read Upstox market data.",
    }, { status: 502 });
  }
}
