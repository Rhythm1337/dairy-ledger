import type { CSSProperties } from "react";

// Shared inline-style building blocks, ported verbatim from the prototype so the
// visual design is preserved exactly. CSS custom properties (--body/--serif/--mono)
// are defined on the app root in globals.css.

export const inp: CSSProperties = {
  background: "#faf8f5",
  border: "1.5px solid #ddd7cc",
  borderRadius: 10,
  padding: "12px 14px",
  fontSize: 16,
  fontFamily: "var(--body)",
  color: "#3a3226",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

export const primaryBtn: CSSProperties = {
  background: "linear-gradient(135deg, #2d4a2d 0%, #3d5e3d 100%)",
  color: "#e8f5e0",
  border: "none",
  borderRadius: 12,
  padding: "14px 0",
  fontSize: 16,
  fontWeight: 600,
  fontFamily: "var(--body)",
  cursor: "pointer",
  width: "100%",
};

export const secondaryBtn: CSSProperties = {
  background: "#f0ebe3",
  color: "#6a6050",
  border: "1px solid #ddd7cc",
  borderRadius: 12,
  padding: "14px 0",
  fontSize: 15,
  fontWeight: 500,
  fontFamily: "var(--body)",
  cursor: "pointer",
  width: "100%",
};
