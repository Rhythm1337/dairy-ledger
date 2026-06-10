"use client";

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
}

export default function SettingsTab({ data, items, entries, payments, save, flash, toggleItem, openEditItem, openNewItem }: SettingsTabProps) {
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
            <IconBtn icon="✏️" onClick={() => openEditItem(item)} label="Edit" />
          </div>
        ))}

        <button onClick={openNewItem} style={{ ...secondaryBtn, marginTop: 14, fontSize: 14, padding: "12px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          ＋ Add Product
        </button>
      </div>

      {/* Data / danger zone */}
      <div style={{ background: "#fff", border: "1.5px solid #e4ddd3", borderRadius: 16, padding: "22px 20px", marginBottom: 12, boxShadow: "0 2px 12px rgba(58,50,38,0.05)" }}>
        <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--mono)", letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.45, marginBottom: 14 }}>Your Data</div>
        <div style={{ fontSize: 13, color: "#8a8070", marginBottom: 14, lineHeight: 1.5 }}>All data is saved in your browser. Export a backup to keep it safe, or import one to restore.</div>

        <button
          onClick={() => { exportData(data); flash("Backup downloaded ✓"); }}
          style={{ ...secondaryBtn, fontSize: 14, padding: "13px 0", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          📥 Export Backup (JSON)
        </button>

        <label style={{ display: "block", marginBottom: 8 }}>
          <input
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const imported = await importData(file);
                if (!imported.quickDefaults) imported.quickDefaults = { milk: 1 };
                save(imported);
                flash(`Imported: ${imported.entries.length} entries, ${imported.payments.length} payments ✓`);
              } catch (err) {
                flash("⚠️ " + (err as Error).message);
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
        <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "#c8c0b4" }}>Dairy Ledger v1.0</div>
        <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "#d8d0c4", marginTop: 2 }}>No account needed · Data stays on your device</div>
      </div>
    </>
  );
}
