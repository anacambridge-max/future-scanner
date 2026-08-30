export type RiskDirection = "BUY" | "SELL";
export interface RiskInput {capital:number;riskPerTrade:number;entry:number;stop:number;lotSize:number;targetRR:number;direction:RiskDirection;}
export interface RiskResult {riskAmount:number;riskPerUnit:number;quantity:number;lots:number;stop:number;target:number;valid:boolean;reason:string;}
export function calculateRisk(x:RiskInput):RiskResult{
 const riskPerUnit=Math.abs(x.entry-x.stop); if(x.capital<=0||x.riskPerTrade<=0||riskPerUnit<=0||x.lotSize<=0||x.targetRR<=0)return {riskAmount:0,riskPerUnit,quantity:0,lots:0,stop:x.stop,target:x.entry,valid:false,reason:"Invalid risk inputs"};
 const riskAmount=Math.min(x.capital,x.riskPerTrade); const quantity=Math.floor(riskAmount/riskPerUnit/x.lotSize)*x.lotSize; const target=x.direction==="BUY"?x.entry+riskPerUnit*x.targetRR:x.entry-riskPerUnit*x.targetRR; return {riskAmount,riskPerUnit,quantity,lots:quantity/x.lotSize,stop:x.stop,target,valid:quantity>0,reason:quantity>0?"Risk plan valid":"Risk budget is below one lot"};
}