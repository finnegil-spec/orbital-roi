 import React, { useState } from "react";
import ChainROI from "./components/ChainROI";
import UserGuide from "./components/UserGuide";
import "./styles.css";

export type Currency = "NOK" | "EUR" | "USD" | "ZAR";

export default function App() {
  const [tab, setTab] = useState<"sim" | "guide">("sim");
  const [currency, setCurrency] = useState<Currency>("NOK");

  return (
    <div>
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--panel)",
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setTab("sim")}
            className="tab-btn"
            data-active={tab === "sim"}
          >
            Simulator
          </button>
          <button
            onClick={() => setTab("guide")}
            className="tab-btn"
            data-active={tab === "guide"}
          >
            User Guide
          </button>
        </div>

        {/* Currency selector (no decimals anywhere) */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "var(--muted)" }}>Currency</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            style={{
              padding: "8px 10px",
              background: "#0f1726",
              border: "1px solid var(--border)",
              color: "var(--text)",
              borderRadius: 8,
            }}
          >
            <option value="NOK">NOK</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="ZAR">ZAR</option>
          </select>
        </div>
      </div>

      {/* Active view */}
      {tab === "sim" ? <ChainROI currency={currency} /> : <UserGuide />}
    </div>
  );
}

