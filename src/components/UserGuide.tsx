 import React from "react";

export default function UserGuide() {
  return (
    <div className="app-container">
      <h1>User Guide</h1>
      <p style={{ color: "var(--muted)" }}>
        This page explains how the Chain ROI Simulator interprets each input and
        how to read the results. All values are assumed to be entered in the
        currently selected currency. The tool <strong>does not</strong> convert
        between currencies.
      </p>

      <h3>Currency</h3>
      <p>
        Choose NOK, EUR, USD or ZAR (South African Rand). Values are shown
        without decimals to keep results easy to compare and present.
      </p>

      <h3>Key Inputs</h3>
      <ul>
        <li>
          <strong>Stores</strong> – total number of stores in the chain.
        </li>
        <li>
          <strong>Annual revenue per store</strong> – average store turnover per year.
        </li>
        <li>
          <strong>Annual subscription per store</strong> – platform cost per store per year.
        </li>
        <li>
          <strong>Discount rate (WACC)</strong> – used to discount future cash flows (NPV).
        </li>
        <li>
          <strong>Gross margin +pp</strong> – baseline gross margin used to turn uplifted
          sales into contribution.
        </li>
        <li>
          <strong>Sales uplift (%)</strong> – expected uplift in sales driven by loyalty/AI.
        </li>
        <li>
          <strong>Labour efficiency (%)</strong> – operations efficiency saving.
        </li>
        <li>
          <strong>Wastage reduction (%)</strong> – shrink/waste saving.
        </li>
        <li>
          <strong>Compliance saving</strong> – fixed annual saving per store.
        </li>
        <li>
          <strong>Adoption Year 1–3</strong> – ramp-up of the effect across the chain.
        </li>
      </ul>

      <h3>Outputs</h3>
      <ul>
        <li>
          <strong>ROI (full effect)</strong> – NPV of total benefits divided by PV of
          subscription costs, minus 1.
        </li>
        <li>
          <strong>NPV – chain (3 years)</strong> – discounted net benefit across 3 years.
        </li>
        <li>
          <strong>Incremental cash flow per store (discounted)</strong> – year-by-year
          discounted net benefit per store with the chosen adoption ramp.
        </li>
      </ul>

      <h3>Notes</h3>
      <ul>
        <li>
          The model is intentionally simple so you can communicate assumptions
          clearly. Adjust inputs to stress-test scenarios (worst/base/best).
        </li>
        <li>
          Currency display uses no decimals; internal math keeps precision where
          needed.
        </li>
      </ul>
    </div>
  );
}
