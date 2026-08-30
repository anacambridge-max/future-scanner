import { NextResponse } from "next/server";
import { scan } from "@/lib/scanner/scanner-engine";
export async function GET(){
 const tokenPresent=Boolean(process.env.UPSTOX_ACCESS_TOKEN); const result=scan({symbol:"NIFTY",price:0,ema10:0,ema20:0,rvol:0,location:"NO_DATA",setup:"NONE",eventRisk:false});
 return NextResponse.json({status:tokenPresent?"READY":"CONFIG_REQUIRED",dataQuality:tokenPresent?"READY":"DISCONNECTED",paperMode:true,result});
}