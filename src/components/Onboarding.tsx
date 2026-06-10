"use client";

import { useEffect, useLayoutEffect, useState, type CSSProperties } from "react";
import { primaryBtn, secondaryBtn } from "@/lib/styles";

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

// Each step points at a real element on the page (by id) and explains it.
const STEPS = [
  { target: "tour-quickadd", title: "Quick add", body: "Set today's milk with the minus and plus, then press Add. That's your daily entry done." },
  { target: "tour-tab-add", title: "Add anything", body: "Open the Add tab to log other items, set exact amounts, or pick a past date." },
  { target: "tour-tab-history", title: "Check the bill", body: "History keeps every month. Tap Verify to compare the dairy's bill against your own total." },
  { target: "tour-tab-settings", title: "Products and backup", body: "In Settings, add your own products and rates, and export a backup to stay safe." },
];

export default function Onboarding({ onDone, goHome }: { onDone: () => void; goHome?: () => void }) {
  const [step, setStep] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [vh, setVh] = useState(0);
  const isLast = step === STEPS.length - 1;
  const s = STEPS[step];

  // Step 1 lives on the Home screen, so make sure we're there when the tour starts.
  useEffect(() => {
    goHome?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Measure the current target. Re-measure across a few frames so it settles
  // after tab switches / layout changes, and on resize/scroll.
  useLayoutEffect(() => {
    let raf = 0;
    const timers: number[] = [];
    const measure = () => {
      setVh(window.innerHeight);
      const el = document.getElementById(s.target);
      if (el) {
        const r = el.getBoundingClientRect();
        setBox({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setBox(null);
      }
    };
    measure();
    raf = requestAnimationFrame(measure);
    timers.push(window.setTimeout(measure, 120));
    timers.push(window.setTimeout(measure, 320));
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [s.target]);

  const pad = 8;
  const hole = box ? { top: box.top - pad, left: box.left - pad, width: box.width + pad * 2, height: box.height + pad * 2 } : null;
  const below = hole && vh ? hole.top < vh / 2 : true;
  const next = () => (isLast ? onDone() : setStep((p) => p + 1));

  const tipPos: CSSProperties = hole
    ? below
      ? { top: hole.top + hole.height + 14 }
      : { bottom: vh - hole.top + 14 }
    : { top: "50%", transform: "translateY(-50%)" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, fontFamily: "var(--body)" }}>
      {/* Click blocker (also the dim layer when no target is found) */}
      <div style={{ position: "fixed", inset: 0, background: hole ? "transparent" : "rgba(26,30,26,0.72)", animation: "fadeIn 0.2s ease" }} />

      {/* Spotlight: transparent box over the target, dimming everything else */}
      {hole && (
        <div
          style={{
            position: "fixed",
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
            borderRadius: 12,
            boxShadow: "0 0 0 9999px rgba(26,30,26,0.72)",
            border: "2px solid #8fdf8f",
            pointerEvents: "none",
            transition: "top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease",
          }}
        />
      )}

      {/* Skip */}
      <button
        onClick={onDone}
        style={{ position: "fixed", top: 16, right: 16, zIndex: 2, background: "rgba(255,255,255,0.14)", border: "none", color: "#e8f5e0", fontSize: 12, fontFamily: "var(--mono)", letterSpacing: 0.5, textTransform: "uppercase", padding: "8px 14px", borderRadius: 8, cursor: "pointer" }}
      >
        Skip
      </button>

      {/* Tooltip card */}
      <div
        style={{
          position: "fixed",
          left: 16,
          right: 16,
          maxWidth: 360,
          margin: "0 auto",
          zIndex: 2,
          background: "#fff",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 10px 36px rgba(0,0,0,0.32)",
          animation: "fadeInUp 0.25s ease",
          ...tipPos,
        }}
      >
        <div style={{ fontSize: 11, fontFamily: "var(--mono)", letterSpacing: 1.5, textTransform: "uppercase", color: "#a09888", marginBottom: 6 }}>
          Step {step + 1} of {STEPS.length}
        </div>
        <h2 style={{ fontSize: 19, fontFamily: "var(--serif)", fontWeight: 900, color: "#2d4a2d", margin: "0 0 8px" }}>{s.title}</h2>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: "#6a6050", margin: "0 0 16px" }}>{s.body}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 6, flex: 1 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ width: i === step ? 18 : 7, height: 7, borderRadius: 4, background: i === step ? "#2d4a2d" : "#ddd7cc", transition: "all 0.2s" }} />
            ))}
          </div>
          {step > 0 && (
            <button onClick={() => setStep((p) => p - 1)} style={{ ...secondaryBtn, width: "auto", padding: "10px 16px", fontSize: 14 }}>
              Back
            </button>
          )}
          <button onClick={next} style={{ ...primaryBtn, width: "auto", padding: "10px 22px", fontSize: 14 }}>
            {isLast ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
