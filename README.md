# FUTURE SCANNER

Professional NIFTY F&O trading scanner based on the Prime Technical Professional Trading Course methodology.

## Version 1 scope

- NIFTY spot/index context
- NIFTY futures
- NIFTY option contracts
- Configurable NIFTY F&O universe
- Rule-based, explainable scanner
- Fake Breakout, Master Candle and Gap setup modules
- YH/YL, market structure, EMA, volume, market context, event and time filters
- Risk, position sizing, alerts, backtesting, journal and daily review architecture
- No automatic order execution in Version 1

## Architecture principles

Price action remains primary. Indicators support price action and do not independently create trade signals.

Every signal is auditable and reproducible from its market-data snapshot and evaluated rules.

Broker credentials remain server-side. Never expose API keys or access tokens to the browser.

## Development phases

1. Project architecture
2. Database schema
3. Market-data abstraction
4. Instrument/universe module
5. YH/YL engine
6. EMA engine
7. Volume engine
8. Structure engine
9. Fake Breakout engine
10. Master Candle engine
11. Gap engine
12. Market context engine
13. Event filter
14. Confluence/ranking engine
15. Risk engine
16. Scanner API
17. Dashboard
18. Chart page
19. Alerts
20. Backtesting
21. Journal
22. Testing
23. Deployment

## Disclaimer

Educational and analytical tool only. Not investment advice. Trading derivatives involves substantial risk.
