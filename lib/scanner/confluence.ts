export type RuleState="PASS"|"FAIL"|"WARNING"|"NA";
export interface RuleResult {name:string;state:RuleState;weight:number;message:string;}
export interface ConfluenceResult {score:number;maxScore:number;confidence:number;qualified:boolean;rules:RuleResult[];}
export function evaluateConfluence(rules:RuleResult[],minimumScore=70):ConfluenceResult{
 const applicable=rules.filter(r=>r.state!=="NA"); const max=applicable.reduce((s,r)=>s+r.weight,0); const score=applicable.reduce((s,r)=>s+(r.state==="PASS"?r.weight:r.state==="WARNING"?r.weight*0.5:0),0); const confidence=max?score/max*100:0; return {score,maxScore:max,confidence,qualified:confidence>=minimumScore,rules};
}