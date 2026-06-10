"use client";

import { Badge, Collapsible, IconBtn } from "./ui";
import { fmt, fmtDate, fmtMonth, entryCost, entryLine as entryLineFor, todayStr } from "@/lib/utils";
import { primaryBtn, secondaryBtn } from "@/lib/styles";
import type { AppData, Entry, Item, PayForm, SaveFn, TabId } from "@/lib/types";

interface HomeTabProps {
  items: Item[];
  entries: Entry[];
  activeItems: Item[];
  quickDefaults: Record<string, number>;
  sortedEntries: Entry[];
  cm: string;
  save: SaveFn;
  quickAdd: () => void;
  duplicateEntry: (e: Entry) => void;
  startEdit: (e: Entry) => void;
  deleteEntry: (id: string) => void;
  mTotal: (m: string) => number;
  mPaid: (m: string) => number;
  setTab: (t: TabId) => void;
  setPayMonth: (m: string | null) => void;
  setPayForm: (f: PayForm) => void;
}

export default function HomeTab({
  items,
  entries,
  activeItems,
  quickDefaults,
  sortedEntries,
  cm,
  save,
  quickAdd,
  duplicateEntry,
  startEdit,
  deleteEntry,
  mTotal,
  mPaid,
  setTab,
  setPayMonth,
  setPayForm,
}: HomeTabProps) {
  const entryLine = (e: Entry) => entryLineFor(e, activeItems);

  // ── Quick default controls ──
  const renderQuickBar = () => {
    const qItem = activeItems[0];
    if (!qItem) return null;
    const qVal = quickDefaults[qItem.id] || 0;
    return (
      <div style={{ background: "#fff", border: "1.5px solid #e4ddd3", borderRadius: 14, padding: "16px 18px", marginBottom: 12, boxShadow: "0 1px 6px rgba(58,50,38,0.04)" }}>
        <div style={{ fontSize: 11, fontFamily: "var(--mono)", letterSpacing: 1, textTransform: "uppercase", opacity: 0.4, marginBottom: 10 }}>Quick Add Today</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", background: "#faf8f5", border: "1.5px solid #ddd7cc", borderRadius: 10, overflow: "hidden", flex: 1 }}>
            <button
              onClick={() => save((p: AppData) => ({ ...p, quickDefaults: { ...p.quickDefaults, [qItem.id]: Math.max(qItem.step, (p.quickDefaults[qItem.id] || qItem.step) - qItem.step) } }))}
              style={{ background: "none", border: "none", padding: "12px 14px", fontSize: 18, cursor: "pointer", color: "#6a6050" }}
            >
              −
            </button>
            <span style={{ flex: 1, textAlign: "center", fontSize: 18, fontWeight: 700, fontFamily: "var(--serif)" }}>
              {qVal} {qItem.entryUnit}
            </span>
            <button
              onClick={() => save((p: AppData) => ({ ...p, quickDefaults: { ...p.quickDefaults, [qItem.id]: (p.quickDefaults[qItem.id] || 0) + qItem.step } }))}
              style={{ background: "none", border: "none", padding: "12px 14px", fontSize: 18, cursor: "pointer", color: "#6a6050" }}
            >
              +
            </button>
          </div>
          <button onClick={quickAdd} style={{ ...primaryBtn, width: "auto", padding: "12px 22px", borderRadius: 10, display: "flex", alignItems: "center", gap: 6 }}>
            {qItem.emoji} Add
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderQuickBar()}

      {/* Repeat Yesterday */}
      {(() => {
        const todayEntries = entries.filter((e) => e.date === todayStr());
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split("T")[0];
        const yEntries = entries.filter((e) => e.date === yStr);
        if (todayEntries.length === 0 && yEntries.length > 0) {
          const lastY = yEntries[yEntries.length - 1];
          return (
            <div style={{ background: "#fff", border: "1.5px dashed #d8d0c2", borderRadius: 14, padding: "14px 18px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "#a09888", marginBottom: 2 }}>Yesterday&apos;s order</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{entryLine(lastY)}</div>
              </div>
              <button onClick={() => duplicateEntry(lastY)} style={{ ...primaryBtn, width: "auto", padding: "10px 18px", borderRadius: 10, fontSize: 13, whiteSpace: "nowrap" }}>
                Same Today
              </button>
            </div>
          );
        }
        return null;
      })()}

      {/* This Month */}
      {(() => {
        const cmEntries = entries.filter((e) => e.date.slice(0, 7) === cm);
        const cmCost = mTotal(cm);
        const cmPaidAmt = mPaid(cm);
        const cmBalance = cmCost - cmPaidAmt;
        return (
          <Collapsible title={fmtMonth(cm)} badge={cmBalance > 0 ? <Badge color="#a06020" bg="#fff3e0">Due {fmt(cmBalance)}</Badge> : cmCost > 0 ? <Badge>Paid ✓</Badge> : null}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(activeItems.length, 3)}, 1fr)`, gap: 8, marginBottom: 12 }}>
              {activeItems.map((item) => {
                const total = cmEntries.reduce((s, e) => s + (e.quantities?.[item.id] || 0), 0);
                return (
                  <div key={item.id} style={{ background: "#faf8f5", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, fontFamily: "var(--mono)", letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.45 }}>{item.emoji} {item.name}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--serif)" }}>{item.divisor > 1 ? total.toFixed(0) : total.toFixed(1)} {item.entryUnit}</div>
                    <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "#8a8070" }}>{fmt((total / item.divisor) * item.rate)}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: cmBalance > 0 ? "#fff8f0" : "#f0f8f0", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, fontFamily: "var(--mono)", letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.5 }}>{cmBalance > 0 ? "Balance Due" : "Status"}</div>
                <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "var(--serif)", color: cmBalance > 0 ? "#a06020" : "#2d6a2d" }}>
                  {cmBalance > 0 ? fmt(cmBalance) : cmCost > 0 ? "Settled ✓" : "No purchases"}
                </div>
              </div>
              {cmBalance > 0 && (
                <button onClick={() => { setPayMonth(cm); setPayForm({ amount: cmBalance.toFixed(2), date: todayStr(), note: "" }); setTab("history"); }} style={{ ...secondaryBtn, width: "auto", padding: "8px 14px", fontSize: 12 }}>
                  Pay
                </button>
              )}
            </div>
          </Collapsible>
        );
      })()}

      {/* Recent */}
      <Collapsible title="Recent Entries" badge={<Badge>{entries.length} total</Badge>}>
        {sortedEntries.slice(0, 6).map((e) => (
          <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: "1px solid #f0ebe3" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "#a09888" }}>{fmtDate(e.date)}</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>{entryLine(e)}</div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--serif)", color: "#2d4a2d", whiteSpace: "nowrap" }}>{fmt(entryCost(e, items))}</span>
            <IconBtn icon="⊕" onClick={() => duplicateEntry(e)} label="Duplicate for today" />
            <IconBtn icon="✏️" onClick={() => startEdit(e)} label="Edit" />
            <IconBtn icon="🗑" onClick={() => deleteEntry(e.id)} label="Delete" danger />
          </div>
        ))}
        {entries.length === 0 && <div style={{ textAlign: "center", padding: "24px 0", color: "#b0a898", fontFamily: "var(--mono)", fontSize: 13 }}>No entries yet — tap ＋ to add</div>}
        {entries.length > 6 && <button onClick={() => setTab("history")} style={{ ...secondaryBtn, marginTop: 10, fontSize: 13, padding: "10px 0" }}>View All History →</button>}
      </Collapsible>
    </>
  );
}
