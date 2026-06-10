import type { AppData, Item, UnitOption } from "./types";

export const STORAGE_KEY = "dairy-ledger-data";

export const DEFAULT_ITEMS: Item[] = [
  { id: "milk", name: "Milk", rate: 70, unit: "L", entryUnit: "L", divisor: 1, step: 0.5, presets: [0.5, 1, 1.5, 2], emoji: "🥛", enabled: true },
  { id: "paneer", name: "Paneer", rate: 320, unit: "kg", entryUnit: "g", divisor: 1000, step: 50, presets: [50, 100, 200, 250, 500], emoji: "🧀", enabled: true },
];

export const UNIT_OPTIONS: UnitOption[] = [
  { label: "Litres (L)", unit: "L", entryUnit: "L", divisor: 1, step: 0.5, presets: [0.5, 1, 1.5, 2] },
  { label: "Kg (enter in kg)", unit: "kg", entryUnit: "kg", divisor: 1, step: 0.25, presets: [0.25, 0.5, 1, 2] },
  { label: "Kg (enter in grams)", unit: "kg", entryUnit: "g", divisor: 1000, step: 50, presets: [50, 100, 200, 250, 500] },
  { label: "Pieces", unit: "pcs", entryUnit: "pcs", divisor: 1, step: 1, presets: [1, 2, 3, 5] },
];

export const EMOJI_OPTIONS = ["🥛", "🧀", "🧈", "🍶", "🥚", "🍦", "🧁", "🫙", "🍼", "📦"];

export const DEFAULT_STATE: AppData = {
  items: DEFAULT_ITEMS,
  entries: [],
  payments: [],
  quickDefaults: { milk: 1 },
};
