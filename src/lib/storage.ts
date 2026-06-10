import type { AppData } from "./types";
import { STORAGE_KEY, DEFAULT_ITEMS, DEFAULT_STATE } from "./constants";
import { todayStr } from "./utils";

// ─── Read / write (browser localStorage) ───
//
// The original prototype used the Claude artifact `window.storage` API, which
// does not exist in a real browser. This version persists to localStorage,
// guarding against SSR (no `window`) and quota / parse errors.

export function loadData(): AppData {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate older v2 entries that stored milkQty/paneerQty instead of quantities.
      if (parsed.entries?.length && parsed.entries[0].milkQty !== undefined) {
        parsed.entries = parsed.entries.map((e: { milkQty?: number; paneerQty?: number }) => ({
          ...e,
          quantities: { milk: e.milkQty || 0, paneer: e.paneerQty || 0 },
        }));
      }
      if (!parsed.items) parsed.items = DEFAULT_ITEMS;
      if (!parsed.quickDefaults) parsed.quickDefaults = { milk: 1 };
      return parsed as AppData;
    }
  } catch {
    // fall through to defaults
  }
  return { ...DEFAULT_STATE };
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full / unavailable — silently ignore
  }
}

// ─── Export / Import ───

export function exportData(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dairy-ledger-backup-${todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importData(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!parsed.items || !Array.isArray(parsed.entries) || !Array.isArray(parsed.payments)) {
          reject(new Error("Invalid backup file — missing items, entries, or payments."));
          return;
        }
        resolve(parsed as AppData);
      } catch {
        reject(new Error("Could not parse file — is it a valid JSON backup?"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
}
