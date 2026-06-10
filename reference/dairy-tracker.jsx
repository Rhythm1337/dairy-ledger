import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "dairy-v3-data";

const DEFAULT_ITEMS = [
  { id: "milk", name: "Milk", rate: 70, unit: "L", entryUnit: "L", divisor: 1, step: 0.5, presets: [0.5, 1, 1.5, 2], emoji: "🥛", enabled: true },
  { id: "paneer", name: "Paneer", rate: 320, unit: "kg", entryUnit: "g", divisor: 1000, step: 50, presets: [100, 200, 250, 500], emoji: "🧀", enabled: true },
];

const UNIT_OPTIONS = [
  { label: "Litres (L)", unit: "L", entryUnit: "L", divisor: 1, step: 0.5, presets: [0.5, 1, 1.5, 2] },
  { label: "Kg (enter in kg)", unit: "kg", entryUnit: "kg", divisor: 1, step: 0.25, presets: [0.25, 0.5, 1, 2] },
  { label: "Kg (enter in grams)", unit: "kg", entryUnit: "g", divisor: 1000, step: 50, presets: [100, 200, 250, 500] },
  { label: "Pieces", unit: "pcs", entryUnit: "pcs", divisor: 1, step: 1, presets: [1, 2, 3, 5] },
];

const EMOJI_OPTIONS = ["🥛", "🧀", "🧈", "🍶", "🥚", "🍦", "🧁", "🫙", "🍼", "📦"];

const DEFAULT_STATE = {
  items: DEFAULT_ITEMS,
  entries: [],
  payments: [],
  quickDefaults: { milk: 1 },
};

function fmt(n) { return "₹" + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d) { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
function fmtMonth(m) { return new Date(m + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" }); }
function monthKey(d) { return d.slice(0, 7); }
function todayStr() { return new Date().toISOString().split("T")[0]; }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function entryCost(e, items) {
  return items.reduce((sum, item) => {
    const qty = e.quantities?.[item.id] || 0;
    return sum + (qty / item.divisor) * item.rate;
  }, 0);
}

function itemCost(itemId, qty, items) {
  const item = items.find(i => i.id === itemId);
  if (!item) return 0;
  return (qty / item.divisor) * item.rate;
}

async function loadData() {
  try {
    const r = await window.storage.get(STORAGE_KEY);
    if (r?.value) {
      const parsed = JSON.parse(r.value);
      // Migrate v2 entries
      if (parsed.entries?.length && parsed.entries[0].milkQty !== undefined) {
        parsed.entries = parsed.entries.map(e => ({
          ...e,
          quantities: { milk: e.milkQty || 0, paneer: e.paneerQty || 0 },
        }));
      }
      if (!parsed.items) parsed.items = DEFAULT_ITEMS;
      if (!parsed.quickDefaults) parsed.quickDefaults = { milk: 1 };
      return parsed;
    }
  } catch {}
  return { ...DEFAULT_STATE };
}

async function saveData(data) {
  try { await window.storage.set(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

// ─── Export / Import ───

function exportData(data) {
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

function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.items || !Array.isArray(parsed.entries) || !Array.isArray(parsed.payments)) {
          reject(new Error("Invalid backup file — missing items, entries, or payments."));
          return;
        }
        resolve(parsed);
      } catch { reject(new Error("Could not parse file — is it a valid JSON backup?")); }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
}

// ─── UI Primitives ───

function Badge({ children, color = "#2d6a2d", bg = "#e0f0e0" }) {
  return <span style={{ display: "inline-block", fontSize: 11, fontFamily: "var(--mono)", fontWeight: 600, background: bg, color, borderRadius: 6, padding: "3px 8px", letterSpacing: 0.3 }}>{children}</span>;
}

function IconBtn({ icon, onClick, label, danger, size = 16 }) {
  return <button onClick={onClick} title={label} style={{ background: "none", border: "none", fontSize: size, cursor: "pointer", color: danger ? "#c47070" : "#a09888", padding: 6, borderRadius: 6, lineHeight: 1 }}>{icon}</button>;
}

function Collapsible({ title, badge, children, defaultOpen = true, actions }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: "#fff", border: "1px solid #e4ddd3", borderRadius: 14, marginBottom: 12, overflow: "hidden", boxShadow: "0 1px 6px rgba(58,50,38,0.04)" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "14px 18px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--mono)", letterSpacing: 0.6, textTransform: "uppercase", color: "#6a6050", flex: 1 }}>{title}</span>
        {badge}
        <span style={{ fontSize: 12, color: "#b0a898", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
      </button>
      {open && <div style={{ padding: "0 18px 16px" }}>{children}</div>}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: "relative", background: "#faf8f5", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480,
        maxHeight: "85vh", overflow: "auto", padding: "24px 20px env(safe-area-inset-bottom, 20px)",
        animation: "slideUp 0.25s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--serif)" }}>{title}</span>
          <button onClick={onClose} style={{ background: "#f0ebe3", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 16, cursor: "pointer", color: "#8a8070" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Main App ───

export default function DairyTracker() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("home");
  const [form, setForm] = useState({ date: todayStr(), quantities: {} });
  const [editId, setEditId] = useState(null);
  const [payForm, setPayForm] = useState({ amount: "", date: todayStr(), note: "" });
  const [payMonth, setPayMonth] = useState(null);
  const [toast, setToast] = useState(null);
  const [itemModal, setItemModal] = useState(null); // null | "new" | item object for edit
  const [itemForm, setItemForm] = useState({ name: "", rate: "", unitIdx: 0, emoji: "📦" });
  const [dupDate, setDupDate] = useState(null);
  const [verifyMonth, setVerifyMonth] = useState(null);
  const [dairyBill, setDairyBill] = useState("");

  useEffect(() => { loadData().then(setData); }, []);

  const save = useCallback((updater) => {
    setData(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveData(next);
      return next;
    });
  }, []);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  if (!data) return <div style={{ padding: 40, textAlign: "center", color: "#a09888" }}>Loading…</div>;

  const { items, entries, payments, quickDefaults } = data;
  const activeItems = items.filter(i => i.enabled);

  // ── Derived ──
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const allMonths = [...new Set(entries.map(e => monthKey(e.date)))].sort().reverse();
  const cm = todayStr().slice(0, 7);

  function mTotal(m) { return entries.filter(e => monthKey(e.date) === m).reduce((s, e) => s + entryCost(e, items), 0); }
  function mPaid(m) { return payments.filter(p => p.month === m).reduce((s, p) => s + p.amount, 0); }
  function mBal(m) { return mTotal(m) - mPaid(m); }
  const totalOutstanding = allMonths.reduce((s, m) => s + Math.max(0, mBal(m)), 0);

  // ── Actions ──
  const addEntry = () => {
    const hasQty = activeItems.some(item => (parseFloat(form.quantities[item.id]) || 0) > 0);
    if (!hasQty) return;
    const quantities = {};
    activeItems.forEach(item => { quantities[item.id] = parseFloat(form.quantities[item.id]) || 0; });
    save(prev => {
      let updated;
      if (editId) {
        updated = prev.entries.map(e => e.id === editId ? { ...e, date: form.date, quantities } : e);
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
    const quantities = {};
    Object.entries(quickDefaults).forEach(([id, qty]) => { if (qty > 0) quantities[id] = qty; });
    if (Object.keys(quantities).length === 0) return;
    save(prev => ({ ...prev, entries: [...prev.entries, { id: uid(), date: todayStr(), quantities }] }));
    const desc = Object.entries(quantities).map(([id, qty]) => {
      const item = items.find(i => i.id === id);
      return item ? `${qty}${item.entryUnit} ${item.name}` : "";
    }).filter(Boolean).join(", ");
    flash(`Added ${desc} ✓`);
  };

  const duplicateEntry = (e) => {
    save(prev => ({ ...prev, entries: [...prev.entries, { id: uid(), date: todayStr(), quantities: { ...e.quantities } }] }));
    flash("Duplicated for today ✓");
  };

  const deleteEntry = (id) => { save(prev => ({ ...prev, entries: prev.entries.filter(e => e.id !== id) })); flash("Deleted"); };

  const startEdit = (e) => {
    setEditId(e.id);
    setForm({ date: e.date, quantities: { ...e.quantities } });
    setTab("add");
  };

  const addPayment = (month) => {
    const amount = parseFloat(payForm.amount) || 0;
    if (amount <= 0) return;
    save(prev => ({ ...prev, payments: [...prev.payments, { id: uid(), month, date: payForm.date, amount, note: payForm.note }] }));
    setPayForm({ amount: "", date: todayStr(), note: "" });
    setPayMonth(null);
    flash(`Payment ${fmt(amount)} recorded ✓`);
  };

  const deletePayment = (id) => { save(prev => ({ ...prev, payments: prev.payments.filter(p => p.id !== id) })); flash("Payment removed"); };

  // ── Item CRUD ──
  const openNewItem = () => { setItemForm({ name: "", rate: "", unitIdx: 0, emoji: "📦" }); setItemModal("new"); };
  const openEditItem = (item) => {
    const unitIdx = UNIT_OPTIONS.findIndex(u => u.unit === item.unit && u.entryUnit === item.entryUnit);
    setItemForm({ name: item.name, rate: item.rate.toString(), unitIdx: unitIdx >= 0 ? unitIdx : 0, emoji: item.emoji || "📦" });
    setItemModal(item);
  };
  const saveItem = () => {
    const name = itemForm.name.trim();
    const rate = parseFloat(itemForm.rate) || 0;
    if (!name || rate <= 0) return;
    const u = UNIT_OPTIONS[itemForm.unitIdx];
    if (itemModal === "new") {
      const newItem = { id: uid(), name, rate, unit: u.unit, entryUnit: u.entryUnit, divisor: u.divisor, step: u.step, presets: u.presets, emoji: itemForm.emoji, enabled: true };
      save(prev => ({ ...prev, items: [...prev.items, newItem] }));
      flash(`${name} added ✓`);
    } else {
      save(prev => ({ ...prev, items: prev.items.map(i => i.id === itemModal.id ? { ...i, name, rate, unit: u.unit, entryUnit: u.entryUnit, divisor: u.divisor, step: u.step, presets: u.presets, emoji: itemForm.emoji } : i) }));
      flash(`${name} updated ✓`);
    }
    setItemModal(null);
  };
  const toggleItem = (id) => { save(prev => ({ ...prev, items: prev.items.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i) })); };
  const deleteItem = (id) => {
    save(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
    flash("Item removed");
    setItemModal(null);
  };

  // ── Styles ──
  const inp = { background: "#faf8f5", border: "1.5px solid #ddd7cc", borderRadius: 10, padding: "12px 14px", fontSize: 16, fontFamily: "var(--body)", color: "#3a3226", outline: "none", width: "100%", boxSizing: "border-box" };
  const primaryBtn = { background: "linear-gradient(135deg, #2d4a2d 0%, #3d5e3d 100%)", color: "#e8f5e0", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 16, fontWeight: 600, fontFamily: "var(--body)", cursor: "pointer", width: "100%" };
  const secondaryBtn = { background: "#f0ebe3", color: "#6a6050", border: "1px solid #ddd7cc", borderRadius: 12, padding: "14px 0", fontSize: 15, fontWeight: 500, fontFamily: "var(--body)", cursor: "pointer", width: "100%" };

  const entryLine = (e) => activeItems.map(item => {
    const qty = e.quantities?.[item.id] || 0;
    return qty > 0 ? `${item.emoji} ${qty}${item.entryUnit}` : null;
  }).filter(Boolean).join("  ");

  const tabList = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "add", icon: "＋", label: "Add" },
    { id: "history", icon: "📋", label: "History" },
    { id: "settings", icon: "⚙", label: "Settings" },
  ];

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
            <button onClick={() => save(p => ({ ...p, quickDefaults: { ...p.quickDefaults, [qItem.id]: Math.max(qItem.step, (p.quickDefaults[qItem.id] || qItem.step) - qItem.step) } }))}
              style={{ background: "none", border: "none", padding: "12px 14px", fontSize: 18, cursor: "pointer", color: "#6a6050" }}>−</button>
            <span style={{ flex: 1, textAlign: "center", fontSize: 18, fontWeight: 700, fontFamily: "var(--serif)" }}>
              {qVal} {qItem.entryUnit}
            </span>
            <button onClick={() => save(p => ({ ...p, quickDefaults: { ...p.quickDefaults, [qItem.id]: (p.quickDefaults[qItem.id] || 0) + qItem.step } }))}
              style={{ background: "none", border: "none", padding: "12px 14px", fontSize: 18, cursor: "pointer", color: "#6a6050" }}>+</button>
          </div>
          <button onClick={quickAdd} style={{ ...primaryBtn, width: "auto", padding: "12px 22px", borderRadius: 10, display: "flex", alignItems: "center", gap: 6 }}>
            {qItem.emoji} Add
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ "--body": "'DM Sans', sans-serif", "--serif": "'Fraunces', serif", "--mono": "'DM Mono', monospace", minHeight: "100vh", background: "#f2eee7", fontFamily: "var(--body)", color: "#3a3226", paddingBottom: 80, maxWidth: 480, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700;900&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

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
            <button onClick={() => { setPayMonth(cm); setTab("history"); }} style={{ background: "rgba(255,207,143,0.2)", border: "1px solid rgba(255,207,143,0.3)", borderRadius: 10, padding: "10px 16px", color: "#ffcf8f", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--body)", whiteSpace: "nowrap" }}>
              Pay Now
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>

        {/* ═══ HOME ═══ */}
        {tab === "home" && (
          <>
            {renderQuickBar()}

            {/* Repeat Yesterday */}
            {(() => {
              const todayEntries = entries.filter(e => e.date === todayStr());
              const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
              const yStr = yesterday.toISOString().split("T")[0];
              const yEntries = entries.filter(e => e.date === yStr);
              if (todayEntries.length === 0 && yEntries.length > 0) {
                const lastY = yEntries[yEntries.length - 1];
                return (
                  <div style={{ background: "#fff", border: "1.5px dashed #d8d0c2", borderRadius: 14, padding: "14px 18px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "#a09888", marginBottom: 2 }}>Yesterday's order</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{entryLine(lastY)}</div>
                    </div>
                    <button onClick={() => duplicateEntry(lastY)}
                      style={{ ...primaryBtn, width: "auto", padding: "10px 18px", borderRadius: 10, fontSize: 13, whiteSpace: "nowrap" }}>
                      Same Today
                    </button>
                  </div>
                );
              }
              return null;
            })()}

            {/* This Month */}
            {(() => {
              const cmEntries = entries.filter(e => monthKey(e.date) === cm);
              const cmCost = mTotal(cm);
              const cmPaidAmt = mPaid(cm);
              const cmBalance = cmCost - cmPaidAmt;
              return (
                <Collapsible title={fmtMonth(cm)} badge={cmBalance > 0 ? <Badge color="#a06020" bg="#fff3e0">Due {fmt(cmBalance)}</Badge> : cmCost > 0 ? <Badge>Paid ✓</Badge> : null}>
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(activeItems.length, 3)}, 1fr)`, gap: 8, marginBottom: 12 }}>
                    {activeItems.map(item => {
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
                    {cmBalance > 0 && <button onClick={() => { setPayMonth(cm); setPayForm({ amount: cmBalance.toFixed(2), date: todayStr(), note: "" }); setTab("history"); }} style={{ ...secondaryBtn, width: "auto", padding: "8px 14px", fontSize: 12 }}>Pay</button>}
                  </div>
                </Collapsible>
              );
            })()}

            {/* Recent */}
            <Collapsible title="Recent Entries" badge={<Badge>{entries.length} total</Badge>}>
              {sortedEntries.slice(0, 6).map(e => (
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
        )}

        {/* ═══ ADD ═══ */}
        {tab === "add" && (
          <div style={{ background: "#fff", border: "1.5px solid #e4ddd3", borderRadius: 16, padding: "22px 20px", boxShadow: "0 2px 12px rgba(58,50,38,0.05)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--mono)", letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.45, marginBottom: 16 }}>
              {editId ? "✏️ Edit Entry" : "＋ New Entry"}
            </div>

            <label style={{ fontSize: 12, fontFamily: "var(--mono)", letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.45, display: "block", marginBottom: 6 }}>Date</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ ...inp, marginBottom: 16 }} />

            {activeItems.map(item => (
              <div key={item.id} style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontFamily: "var(--mono)", letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.45, display: "block", marginBottom: 6 }}>
                  {item.emoji} {item.name} ({item.entryUnit})
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input type="number" step={item.step} placeholder="0" value={form.quantities[item.id] || ""}
                    onChange={e => setForm(f => ({ ...f, quantities: { ...f.quantities, [item.id]: e.target.value } }))}
                    style={{ ...inp, flex: 1 }} />
                  {item.presets.map(v => (
                    <button key={v} onClick={() => setForm(f => ({ ...f, quantities: { ...f.quantities, [item.id]: v.toString() } }))}
                      style={{
                        background: (form.quantities[item.id] || "") === v.toString() ? "#2d4a2d" : "#f0ebe3",
                        color: (form.quantities[item.id] || "") === v.toString() ? "#e8f5e0" : "#6a6050",
                        border: "none", borderRadius: 8, padding: "10px 4px", fontSize: 13,
                        fontWeight: 600, cursor: "pointer", minWidth: 38, fontFamily: "var(--mono)",
                      }}>{v}</button>
                  ))}
                </div>
              </div>
            ))}

            {/* Cost preview */}
            {(() => {
              const cost = activeItems.reduce((s, item) => s + itemCost(item.id, parseFloat(form.quantities[item.id]) || 0, items), 0);
              if (cost <= 0) return null;
              return (
                <div style={{ background: "#f8f6f1", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontFamily: "var(--mono)", opacity: 0.5 }}>Cost</span>
                  <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--serif)", color: "#2d4a2d" }}>{fmt(cost)}</span>
                </div>
              );
            })()}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={addEntry} style={primaryBtn}>{editId ? "Update Entry" : "Add Entry"}</button>
              {editId && <button onClick={() => { setEditId(null); setForm({ date: todayStr(), quantities: {} }); }} style={{ ...secondaryBtn, width: "auto", padding: "14px 20px" }}>Cancel</button>}
            </div>
          </div>
        )}

        {/* ═══ HISTORY ═══ */}
        {tab === "history" && (
          <>
            {allMonths.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: "#b0a898", fontFamily: "var(--mono)", fontSize: 13 }}>No entries yet</div>}
            {allMonths.map(m => {
              const mEntries = sortedEntries.filter(e => monthKey(e.date) === m);
              const mt = mTotal(m); const mp = mPaid(m); const mb = mt - mp;
              const mPayments = payments.filter(p => p.month === m).sort((a, b) => b.date.localeCompare(a.date));
              return (
                <Collapsible key={m} title={fmtMonth(m)} defaultOpen={m === cm}
                  badge={mb > 0 ? <Badge color="#a06020" bg="#fff3e0">Due {fmt(mb)}</Badge> : <Badge>Paid ✓</Badge>}>

                  {/* Per-item stats */}
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(activeItems.length + 1, 4)}, 1fr)`, gap: 6, marginBottom: 12 }}>
                    {activeItems.map(item => {
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
                      <button onClick={() => { setVerifyMonth(verifyMonth === m ? null : m); setDairyBill(""); }}
                        style={{ ...secondaryBtn, width: "auto", padding: "8px 14px", fontSize: 12, background: verifyMonth === m ? "#fff3e0" : undefined }}>
                        {verifyMonth === m ? "Close" : "Verify"}
                      </button>
                      <button onClick={() => { setPayMonth(payMonth === m ? null : m); setPayForm({ amount: Math.max(0, mb).toFixed(2), date: todayStr(), note: "" }); }}
                        style={{ ...secondaryBtn, width: "auto", padding: "8px 14px", fontSize: 12 }}>
                        {payMonth === m ? "Cancel" : "Pay"}
                      </button>
                    </div>
                  </div>

                  {/* Bill Verification */}
                  {verifyMonth === m && (() => {
                    const bill = parseFloat(dairyBill) || 0;
                    const diff = bill - mt;
                    return (
                      <div style={{ background: "#fefcf6", border: "1.5px solid #e8e0d0", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontFamily: "var(--mono)", letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.4, marginBottom: 10 }}>🔍 Verify Dairy's Bill</div>
                        <div style={{ fontSize: 12, color: "#8a8070", marginBottom: 10, lineHeight: 1.5 }}>
                          Enter what the dairy charged you. We'll compare it against your records.
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, fontFamily: "var(--mono)", opacity: 0.4, display: "block", marginBottom: 4 }}>Dairy's Bill (₹)</label>
                            <input type="number" value={dairyBill} onChange={e => setDairyBill(e.target.value)} placeholder="Enter amount" style={inp} />
                          </div>
                          <div style={{ textAlign: "center", paddingTop: 16 }}>
                            <div style={{ fontSize: 10, fontFamily: "var(--mono)", opacity: 0.4 }}>Your Total</div>
                            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--serif)", color: "#2d4a2d" }}>{fmt(mt)}</div>
                          </div>
                        </div>
                        {bill > 0 && (
                          <div style={{
                            background: Math.abs(diff) < 1 ? "#f0f8f0" : diff > 0 ? "#fff0f0" : "#f0f8f0",
                            borderRadius: 10, padding: "14px 16px", textAlign: "center",
                            border: `1.5px solid ${Math.abs(diff) < 1 ? "#c0e0c0" : diff > 0 ? "#e8c0c0" : "#c0e0c0"}`,
                          }}>
                            {Math.abs(diff) < 1 ? (
                              <>
                                <div style={{ fontSize: 20, marginBottom: 4 }}>✅</div>
                                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--serif)", color: "#2d6a2d" }}>Bills match!</div>
                                <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "#6a8a6a", marginTop: 4 }}>Difference: {fmt(Math.abs(diff))}</div>
                              </>
                            ) : diff > 0 ? (
                              <>
                                <div style={{ fontSize: 20, marginBottom: 4 }}>⚠️</div>
                                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--serif)", color: "#c04040" }}>Overcharged by {fmt(diff)}</div>
                                <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "#a06060", marginTop: 4 }}>Dairy says {fmt(bill)} · You calculated {fmt(mt)}</div>
                              </>
                            ) : (
                              <>
                                <div style={{ fontSize: 20, marginBottom: 4 }}>🤔</div>
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
                          <input type="number" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} style={inp} />
                        </div>
                        <div style={{ flex: "1 1 100px" }}>
                          <label style={{ fontSize: 10, fontFamily: "var(--mono)", opacity: 0.4, display: "block", marginBottom: 4 }}>Date</label>
                          <input type="date" value={payForm.date} onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))} style={inp} />
                        </div>
                      </div>
                      <input placeholder="Note (optional)" value={payForm.note} onChange={e => setPayForm(f => ({ ...f, note: e.target.value }))} style={{ ...inp, marginTop: 8 }} />
                      <button onClick={() => addPayment(m)} style={{ ...primaryBtn, marginTop: 10, fontSize: 14 }}>Save Payment</button>
                    </div>
                  )}

                  {/* Payment history */}
                  {mPayments.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, fontFamily: "var(--mono)", letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.35, marginBottom: 6 }}>Payments</div>
                      {mPayments.map(p => (
                        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0", borderBottom: "1px solid #f5f0e8" }}>
                          <span style={{ fontSize: 13, color: "#2d6a2d", fontWeight: 600 }}>✓</span>
                          <span style={{ flex: 1, fontSize: 13 }}>
                            <strong>{fmt(p.amount)}</strong>
                            <span style={{ color: "#a09888", fontFamily: "var(--mono)", fontSize: 11, marginLeft: 6 }}>{fmtDate(p.date)}</span>
                            {p.note && <span style={{ color: "#a09888", fontSize: 12, marginLeft: 4 }}>— {p.note}</span>}
                          </span>
                          <IconBtn icon="✕" onClick={() => deletePayment(p.id)} label="Remove" danger size={13} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Entries */}
                  <div style={{ fontSize: 10, fontFamily: "var(--mono)", letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.35, marginBottom: 4, marginTop: 6 }}>Purchases ({mEntries.length})</div>
                  {mEntries.map(e => (
                    <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0", borderBottom: "1px solid #f5f0e8" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "#a09888" }}>{fmtDate(e.date)}</span>
                        <span style={{ fontSize: 13, marginLeft: 8 }}>{entryLine(e)}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--serif)", color: "#2d4a2d", whiteSpace: "nowrap" }}>{fmt(entryCost(e, items))}</span>
                      <IconBtn icon="⊕" onClick={() => duplicateEntry(e)} label="Duplicate" size={14} />
                      <IconBtn icon="✏️" onClick={() => startEdit(e)} label="Edit" size={14} />
                      <IconBtn icon="🗑" onClick={() => deleteEntry(e.id)} label="Delete" danger size={14} />
                    </div>
                  ))}
                </Collapsible>
              );
            })}
          </>
        )}

        {/* ═══ SETTINGS ═══ */}
        {tab === "settings" && (
          <>
            <div style={{ background: "#fff", border: "1.5px solid #e4ddd3", borderRadius: 16, padding: "22px 20px", marginBottom: 12, boxShadow: "0 2px 12px rgba(58,50,38,0.05)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--mono)", letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.45, marginBottom: 16 }}>Products & Rates</div>

              {items.map(item => (
                <div key={item.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 0",
                  borderBottom: "1px solid #f0ebe3", opacity: item.enabled ? 1 : 0.45,
                }}>
                  <span style={{ fontSize: 22 }}>{item.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "#8a8070" }}>₹{item.rate}/{item.unit} · enter in {item.entryUnit}</div>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                    <div onClick={() => toggleItem(item.id)} style={{
                      width: 44, height: 26, borderRadius: 13, padding: 3,
                      background: item.enabled ? "#2d6a2d" : "#d4cfc6", transition: "background 0.2s", cursor: "pointer",
                    }}>
                      <div style={{ width: 20, height: 20, borderRadius: 10, background: "#fff", transition: "transform 0.2s", transform: item.enabled ? "translateX(18px)" : "translateX(0)" }} />
                    </div>
                  </label>
                  <IconBtn icon="✏️" onClick={() => openEditItem(item)} label="Edit" />
                </div>
              ))}

              <button onClick={openNewItem} style={{ ...secondaryBtn, marginTop: 14, fontSize: 14, padding: "12px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                ＋ Add Product
              </button>
            </div>

            {/* Danger zone */}
            <div style={{ background: "#fff", border: "1.5px solid #e4ddd3", borderRadius: 16, padding: "22px 20px", marginBottom: 12, boxShadow: "0 2px 12px rgba(58,50,38,0.05)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--mono)", letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.45, marginBottom: 14 }}>Your Data</div>
              <div style={{ fontSize: 13, color: "#8a8070", marginBottom: 14, lineHeight: 1.5 }}>
                All data is saved in your browser. Export a backup to keep it safe, or import one to restore.
              </div>

              <button onClick={() => { exportData(data); flash("Backup downloaded ✓"); }}
                style={{ ...secondaryBtn, fontSize: 14, padding: "13px 0", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                📥 Export Backup (JSON)
              </button>

              <label style={{ display: "block", marginBottom: 8 }}>
                <input type="file" accept=".json,application/json" style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const imported = await importData(file);
                      if (!imported.quickDefaults) imported.quickDefaults = { milk: 1 };
                      save(imported);
                      flash(`Imported: ${imported.entries.length} entries, ${imported.payments.length} payments ✓`);
                    } catch (err) {
                      flash("⚠️ " + err.message);
                    }
                    e.target.value = "";
                  }}
                />
                <div style={{ ...secondaryBtn, fontSize: 14, padding: "13px 0", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
                  📤 Import Backup
                </div>
              </label>

              <div style={{ borderTop: "1px solid #f0ebe3", marginTop: 8, paddingTop: 14 }}>
                <div style={{ fontSize: 12, color: "#b0a0a0", marginBottom: 8, fontFamily: "var(--mono)" }}>
                  {entries.length} entries · {payments.length} payments · {items.length} products
                </div>
                <button onClick={() => { if (confirm("Delete ALL entries, payments, and custom items? This cannot be undone. Make sure you exported a backup first.")) { save({ ...DEFAULT_STATE }); flash("All data cleared"); } }}
                  style={{ ...secondaryBtn, color: "#c47070", borderColor: "#e8c8c8", fontSize: 13 }}>
                  Reset Everything
                </button>
              </div>
            </div>

            {/* App info */}
            <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
              <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "#c8c0b4" }}>Dairy Ledger v1.0</div>
              <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "#d8d0c4", marginTop: 2 }}>No account needed · Data stays on your device</div>
            </div>
          </>
        )}
      </div>

      {/* ─── Item Modal ─── */}
      {itemModal && (
        <Modal title={itemModal === "new" ? "Add Product" : `Edit ${itemModal.name}`} onClose={() => setItemModal(null)}>
          <label style={{ fontSize: 12, fontFamily: "var(--mono)", opacity: 0.45, display: "block", marginBottom: 4 }}>Emoji</label>
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {EMOJI_OPTIONS.map(e => (
              <button key={e} onClick={() => setItemForm(f => ({ ...f, emoji: e }))}
                style={{ fontSize: 22, padding: "6px 8px", borderRadius: 8, border: itemForm.emoji === e ? "2px solid #2d4a2d" : "2px solid #e4ddd3", background: itemForm.emoji === e ? "#e0f0e0" : "#fff", cursor: "pointer" }}>
                {e}
              </button>
            ))}
          </div>

          <label style={{ fontSize: 12, fontFamily: "var(--mono)", opacity: 0.45, display: "block", marginBottom: 4 }}>Product Name</label>
          <input value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Curd, Butter" style={{ ...inp, marginBottom: 14 }} />

          <label style={{ fontSize: 12, fontFamily: "var(--mono)", opacity: 0.45, display: "block", marginBottom: 4 }}>Unit Type</label>
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {UNIT_OPTIONS.map((u, i) => (
              <button key={i} onClick={() => setItemForm(f => ({ ...f, unitIdx: i }))}
                style={{
                  padding: "8px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                  background: itemForm.unitIdx === i ? "#2d4a2d" : "#f0ebe3",
                  color: itemForm.unitIdx === i ? "#e8f5e0" : "#6a6050",
                  border: "none", fontFamily: "var(--body)",
                }}>{u.label}</button>
            ))}
          </div>

          <label style={{ fontSize: 12, fontFamily: "var(--mono)", opacity: 0.45, display: "block", marginBottom: 4 }}>Rate (₹ per {UNIT_OPTIONS[itemForm.unitIdx].unit})</label>
          <input type="number" value={itemForm.rate} onChange={e => setItemForm(f => ({ ...f, rate: e.target.value }))} placeholder="0" style={{ ...inp, marginBottom: 18 }} />

          <button onClick={saveItem} style={{ ...primaryBtn, marginBottom: 10 }}>{itemModal === "new" ? "Add Product" : "Save Changes"}</button>

          {itemModal !== "new" && (
            <button onClick={() => { if (confirm(`Delete ${itemModal.name}?`)) deleteItem(itemModal.id); }}
              style={{ ...secondaryBtn, color: "#c47070", borderColor: "#e8c8c8", fontSize: 13 }}>
              Delete Product
            </button>
          )}
        </Modal>
      )}

      {/* ─── Bottom Tabs ─── */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480,
        background: "rgba(255,255,255,0.94)", backdropFilter: "blur(12px)", borderTop: "1px solid #e4ddd3",
        display: "flex", justifyContent: "space-around", padding: "6px 0 env(safe-area-inset-bottom, 8px)", zIndex: 100,
      }}>
        {tabList.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            padding: "8px 16px", borderRadius: 10, color: tab === t.id ? "#2d4a2d" : "#b0a898",
            fontFamily: "var(--body)", fontSize: 10, fontWeight: 600, transition: "color 0.15s",
          }}>
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

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        input:focus { border-color: #3a5a3a !important; box-shadow: 0 0 0 3px rgba(45,74,45,0.08); }
        button:active { transform: scale(0.97); }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        input[type="date"] { min-height: 46px; }
      `}</style>
    </div>
  );
}
