import React from "react";

export default function UserGuide() {
  return (
    <div className="app-container">
      <h1>User Guide</h1>
      <p style={{ color: "var(--muted)" }}>
        This page explains how the Chain ROI Simulator interprets each input and how to read the results.
      </p>

      <h3>Currency</h3>
      <p>
        Choose NOK, EUR, USD or ZAR (South African Rand). Values are shown without decimals. The tool does not convert
        amounts automatically; it assumes you enter values in the currency you select.
      </p>

      <h3>Key Inputs</h3>
      <ul>
        <li><strong>Stores in chain</strong> — total number of stores.</li>
        <li><strong>Annual revenue per store</strong> — average store turnover per year.</li>
        <li><strong>Annual subscription fee per store</strong> — your annual solution/platform cost per store.</li>
        <li><strong>Discount rate</strong> — used for NPV (e.g., WACC 8–12%).</li>
      </ul>

      <h3>Value Drivers (per store)</h3>
      <ul>
        <li><strong>Baseline gross margin</strong> — gross margin % on base sales before improvements.</li>
        <li><strong>Sales uplift %</strong> — expected sales growth driven by loyalty & trust.</li>
        <li><strong>Margin improvement (pp)</strong> — extra gross margin percentage points on base revenue.</li>
        <li><strong>Waste/shrink reduction %</strong> — direct savings assumed.</li>
        <li><strong>Labor/OPEX efficiency %</strong> — proxy for staff/process efficiency savings.</li>
        <li><strong>Compliance saving</strong> — fixed annual saving per store (e.g., audits, reporting).</li>
      </ul>

      <h3>Adoption</h3>
      <p>
        Enter what percentage of stores realize the value each year (Y1, Y2, Y3). The model scales both benefits and
        subscription costs by the same adoption.
      </p>

      <h3>Calculations (transparent)</h3>
      <pre style={{ whiteSpace: "pre-wrap" }}>
{`perStoreBenefit =
  revenue * salesUplift% * (baselineMargin + marginPP)
+ revenue * marginPP
+ revenue * wasteReduction%
+ revenue * laborEfficiency%
+ complianceSaving

perStoreCost = subscriptionFee

Year n cash flow (chain) = (stores * adoption_n) * (perStoreBenefit - perStoreCost)
NPV = sum(year_n_cash_flow / (1 + r)^n)
ROI = NPV / NPV(costs)  (cost NPV uses the same adoption schedule)
Payback (years) = the first year when cumulative undiscounted cash flow >= 0`}
      </pre>

      <h3>Notes</h3>
      <ul>
        <li>Model is intentionally conservative and easy to explain.</li>
        <li>If you need currency conversion, keep the same structure and multiply inputs by a rate you control.</li>
        <li>All values are displayed without decimals for board-level readability.</li>
      </ul>
    </div>
  );
}
