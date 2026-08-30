export type GapDirection = "BULLISH" | "BEARISH" | "NONE";
export interface GapInput { previousClose:number; open:number; high:number; low:number; close:number; thresholdPct?:number; }
export interface GapResult { detected:boolean; direction:GapDirection; gapPct:number; filled:boolean; reason:string; }
export function detectGap(c:GapInput):GapResult{
 const threshold=c.thresholdPct??0.5; if(!Number.isFinite(c.previousClose)||c.previousClose<=0)return {detected:false,direction:"NONE",gapPct:0,filled:false,reason:"Invalid previous close"};
 const gapPct=((c.open-c.previousClose)/c.previousClose)*100; const direction:GapDirection=gapPct>=threshold?"BULLISH":gapPct<=-threshold?"BEARISH":"NONE";
 const filled=direction==="BULLISH"?c.low<=c.previousClose:direction==="BEARISH"?c.high>=c.previousClose:false;
 return {detected:direction!=="NONE",direction,gapPct,filled,reason:direction==="NONE"?"Opening gap below threshold":filled?"Gap detected and filled":"Gap remains open"};
}