export interface EventWindow {timestamp:number;impact:"LOW"|"MEDIUM"|"HIGH"}
export function isTradingTime(iso:string,start="09:15",end="15:30"){const d=new Date(iso);const m=d.getUTCHours()*60+d.getUTCMinutes()+330;const mins=m%(24*60);const [sh,sm]=start.split(":").map(Number);const [eh,em]=end.split(":").map(Number);return mins>=sh*60+sm&&mins<=eh*60+em;}
export function eventRisk(now:number,events:EventWindow[],beforeMin=30,afterMin=15){return events.some(e=>e.impact==="HIGH"&&Math.abs(e.timestamp-now)<=Math.max(beforeMin,afterMin)*60000);}
