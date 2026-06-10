"use client";

import { useState, useEffect, useCallback } from "react";
import { loadData, saveData } from "@/lib/storage";
import { UNIT_OPTIONS, EMOJI_OPTIONS, DEFAULT_STATE } from "@/lib/constants";
import { fmt, todayStr, uid, monthKey, entryCost } from "@/lib/utils";
import { inp, primaryBtn, secondaryBtn } from "@/lib/styles";
import { Modal } from "./ui";
import HomeTab from "./HomeTab";
import AddTab from "./AddTab";
import HistoryTab from "./HistoryTab";
import SettingsTab from "./SettingsTab";
import type { AppData, Entry, Item, EntryForm, PayForm, ItemForm, ItemModalState, TabId } from "@/lib/types";

const tabList: { id: TabId; icon: string; label: string }[] = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "add", icon: "＋", label: "Add" },
  { id: "history", icon: "📋", label: "History" },
  { id: "settings", icon: "⚙", label: "Settings" },
];

export default function DairyTracker() {
  const [data, setData] = useState<AppData | null>(null);
  const [tab, setTab] = useState<TabId>("home");
  const [form, setForm] = useState<EntryForm>({ date: todayStr(), quantities: {} });
  const [editId, setEditId] = useState<string | null>(null);
  const [payForm, setPayForm] = useState<PayForm>({ amount: "", date: todayStr(), note: "" });
  const [payMonth, setPayMonth] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [itemModal, setItemModal] = useState<ItemModalState>(null);
  const [itemForm, setItemForm] = useState<ItemForm>({ name: "", rate: "", unitIdx: 0, emoji: "📦" });
  const [verifyMonth, setVerifyMonth] = useState<string | null>(null);
  const [dairyBill, setDairyBill] = useState("");

  useEffect(() => {
    setData(loadData());
  }, []);

  const save = useCallback((updater: AppData | ((prev: AppData) => AppData)) => {
    setData((prev) => {
      const base = prev ?? DEFAULT_STATE;
      const next = typeof updater === "function" ? (updater as (p: AppData) => AppData)(base) : updater;
      saveData(next);
      return next;
    });
  }, []);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  if (!data) return <div style={{ padding: 40, textAlign: "center", color: "#a09888" }}>Loading…</div>;

  const { items, entries, payments, quickDefaults } = data;
  const activeItems = items.filter((i) => i.enabled);

  // ── Derived ──
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const allMonths = Array.from(new Set(entries.map((e) => monthKey(e.date)))).sort().reverse();
  const cm = todayStr().slice(0, 7);

  const mTotal = (m: string) => entries.filter((e) => monthKey(e.date) === m).reduce((s, e) => s + entryCost(e, items), 0);
  const mPaid = (m: string) => payments.filter((p) => p.month === m).reduce((s, p) => s + p.amount, 0);
  const mBal = (m: string) => mTotal(m) - mPaid(m);
  const totalOutstanding = allMonths.reduce((s, m) => s + Math.max(0, mBal(m)), 0);

  // ── Entry actions ──
  const addEntry = () => {
    const hasQty = activeItems.some((item) => (parseFloat(form.quantities[item.id]) || 0) > 0);
    if (!hasQty) return;
    const quantities: Record<string, number> = {};
    activeItems.forEach((item) => {
      quantities[item.id] = parseFloat(form.quantities[item.id]) || 0;
    });
    save((prev) => {
      let updated: Entry[];
      if (editId) {
        updated = prev.entries.map((e) => (e.id === editId ? { ...e, date: form.date, quantities } : e));
      } else {
        updated = [...prev.entries, { id: uid(), date: form.date, quantities }];
      }
      return { ...prev, entries: updated };
    });
    setEditId(null);
    setForm({ date: todayStr(), quantities: {} });
    flash(editId ? "Entry updated ✓" : "Entry added ✓");
  };

  const quickAdd = () => {
    const quantities: Record<string, number> = {};
    Object.entries(quickDefaults).forEach(([id, qty]) => {
      if (qty > 0) quantities[id] = qty;
    });
    if (Object.keys(quantities).length === 0) return;
    save((prev) => ({ ...prev, entries: [...prev.entries, { id: uid(), date: todayStr(), quantities }] }));
    const desc = Object.entries(quantities)
      .map(([id, qty]) => {
        const item = items.find((i) => i.id === id);
        return item ? `${qty}${item.entryUnit} ${item.name}` : "";
      })
      .filter(Boolean)
      .join(", ");
    flash(`Added ${desc} ✓`);
  };

  const duplicateEntry = (e: Entry) => {
    save((prev) => ({ ...prev, entries: [...prev.entries, { id: uid(), date: todayStr(), quantities: { ...e.quantities } }] }));
    flash("Duplicated for today ✓");
  };

  const deleteEntry = (id: string) => {
    save((prev) => ({ ...prev, entries: prev.entries.filter((e) => e.id !== id) }));
    flash("Deleted");
  };

  const startEdit = (e: Entry) => {
    setEditId(e.id);
    setForm({ date: e.date, quantities: Object.fromEntries(Object.entries(e.quantities).map(([k, v]) => [k, String(v)])) });
    setTab("add");
  };

  // ── Payment actions ──
  const addPayment = (month: string) => {
    const amount = parseFloat(payForm.amount) || 0;
    if (amount <= 0) return;
    save((prev) => ({ ...prev, payments: [...prev.payments, { id: uid(), month, date: payForm.date, amount, note: payForm.note }] }));
    setPayForm({ amount: "", date: todayStr(), note: "" });
    setPayMonth(null);
    flash(`Payment ${fmt(amount)} recorded ✓`);
  };

  const deletePayment = (id: string) => {
    save((prev) => ({ ...prev, payments: prev.payments.filter((p) => p.id !== id) }));
    flash("Payment removed");
  };

  // ── Item CRUD ──
  const openNewItem = () => {
    setItemForm({ name: "", rate: "", unitIdx: 0, emoji: "📦" });
    setItemModal("new");
  };
  const openEditItem = (item: Item) => {
    const unitIdx = UNIT_OPTIONS.findIndex((u) => u.unit === item.unit && u.entryUnit === item.entryUnit);
    setItemForm({ name: item.name, rate: item.rate.toString(), unitIdx: unitIdx >= 0 ? unitIdx : 0, emoji: item.emoji || "📦" });
    setItemModal(item);
  };
  const saveItem = () => {
    const name = itemForm.name.trim();
    const rate = parseFloat(itemForm.rate) || 0;
    if (!name || rate <= 0) return;
    const u = UNIT_OPTIONS[itemForm.unitIdx];
    if (itemModal === "new") {
      const newItem: Item = { id: uid(), name, rate, unit: u.unit, entryUnit: u.entryUnit, divisor: u.divisor, step: u.step, presets: u.presets, emoji: itemForm.emoji, enabled: true };
      save((prev) => ({ ...prev, items: [...prev.items, newItem] }));
      flash(`${name} added ✓`);
    } else if (itemModal) {
      const editing = itemModal;
      save((prev) => ({
        ...prev,
        items: prev.items.map((i) => (i.id === editing.id ? { ...i, name, rate, unit: u.unit, entryUnit: u.entryUnit, divisor: u.divisor, step: u.step, presets: u.presets, emoji: itemForm.emoji } : i)),
      }));
      flash(`${name} updated ✓`);
    }
    setItemModal(null);
  };
  const toggleItem = (id: string) => {
    save((prev) => ({ ...prev, items: prev.items.map((i) => (i.id === id ? { ...i, enabled: !i.enabled } : i)) }));
  };
  const deleteItem = (id: string) => {
    save((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== id) }));
    flash("Item removed");
    setItemModal(null);
  };

  return (
    <div
      style={{
        ["--body" as string]: "'DM Sans', sans-serif",
        ["--serif" as string]: "'Fraunces', serif",
        ["--mono" as string]: "'DM Mono', monospace",
        minHeight: "100vh",
        background: "#f2eee7",
        fontFamily: "var(--body)",
        color: "#3a3226",
        paddingBottom: 80,
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      {/* ─── Header ─── */}
      <div style={{ background: "linear-gradient(135deg, #1a2e1a 0%, #3a5a3a 50%, #2d4a2d 100%)", padding: "28px 20px 22px", color: "#e8f5e0", borderRadius: "0 0 20px 20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -20, fontSize: 120, opacity: 0.06 }}>🥛</div>
        <div style={{ fontSize: 11, fontFamily: "var(--mono)", letterSpacing: 2.5, textTransform: "uppercase", opacity: 0.5, marginBottom: 4 }}>Purchase Tracker</div>
        <h1 style={{ fontSize: 28, fontFamily: "var(--serif)", fontWeight: 900, margin: 0, lineHeight: 1.1 }}>Dairy Ledger</h1>
        <div style={{ marginTop: 16, background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, backdropFilter: "blur(8px)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontFamily: "var(--mono)", letterSpacing: 1, textTransform: "uppercase", opacity: 0.6 }}>Total Outstanding</div>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "var(--serif)", lineHeight: 1.2, color: totalOutstanding > 0 ? "#ffcf8f" : "#8fdf8f" }}>
              {totalOutstanding > 0 ? fmt(totalOutstanding) : "All Clear ✓"}
            </div>
          </div>
          {totalOutstanding > 0 && (
            <button
              onClick={() => { setPayMonth(cm); setTab("history"); }}
              style={{ background: "rgba(255,207,143,0.2)", border: "1px solid rgba(255,207,143,0.3)", borderRadius: 10, padding: "10px 16px", color: "#ffcf8f", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--body)", whiteSpace: "nowrap" }}
            >
              Pay Now
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {tab === "home" && (
          <HomeTab
            items={items}
            entries={entries}
            activeItems={activeItems}
            quickDefaults={quickDefaults}
            sortedEntries={sortedEntries}
            cm={cm}
            save={save}
            quickAdd={quickAdd}
            duplicateEntry={duplicateEntry}
            startEdit={startEdit}
            deleteEntry={deleteEntry}
            mTotal={mTotal}
            mPaid={mPaid}
            setTab={setTab}
            setPayMonth={setPayMonth}
            setPayForm={setPayForm}
          />
        )}

        {tab === "add" && (
          <AddTab items={items} activeItems={activeItems} form={form} setForm={setForm} editId={editId} setEditId={setEditId} addEntry={addEntry} />
        )}

        {tab === "history" && (
          <HistoryTab
            items={items}
            activeItems={activeItems}
            payments={payments}
            sortedEntries={sortedEntries}
            allMonths={allMonths}
            cm={cm}
            mTotal={mTotal}
            mPaid={mPaid}
            duplicateEntry={duplicateEntry}
            startEdit={startEdit}
            deleteEntry={deleteEntry}
            addPayment={addPayment}
            deletePayment={deletePayment}
            verifyMonth={verifyMonth}
            setVerifyMonth={setVerifyMonth}
            dairyBill={dairyBill}
            setDairyBill={setDairyBill}
            payMonth={payMonth}
            setPayMonth={setPayMonth}
            payForm={payForm}
            setPayForm={setPayForm}
          />
        )}

        {tab === "settings" && (
          <SettingsTab data={data} items={items} entries={entries} payments={payments} save={save} flash={flash} toggleItem={toggleItem} openEditItem={openEditItem} openNewItem={openNewItem} />
        )}
      </div>

      {/* ─── Item Modal ─── */}
      {itemModal && (
        <Modal title={itemModal === "new" ? "Add Product" : `Edit ${itemModal.name}`} onClose={() => setItemModal(null)}>
          <label style={{ fontSize: 12, fontFamily: "var(--mono)", opacity: 0.45, display: "block", marginBottom: 4 }}>Emoji</label>
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                onClick={() => setItemForm((f) => ({ ...f, emoji: e }))}
                style={{ fontSize: 22, padding: "6px 8px", borderRadius: 8, border: itemForm.emoji === e ? "2px solid #2d4a2d" : "2px solid #e4ddd3", background: itemForm.emoji === e ? "#e0f0e0" : "#fff", cursor: "pointer" }}
              >
                {e}
              </button>
            ))}
          </div>

          <label style={{ fontSize: 12, fontFamily: "var(--mono)", opacity: 0.45, display: "block", marginBottom: 4 }}>Product Name</label>
          <input value={itemForm.name} onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Curd, Butter" style={{ ...inp, marginBottom: 14 }} />

          <label style={{ fontSize: 12, fontFamily: "var(--mono)", opacity: 0.45, display: "block", marginBottom: 4 }}>Unit Type</label>
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {UNIT_OPTIONS.map((u, i) => (
              <button
                key={i}
                onClick={() => setItemForm((f) => ({ ...f, unitIdx: i }))}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: "pointer",
                  background: itemForm.unitIdx === i ? "#2d4a2d" : "#f0ebe3",
                  color: itemForm.unitIdx === i ? "#e8f5e0" : "#6a6050",
                  border: "none",
                  fontFamily: "var(--body)",
                }}
              >
                {u.label}
              </button>
            ))}
          </div>

          <label style={{ fontSize: 12, fontFamily: "var(--mono)", opacity: 0.45, display: "block", marginBottom: 4 }}>Rate (₹ per {UNIT_OPTIONS[itemForm.unitIdx].unit})</label>
          <input type="number" value={itemForm.rate} onChange={(e) => setItemForm((f) => ({ ...f, rate: e.target.value }))} placeholder="0" style={{ ...inp, marginBottom: 18 }} />

          <button onClick={saveItem} style={{ ...primaryBtn, marginBottom: 10 }}>{itemModal === "new" ? "Add Product" : "Save Changes"}</button>

          {itemModal !== "new" && (
            <button
              onClick={() => { if (confirm(`Delete ${itemModal.name}?`)) deleteItem(itemModal.id); }}
              style={{ ...secondaryBtn, color: "#c47070", borderColor: "#e8c8c8", fontSize: 13 }}
            >
              Delete Product
            </button>
          )}
        </Modal>
      )}

      {/* ─── Bottom Tabs ─── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 480,
          background: "rgba(255,255,255,0.94)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid #e4ddd3",
          display: "flex",
          justifyContent: "space-around",
          padding: "6px 0 env(safe-area-inset-bottom, 8px)",
          zIndex: 100,
        }}
      >
        {tabList.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "8px 16px",
              borderRadius: 10,
              color: tab === t.id ? "#2d4a2d" : "#b0a898",
              fontFamily: "var(--body)",
              fontSize: 10,
              fontWeight: 600,
              transition: "color 0.15s",
            }}
          >
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "#2d4a2d", color: "#e8f5e0", padding: "10px 22px", borderRadius: 12, fontSize: 14, fontWeight: 500, zIndex: 200, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", animation: "slideUp 0.2s ease" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
