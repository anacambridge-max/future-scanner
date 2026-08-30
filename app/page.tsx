"use client";

import { useEffect, useState } from "react";

const phases = [
  "Architecture", "Database", "Upstox Market Data", "NIFTY F&O Universe", "YH/YL + Location",
  "EMA 10/20", "Volume + RVOL", "Market Structure", "Fake Breakout", "Master Candle",
  "Gap Setup", "Market Context", "Confluence + Ranking", "Risk Engine", "Scanner API",
  "Dashboard", "Charts", "Alerts", "Backtesting", "Journal", "Testing", "Deployment",
];

type ScannerResponse = {
  status: string;
  dataQuality: string;
  paperMode: boolean;
  message?: string;
  instrument?: { tradingSymbol: string; expiry: string | null; lotSize: number | null };
  snapshot?: {
    price: number | null;
    ema10: number | null;
    ema20: number | null;
    emaAlignment: string;
    rvol: number | null;
    openInterest: number | null;
    asOf: string | null;
  };
};

export default function Home() {
  const [data, setData] = useState<ScannerResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch("/api/scanner", { cache: "no-store" });
      setData(await response.json());
    } catch {
      setData({ status: "OFFLINE", dataQuality: "ERROR", paperMode: true, message: "Scanner API unavailable." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const connected = data?.status === "READY";
  const snapshot = data?.snapshot;

  return (
    <main>
      <span className="pill">PAPER MODE • NIFTY F&O</span>
      <h1>FUTURE SCANNER</h1>
      <p className="muted">Explainable technical scanner. No automatic order execution.</p>

      <section className="live-panel">
        <div>
          <b>Market Data</b>
          <div className={connected ? "live-status" : "warning-status"}>
            {loading ? "CONNECTING…" : connected ? "● UPSTOX CONNECTED" : `● ${data?.status ?? "CHECKING"}`}
          </div>
          <p className="muted">{data?.message ?? "Scanner checks the front NIFTY futures contract."}</p>
        </div>
        <button onClick={refresh} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
      </section>

      {snapshot && (
        <section className="snapshot">
          <div><span>Contract</span><strong>{data?.instrument?.tradingSymbol ?? "—"}</strong></div>
          <div><span>Price</span><strong>{snapshot.price?.toFixed(2) ?? "—"}</strong></div>
          <div><span>EMA 10</span><strong>{snapshot.ema10?.toFixed(2) ?? "—"}</strong></div>
          <div><span>EMA 20</span><strong>{snapshot.ema20?.toFixed(2) ?? "—"}</strong></div>
          <div><span>Alignment</span><strong>{snapshot.emaAlignment}</strong></div>
          <div><span>RVOL</span><strong>{snapshot.rvol?.toFixed(2) ?? "—"}</strong></div>
          <div><span>Open Interest</span><strong>{snapshot.openInterest?.toLocaleString() ?? "—"}</strong></div>
        </section>
      )}

      <div className="grid">
        {phases.map((phase, index) => (
          <section className="card" key={phase}>
            <b>Phase {index + 1}</b>
            <div className="status">{index < 10 ? "Foundation" : index === 14 ? "Live API" : "Implementation"}</div>
            <h2>{phase}</h2>
          </section>
        ))}
      </div>
    </main>
  );
}
