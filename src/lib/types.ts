// ─── Domain types ───

export interface Item {
  id: string;
  name: string;
  rate: number; // price per `unit` (e.g. 70 for ₹70/L)
  unit: string; // display unit: "L", "kg", "pcs"
  entryUnit: string; // input unit: "L", "g", "kg", "pcs"
  divisor: number; // conversion to `unit`: 1 for L→L, 1000 for g→kg
  step: number; // input step: 0.5 for litres, 50 for grams
  presets: number[]; // quick-fill buttons, e.g. [0.5, 1, 1.5, 2]
  emoji: string;
  enabled: boolean;
}

export interface Entry {
  id: string;
  date: string; // "YYYY-MM-DD"
  quantities: Record<string, number>; // { milk: 1, paneer: 200 }
  createdAt?: number;
}

export interface Payment {
  id: string;
  month: string; // "YYYY-MM"
  date: string; // "YYYY-MM-DD"
  amount: number;
  note: string;
  createdAt?: number;
}

export interface AppData {
  items: Item[];
  entries: Entry[];
  payments: Payment[];
  quickDefaults: Record<string, number>; // { milk: 1 }
}

export interface UnitOption {
  label: string;
  unit: string;
  entryUnit: string;
  divisor: number;
  step: number;
  presets: number[];
}

// ─── Form-state types (inputs are held as strings while editing) ───

export interface EntryForm {
  date: string;
  quantities: Record<string, string>;
}

export interface PayForm {
  amount: string;
  date: string;
  note: string;
}

export interface ItemForm {
  name: string;
  rate: string;
  unitIdx: number;
  emoji: string;
  presets: string; // comma-separated quick-amount buttons, e.g. "50, 100, 200"
}

export type TabId = "home" | "add" | "history" | "settings";

// Functional/replace updater, mirroring React's setState signature, that also
// persists to storage.
export type SaveFn = (updater: AppData | ((prev: AppData) => AppData)) => void;

// `null` = closed, "new" = adding a product, Item = editing that product
export type ItemModalState = null | "new" | Item;
