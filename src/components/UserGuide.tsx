import React from "react";

export default function UserGuide() {
  return (
    <div className="app-container">
      <h1>User Guide</h1>
      <p style={{ color: "var(--muted)" }}>
        This page explains how the Chain ROI Simulator interprets each input and
        how to read the results. All values are shown without decimals.
      </p>

      <h3>Currency</h3>
      <p>
        Choose NOK, EUR, USD, or ZAR (South African Rand). The tool does not
        auto-convert amounts. Enter values in the currency you selected.
      </p>

      <h3>Key Inputs</h3>
      <ul>
        <li><strong>Stores in chain:</strong> total number of stores.</li>
        <li><strong>Annual revenue per store:</strong> average yearly turnover per store.</li>
        <li><strong>Annual subscription per store:</strong> your platform cost per store per year.</li>
        <li><strong>Baseline gross margin:</strong> current gross margin %.</li>
        <li><strong>Sales uplift:</strong> expected % sales increase from loyalty/automation.</li>
        <li><strong>Shrink reduction:</strong> expected % reduction in shrink/waste.</li>
        <li><strong>Ops efficiency:</strong> expected % operating cost efficiency.</li>
        <li><strong>Compliance savings / store / year:</strong> fixed saving per store.</li>
        <li><strong>Adoption Y1/Y2/Y3:</strong> % of stores using the solution per year.</li>
        <li><strong>Discount rate (WACC):</strong> used to calculate NPV.</li>
      </ul>

      <h3>Outputs</h3>
      <ul>
        <li><strong>ROI (full effect)</strong></li>
        <li><strong>Payback (years)</strong></li>
        <li><strong>NPV (3 years)</strong></li>
        <li><strong>Incremental cash flow per store (per year)</strong></li>
      </ul>
    </div>
  );
}
