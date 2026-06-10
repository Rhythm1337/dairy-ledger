"use client";

import { useEffect, useState, type ReactNode } from "react";

export function Badge({ children, color = "#2d6a2d", bg = "#e0f0e0" }: { children: ReactNode; color?: string; bg?: string }) {
  return (
    <span style={{ display: "inline-block", fontSize: 11, fontFamily: "var(--mono)", fontWeight: 600, background: bg, color, borderRadius: 6, padding: "3px 8px", letterSpacing: 0.3 }}>
      {children}
    </span>
  );
}

export function IconBtn({ icon, onClick, label, danger, size = 16 }: { icon: ReactNode; onClick: () => void; label?: string; danger?: boolean; size?: number }) {
  return (
    <button onClick={onClick} title={label} style={{ background: "none", border: "none", fontSize: size, cursor: "pointer", color: danger ? "#c47070" : "#a09888", padding: 6, borderRadius: 6, lineHeight: 1 }}>
      {icon}
    </button>
  );
}

export function Collapsible({ title, badge, children, defaultOpen = true }: { title: ReactNode; badge?: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: "#fff", border: "1px solid #e4ddd3", borderRadius: 14, marginBottom: 12, overflow: "hidden", boxShadow: "0 1px 6px rgba(58,50,38,0.04)" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "14px 18px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--mono)", letterSpacing: 0.6, textTransform: "uppercase", color: "#6a6050", flex: 1 }}>{title}</span>
        {badge}
        <span style={{ fontSize: 12, color: "#b0a898", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
      </button>
      {open && <div style={{ padding: "0 18px 16px", animation: "fadeIn 0.2s ease" }}>{children}</div>}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: ReactNode; onClose: () => void; children: ReactNode }) {
  // Lock background scroll while the modal is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease" }} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          background: "#faf8f5",
          borderRadius: "20px 20px 0 0",
          width: "100%",
          maxWidth: 480,
          maxHeight: "85vh",
          overflow: "auto",
          padding: "24px 20px env(safe-area-inset-bottom, 20px)",
          animation: "modalUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--serif)" }}>{title}</span>
          <button onClick={onClose} style={{ background: "#f0ebe3", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 16, cursor: "pointer", color: "#8a8070" }}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
