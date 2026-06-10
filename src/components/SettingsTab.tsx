"use client";

import { useState } from "react";
import { IconBtn } from "./ui";
import { exportData, importData } from "@/lib/storage";
import { DEFAULT_STATE } from "@/lib/constants";
import { secondaryBtn } from "@/lib/styles";
import type { AppData, Item, SaveFn } from "@/lib/types";

interface SettingsTabProps {
  data: AppData;
  items: Item[];
  entries: AppData["entries"];
  payments: AppData["payments"];
  save: SaveFn;
  flash: (msg: string) => void;
  toggleItem: (id: string) => void;
  openEditItem: (item: Item) => void;
  openNewItem: () => void;
  onReplayIntro: () => void;
}

export default function SettingsTab({ data, items, entries, payments, save, flash, toggleItem, openEditItem, openNewItem, onReplayIntro }: SettingsTabProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") {
      flash("Please choose a .json backup file");
      return;
    }
    try {
      const imported = await importData(file);
      if (!imported.quickDefaults) imported.quickDefaults = { milk: 1 };
      save(imported);
      flash(`Imported ${imported.entries.length} entries and ${imported.payments.length} payments`);
    } catch (err) {
      flash((err as Error).message);
    }
  };

  return (
    <>
      <div style={{ background: "#fff", border: "1.5px solid #e4ddd3", borderRadius: 16, padding: "22px 20px", marginBottom: 12, boxShadow: "0 2px 12px rgba(58,50,38,0.05)" }}>
        <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--mono)", letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.45, marginBottom: 16 }}>Products &amp; Rates</div>

        {items.map((item) => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: "1px solid #f0ebe3", opacity: item.enabled ? 1 : 0.45 }}>
            <span style={{ fontSize: 22 }}>{item.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{item.name}</div>
              <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "#8a8070" }}>₹{item.rate}/{item.unit} · enter in {item.entryUnit}</div>
            </div>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <div
                onClick={() => toggleItem(item.id)}
                style={{ width: 44, height: 26, borderRadius: 13, padding: 3, background: item.enabled ? "#2d6a2d" : "#d4cfc6", transition: "background 0.2s", cursor: "pointer" }}
              >
                <div style={{ width: 20, height: 20, borderRadius: 10, background: "#fff", transition: "transform 0.2s", transform: item.enabled ? "translateX(18px)" : "translateX(0)" }} />
              </div>
            </label>
            <IconBtn icon="Edit" onClick={() => openEditItem(item)} label="Edit" size={13} />
          </div>
        ))}

        <button onClick={openNewItem} style={{ ...secondaryBtn, marginTop: 14, fontSize: 14, padding: "12px 0" }}>
          Add Product
        </button>
      </div>

      {/* Data / backup — also a drop target for restoring a backup */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
        style={{
          background: dragOver ? "#f0f5f0" : "#fff",
          border: dragOver ? "1.5px dashed #2d4a2d" : "1.5px solid #e4ddd3",
          borderRadius: 16,
          padding: "22px 20px",
          marginBottom: 12,
          boxShadow: "0 2px 12px rgba(58,50,38,0.05)",
          transition: "background 0.15s, border-color 0.15s",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--mono)", letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.45, marginBottom: 14 }}>Your Data</div>
        <div style={{ fontSize: 13, color: "#8a8070", marginBottom: 14, lineHeight: 1.5 }}>
          All data is saved in your browser. Export a backup to keep it safe, or import one to restore. You can also drag a backup file onto this card.
        </div>

        <button
          onClick={() => { exportData(data); flash("Backup downloaded"); }}
          style={{ ...secondaryBtn, fontSize: 14, padding: "13px 0", marginBottom: 8 }}
        >
          Export Backup (JSON)
        </button>

        <label style={{ display: "block", marginBottom: 8 }}>
          <input
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }}
          />
          <div style={{ ...secondaryBtn, fontSize: 14, padding: "13px 0", textAlign: "center", cursor: "pointer" }}>
            Import Backup
          </div>
        </label>

        <div
          style={{
            border: `1.5px dashed ${dragOver ? "#2d4a2d" : "#ddd7cc"}`,
            borderRadius: 12,
            padding: "18px 16px",
            textAlign: "center",
            color: dragOver ? "#2d4a2d" : "#a09888",
            fontSize: 13,
            fontFamily: "var(--mono)",
            marginBottom: 8,
            transition: "color 0.15s, border-color 0.15s",
          }}
        >
          {dragOver ? "Drop to restore backup" : "Drag a backup file here to restore"}
        </div>

        <div style={{ borderTop: "1px solid #f0ebe3", marginTop: 8, paddingTop: 14 }}>
          <div style={{ fontSize: 12, color: "#b0a0a0", marginBottom: 8, fontFamily: "var(--mono)" }}>
            {entries.length} entries · {payments.length} payments · {items.length} products
          </div>
          <button
            onClick={() => {
              if (confirm("Delete ALL entries, payments, and custom items? This cannot be undone. Make sure you exported a backup first.")) {
                save({ ...DEFAULT_STATE });
                flash("All data cleared");
              }
            }}
            style={{ ...secondaryBtn, color: "#c47070", borderColor: "#e8c8c8", fontSize: 13 }}
          >
            Reset Everything
          </button>
        </div>
      </div>

      {/* App info */}
      <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
        <button
          onClick={onReplayIntro}
          style={{ background: "none", border: "none", color: "#a09888", fontSize: 13, fontFamily: "var(--mono)", textDecoration: "underline", cursor: "pointer", padding: 8, marginBottom: 8 }}
        >
          Show welcome screen again
        </button>
        <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "#c8c0b4" }}>Dairy Ledger v1.0</div>
        <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "#d8d0c4", marginTop: 2 }}>No account needed · Data stays on your device</div>
      </div>
    </>
  );
}
