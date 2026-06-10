import type { Entry, Item } from "./types";

export function fmt(n: number): string {
  return "₹" + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtMonth(m: string): string {
  return new Date(m + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function monthKey(d: string): string {
  return d.slice(0, 7);
}

export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function entryCost(e: Entry, items: Item[]): number {
  return items.reduce((sum, item) => {
    const qty = e.quantities?.[item.id] || 0;
    return sum + (qty / item.divisor) * item.rate;
  }, 0);
}

export function itemCost(itemId: string, qty: number, items: Item[]): number {
  const item = items.find((i) => i.id === itemId);
  if (!item) return 0;
  return (qty / item.divisor) * item.rate;
}

// Human-readable one-liner for an entry, e.g. "🥛 1L  🧀 200g"
export function entryLine(e: Entry, activeItems: Item[]): string {
  return activeItems
    .map((item) => {
      const qty = e.quantities?.[item.id] || 0;
      return qty > 0 ? `${item.emoji} ${qty}${item.entryUnit}` : null;
    })
    .filter(Boolean)
    .join("  ");
}
