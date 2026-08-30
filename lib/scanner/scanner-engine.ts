import { evaluateConfluence, type RuleResult } from "./confluence";
export interface ScanInput {symbol:string;price:number;ema10:number;ema20:number;rvol:number;location:string;setup:"FAKE_BREAKOUT"|"MASTER_CANDLE"|"GAP"|"NONE";eventRisk:boolean;}
export interface ScanResult {symbol:string;direction:"BUY"|"SELL"|"NONE";qualified:boolean;score:number;confidence:number;reasons:string[];}
export function scan(x:ScanInput):ScanResult{
 const bullish=x.ema10>x.ema20; const bearish=x.ema10<x.ema20; const rules:RuleResult[]=[
  {name:"EMA alignment",state:x.setup!=="NONE"&&(bullish||bearish)?"PASS":"FAIL",weight:20,message:`EMA10 ${bullish?"above":"below"} EMA20`},
  {name:"Volume",state:x.rvol>=1.5?"PASS":x.rvol>=1?"WARNING":"FAIL",weight:15,message:`RVOL ${x.rvol.toFixed(2)}`},
  {name:"Setup",state:x.setup!=="NONE"?"PASS":"FAIL",weight:35,message:x.setup},
  {name:"Event filter",state:x.eventRisk?"FAIL":"PASS",weight:15,message:x.eventRisk?"High-impact event risk":"No blocking event"},
  {name:"Location",state:x.location.includes("YH")||x.location.includes("YL")?"PASS":"WARNING",weight:15,message:x.location}
 ];
 const c=evaluateConfluence(rules); const direction=c.qualified?(bullish?"BUY":bearish?"SELL":"NONE"):"NONE"; return {symbol:x.symbol,direction,qualified:c.qualified&&direction!=="NONE",score:c.score,confidence:c.confidence,reasons:rules.map(r=>`${r.state}: ${r.message}`)};
}