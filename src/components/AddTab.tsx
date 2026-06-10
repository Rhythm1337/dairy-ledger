"use client";

import type { Dispatch, SetStateAction } from "react";
import { fmt, itemCost, todayStr } from "@/lib/utils";
import { inp, primaryBtn, secondaryBtn } from "@/lib/styles";
import type { EntryForm, Item } from "@/lib/types";

interface AddTabProps {
  items: Item[];
  activeItems: Item[];
  form: EntryForm;
  setForm: Dispatch<SetStateAction<EntryForm>>;
  editId: string | null;
  setEditId: (id: string | null) => void;
  addEntry: () => void;
}

export default function AddTab({ items, activeItems, form, setForm, editId, setEditId, addEntry }: AddTabProps) {
  return (
    <div style={{ background: "#fff", border: "1.5px solid #e4ddd3", borderRadius: 16, padding: "22px 20px", boxShadow: "0 2px 12px rgba(58,50,38,0.05)" }}>
      <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--mono)", letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.45, marginBottom: 16 }}>
        {editId ? "Edit Entry" : "New Entry"}
      </div>

      <label style={{ fontSize: 12, fontFamily: "var(--mono)", letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.45, display: "block", marginBottom: 6 }}>Date</label>
      <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} style={{ ...inp, marginBottom: 16 }} />

      {activeItems.map((item) => (
        <div key={item.id} style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontFamily: "var(--mono)", letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.45, display: "block", marginBottom: 6 }}>
            {item.emoji} {item.name} ({item.entryUnit})
          </label>
          <input
            type="number"
            step={item.step}
            placeholder={`Type any amount in ${item.entryUnit}`}
            value={form.quantities[item.id] || ""}
            onChange={(e) => setForm((f) => ({ ...f, quantities: { ...f.quantities, [item.id]: e.target.value } }))}
            style={{ ...inp, marginBottom: 8 }}
          />
          {item.presets.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {item.presets.map((v) => (
                <button
                  key={v}
                  onClick={() => setForm((f) => ({ ...f, quantities: { ...f.quantities, [item.id]: v.toString() } }))}
                  style={{
                    background: (form.quantities[item.id] || "") === v.toString() ? "#2d4a2d" : "#f0ebe3",
                    color: (form.quantities[item.id] || "") === v.toString() ? "#e8f5e0" : "#6a6050",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 8px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    flex: "1 1 auto",
                    minWidth: 44,
                    fontFamily: "var(--mono)",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
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
        {editId && (
          <button onClick={() => { setEditId(null); setForm({ date: todayStr(), quantities: {} }); }} style={{ ...secondaryBtn, width: "auto", padding: "14px 20px" }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
