export type InstrumentKind = "INDEX" | "FUTURE" | "OPTION";
export type OptionSide = "CE" | "PE";

export interface UpstoxInstrumentRecord {
  segment: string;
  name: string;
  exchange: string;
  expiry?: string | number;
  instrument_type: string;
  instrument_key: string;
  trading_symbol: string;
  underlying_symbol?: string;
  underlying_key?: string;
  underlying_type?: string;
  strike_price?: number;
  lot_size?: number;
  minimum_lot?: number;
  tick_size?: number;
  weekly?: boolean;
  exchange_token?: string;
  freeze_quantity?: number;
}

export interface ScannerInstrument {
  instrumentKey: string;
  symbol: string;
  exchange: string;
  kind: InstrumentKind;
  underlyingSymbol: string;
  expiry?: string;
  strike?: number;
  optionSide?: OptionSide;
  lotSize?: number;
  tickSize?: number;
  weekly?: boolean;
  tradingSymbol: string;
}

export interface FuturesScannerUniverse {
  underlying: ScannerInstrument | null;
  futures: ScannerInstrument[];
  options: ScannerInstrument[];
  expiries: string[];
}
