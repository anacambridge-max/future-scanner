import { MarketDataProvider } from "./types";
import { UpstoxMarketDataProvider } from "./upstox";

export function getMarketDataProvider(): MarketDataProvider {
  const provider = (process.env.MARKET_DATA_PROVIDER ?? "upstox").toLowerCase();

  switch (provider) {
    case "upstox":
      return new UpstoxMarketDataProvider();
    default:
      throw new Error(`Unsupported MARKET_DATA_PROVIDER: ${provider}`);
  }
}

export * from "./types";
export { UpstoxMarketDataProvider } from "./upstox";
