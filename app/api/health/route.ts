import { NextResponse } from "next/server";
import { getMarketDataProvider } from "@/lib/market-data";
import { MarketDataError } from "@/lib/market-data";

export async function GET() {
  const providerName = process.env.MARKET_DATA_PROVIDER ?? "upstox";
  const checkedAt = new Date().toISOString();

  try {
    const provider = getMarketDataProvider();
    const status = await provider.getMarketStatus("NSE");

    return NextResponse.json({
      ok: true,
      provider: providerName,
      market: status,
      checkedAt,
    });
  } catch (error) {
    const marketError = error instanceof MarketDataError ? error : undefined;

    return NextResponse.json(
      {
        ok: false,
        provider: providerName,
        dataQuality: "DISCONNECTED",
        error: marketError?.message ?? "Market data provider unavailable",
        retryable: marketError?.retryable ?? false,
        checkedAt,
      },
      { status: marketError?.statusCode === 401 ? 401 : 503 },
    );
  }
}
