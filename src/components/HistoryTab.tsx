"use client";

import type { Dispatch, SetStateAction } from "react";
import { Badge, Collapsible, IconBtn } from "./ui";
import { fmt, fmtDate, fmtMonth, entryCost, entryLine as entryLineFor, todayStr } from "@/lib/utils";
import { inp, primaryBtn, secondaryBtn } from "@/lib/styles";
import type { Entry, Item, PayForm, Payment } from "@/lib/types";

interface HistoryTabProps {
  items: Item[];
  activeItems: Item[];
  payments: Payment[];
  sortedEntries: Entry[];
  allMonths: string[];
  cm: string;
  mTotal: (m: string) => number;
  mPaid: (m: string) => number;
  duplicateEntry: (e: Entry) => void;
  startEdit: (e: Entry) => void;
  deleteEntry: (id: string) => void;
  addPayment: (month: string) => void;
  deletePayment: (id: string) => void;
  verifyMonth: string | null;
  setVerifyMonth: (m: string | null) => void;
  dairyBill: string;
  setDairyBill: (v: string) => void;
  payMonth: string | null;
  setPayMonth: (m: string | null) => void;
  payForm: PayForm;
  setPayForm: Dispatch<SetStateAction<PayForm>>;
}

export default function HistoryTab({
  items,
  activeItems,
  payments,
  sortedEntries,
  allMonths,
  cm,
  mTotal,
  mPaid,
  duplicateEntry,
  startEdit,
  deleteEntry,
  addPayment,
  deletePayment,
  verifyMonth,
  setVerifyMonth,
  dairyBill,
  setDairyBill,
  payMonth,
  setPayMonth,
  payForm,
  setPayForm,
}: HistoryTabProps) {
  const entryLine = (e: Entry) => entryLineFor(e, activeItems);

  return (
    <>
      {allMonths.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: "#b0a898", fontFamily: "var(--mono)", fontSize: 13 }}>No entries yet</div>}
      {allMonths.map((m) => {
        const mEntries = sortedEntries.filter((e) => e.date.slice(0, 7) === m);
        const mt = mTotal(m);
        const mp = mPaid(m);
        const mb = mt - mp;
        const mPayments = payments.filter((p) => p.month === m).sort((a, b) => b.date.localeCompare(a.date));
        return (
          <Collapsible key={m} title={fmtMonth(m)} defaultOpen={m === cm} badge={mb > 0 ? <Badge color="#a06020" bg="#fff3e0">Due {fmt(mb)}</Badge> : <Badge>Paid ✓</Badge>}>
            {/* Per-item stats */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(activeItems.length + 1, 4)}, 1fr)`, gap: 6, marginBottom: 12 }}>
              {activeItems.map((item) => {
                const total = mEntries.reduce((s, e) => s + (e.quantities?.[item.id] || 0), 0);
                return (
                  <div key={item.id} style={{ background: "#faf8f5", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, fontFamily: "var(--mono)", opacity: 0.45 }}>{item.emoji} {item.name}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--serif)" }}>{item.divisor > 1 ? total.toFixed(0) : total.toFixed(1)} {item.entryUnit}</div>
                  </div>
                );
              })}
              <div style={{ background: "#faf8f5", borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontSize: 10, fontFamily: "var(--mono)", opacity: 0.45 }}>Total</div>
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--serif)", color: "#2d4a2d" }}>{fmt(mt)}</div>
              </div>
            </div>

            {/* Balance */}
            <div style={{ background: mb > 0 ? "#fff8f0" : "#f0f8f0", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, fontFamily: "var(--mono)", letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.5 }}>Paid {fmt(mp)} of {fmt(mt)}</div>
                <div style={{ fontSize: 18, fontWeight: 900, fontFamily: "var(--serif)", color: mb > 0 ? "#a06020" : "#2d6a2d" }}>{mb > 0 ? `${fmt(mb)} due` : "Settled ✓"}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => { setVerifyMonth(verifyMonth === m ? null : m); setDairyBill(""); }}
                  style={{ ...secondaryBtn, width: "auto", padding: "8px 14px", fontSize: 12, background: verifyMonth === m ? "#fff3e0" : undefined }}
                >
                  {verifyMonth === m ? "Close" : "Verify"}
                </button>
                <button
                  onClick={() => { setPayMonth(payMonth === m ? null : m); setPayForm({ amount: Math.max(0, mb).toFixed(2), date: todayStr(), note: "" }); }}
                  style={{ ...secondaryBtn, width: "auto", padding: "8px 14px", fontSize: 12 }}
                >
                  {payMonth === m ? "Cancel" : "Pay"}
                </button>
              </div>
            </div>

            {/* Bill Verification */}
            {verifyMonth === m &&
              (() => {
                const bill = parseFloat(dairyBill) || 0;
                const diff = bill - mt;
                return (
                  <div style={{ background: "#fefcf6", border: "1.5px solid #e8e0d0", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontFamily: "var(--mono)", letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.4, marginBottom: 10 }}>Verify Dairy&apos;s Bill</div>
                    <div style={{ fontSize: 12, color: "#8a8070", marginBottom: 10, lineHeight: 1.5 }}>Enter what the dairy charged you. We&apos;ll compare it against your records.</div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 10, fontFamily: "var(--mono)", opacity: 0.4, display: "block", marginBottom: 4 }}>Dairy&apos;s Bill (₹)</label>
                        <input type="number" value={dairyBill} onChange={(e) => setDairyBill(e.target.value)} placeholder="Enter amount" style={inp} />
                      </div>
                      <div style={{ textAlign: "center", paddingTop: 16 }}>
                        <div style={{ fontSize: 10, fontFamily: "var(--mono)", opacity: 0.4 }}>Your Total</div>
                        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--serif)", color: "#2d4a2d" }}>{fmt(mt)}</div>
                      </div>
                    </div>
                    {bill > 0 && (
                      <div
                        style={{
                          background: Math.abs(diff) < 1 ? "#f0f8f0" : diff > 0 ? "#fff0f0" : "#f0f8f0",
                          borderRadius: 10,
                          padding: "14px 16px",
                          textAlign: "center",
                          border: `1.5px solid ${Math.abs(diff) < 1 ? "#c0e0c0" : diff > 0 ? "#e8c0c0" : "#c0e0c0"}`,
                        }}
                      >
                        {Math.abs(diff) < 1 ? (
                          <>
                            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--serif)", color: "#2d6a2d" }}>Bills match</div>
                            <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "#6a8a6a", marginTop: 4 }}>Difference: {fmt(Math.abs(diff))}</div>
                          </>
                        ) : diff > 0 ? (
                          <>
                            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--serif)", color: "#c04040" }}>Overcharged by {fmt(diff)}</div>
                            <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "#a06060", marginTop: 4 }}>Dairy says {fmt(bill)} · You calculated {fmt(mt)}</div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--serif)", color: "#2d6a2d" }}>Undercharged by {fmt(Math.abs(diff))}</div>
                            <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "#6a8a6a", marginTop: 4 }}>Dairy says {fmt(bill)} · You calculated {fmt(mt)}</div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

            {/* Payment form */}
            {payMonth === m && (
              <div style={{ background: "#fefcf8", border: "1.5px dashed #ddd7cc", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontFamily: "var(--mono)", letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.4, marginBottom: 10 }}>Record Payment</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 100px" }}>
                    <label style={{ fontSize: 10, fontFamily: "var(--mono)", opacity: 0.4, display: "block", marginBottom: 4 }}>Amount (₹)</label>
                    <input type="number" value={payForm.amount} onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))} style={inp} />
                  </div>
                  <div style={{ flex: "1 1 100px" }}>
                    <label style={{ fontSize: 10, fontFamily: "var(--mono)", opacity: 0.4, display: "block", marginBottom: 4 }}>Date</label>
                    <input type="date" value={payForm.date} onChange={(e) => setPayForm((f) => ({ ...f, date: e.target.value }))} style={inp} />
                  </div>
                </div>
                <input placeholder="Note (optional)" value={payForm.note} onChange={(e) => setPayForm((f) => ({ ...f, note: e.target.value }))} style={{ ...inp, marginTop: 8 }} />
                <button onClick={() => addPayment(m)} style={{ ...primaryBtn, marginTop: 10, fontSize: 14 }}>Save Payment</button>
              </div>
            )}

            {/* Payment history */}
            {mPayments.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontFamily: "var(--mono)", letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.35, marginBottom: 6 }}>Payments</div>
                {mPayments.map((p) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0", borderBottom: "1px solid #f5f0e8" }}>
                    <span style={{ fontSize: 13, color: "#2d6a2d", fontWeight: 600 }}>✓</span>
                    <span style={{ flex: 1, fontSize: 13 }}>
                      <strong>{fmt(p.amount)}</strong>
                      <span style={{ color: "#a09888", fontFamily: "var(--mono)", fontSize: 11, marginLeft: 6 }}>{fmtDate(p.date)}</span>
                      {p.note && <span style={{ color: "#a09888", fontSize: 12, marginLeft: 4 }}>· {p.note}</span>}
                    </span>
                    <IconBtn icon="Remove" onClick={() => deletePayment(p.id)} label="Remove" danger size={12} />
                  </div>
                ))}
              </div>
            )}

            {/* Entries */}
            <div style={{ fontSize: 10, fontFamily: "var(--mono)", letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.35, marginBottom: 4, marginTop: 6 }}>Purchases ({mEntries.length})</div>
            {mEntries.map((e) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0", borderBottom: "1px solid #f5f0e8" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "#a09888" }}>{fmtDate(e.date)}</span>
                  <span style={{ fontSize: 13, marginLeft: 8 }}>{entryLine(e)}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--serif)", color: "#2d4a2d", whiteSpace: "nowrap" }}>{fmt(entryCost(e, items))}</span>
                <IconBtn icon="Copy" onClick={() => duplicateEntry(e)} label="Duplicate" size={12} />
                <IconBtn icon="Edit" onClick={() => startEdit(e)} label="Edit" size={12} />
                <IconBtn icon="Delete" onClick={() => deleteEntry(e.id)} label="Delete" danger size={12} />
              </div>
            ))}
          </Collapsible>
        );
      })}
    </>
  );
}
