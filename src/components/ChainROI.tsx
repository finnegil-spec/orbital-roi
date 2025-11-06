import React, { useMemo, useState } from "react";

/**
 * Currency formatting without decimals, for NOK / EUR / USD / ZAR.
 * We only change symbol/locale – we do NOT auto-convert amounts.
 * (All numbers are assumed to be in the selected currency.)
 */
const currencyFormat = (currency: "NOK" | "EUR" | "USD" | "ZAR") =>
  new Intl.NumberFormat(
    currency === "NOK"
      ? "nb-NO"
      : currency === "EUR"
      ? "de-DE"
      : currency === "USD"
      ? "en-US"
      : "en-ZA", // ZAR
    { style: "currency", currency, maximumFractionDigits: 0, minimumFractionDigits: 0 }
  );

/** A tiny helper for clamping slider/text inputs */
const num = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

type Currency = "NOK" | "EUR" | "USD" | "ZAR";

interface Props {
  currency: Currency;
}

export default function ChainROI({ currency }: Props) {
  // --- Key inputs (all per STORE unless marked otherwise) ---
  const [stores, setStores] = useState(100);                       // stores in the chain
  const [annualRevenuePerStore, setAnnualRevenuePerStore] = useState(12_000_000); // per store / year
  const [subscriptionFeePerStore, setSubscriptionFeePerStore] = useState(600_000); // per store / year (cost)
  const [discountRatePct, setDiscountRatePct] = useState(10);     // WACC/discount
  const [grossMarginPct, setGrossMarginPct] = useState(32);       // baseline gross margin
  const [salesUpliftPct, setSalesUpliftPct] = useState(1.5);      // uplift in sales (% of revenue)
  const [marginImprovementPP, setMarginImprovementPP] = useState(0.5); // margin improvement (percentage points)
  const [wasteReductionPct, setWasteReductionPct] = useState(0.5); // shrink/waste reduction (% of revenue)
  const [laborEfficiencyPct, setLaborEfficiencyPct] = useState(2.0); // OPEX saving proxy (% of revenue)
  const [complianceSavingPerStore, setComplianceSavingPerStore] = useState(10_000); // fixed saving per store / year

  // Adoption curve (what % of stores realize value each year)
  const [adoptY1Pct, setAdoptY1Pct] = useState(20);
  const [adoptY2Pct, setAdoptY2Pct] = useState(70);
  const [adoptY3Pct, setAdoptY3Pct] = useState(100);

  const fmt = currencyFormat(currency);

  /**
   * Value Model (simple, transparent):
   * Incremental per store per year =
   *   Sales uplift value:
   *      revenue * (salesUplift%) * (baseline margin + marginPP)  (added profit from extra sales)
   *   + Margin improvement:
   *      revenue * (marginPP)                                     (extra margin points on base sales)
   *   + Waste/shrink reduction:
   *      revenue * (wasteReduction%)                               (conservative: treat as direct saving)
   *   + Labor efficiency:
   *      revenue * (laborEfficiency%)                              (proxy for staff/OPEX saving)
   *   + Fixed compliance saving
   *
   * Costs per store per year = subscriptionFeePerStore
   */
  const computed = useMemo(() => {
    const rev = num(annualRevenuePerStore, 0);
    const baseMargin = num(grossMarginPct, 0) / 100;
    const marginPP = num(marginImprovementPP, 0) / 100;

    const salesUplift = rev * (num(salesUpliftPct, 0) / 100) * (baseMargin + marginPP);
    const marginGain = rev * marginPP;
    const wasteSaving = rev * (num(wasteReductionPct, 0) / 100);
    const laborSaving = rev * (num(laborEfficiencyPct, 0) / 100);
    const fixedCompliance = num(complianceSavingPerStore, 0);

    const perStoreBenefit = salesUplift + marginGain + wasteSaving + laborSaving + fixedCompliance;
    const perStoreCost = num(subscriptionFeePerStore, 0);

    // Adoption % per year
    const y1Adopt = num(adoptY1Pct, 0) / 100;
    const y2Adopt = num(adoptY2Pct, 0) / 100;
    const y3Adopt = num(adoptY3Pct, 0) / 100;

    // Discount factor by year (year-end convention)
    const r = num(discountRatePct, 0) / 100;
    const df1 = 1 / (1 + r);
    const df2 = 1 / Math.pow(1 + r, 2);
    const df3 = 1 / Math.pow(1 + r, 3);

    // Chain-level annual cash flows (benefit minus cost)
    const year1 = (stores * y1Adopt) * (perStoreBenefit - perStoreCost);
    const year2 = (stores * y2Adopt) * (perStoreBenefit - perStoreCost);
    const year3 = (stores * y3Adopt) * (perStoreBenefit - perStoreCost);

    const npv = year1 * df1 + year2 * df2 + year3 * df3;

    // ROI = (NPV benefits – NPV costs) / NPV costs.
    // We approximate NPV of costs by applying the same adoption to perStoreCost.
    const costY1 = (stores * y1Adopt) * perStoreCost;
    const costY2 = (stores * y2Adopt) * perStoreCost;
    const costY3 = (stores * y3Adopt) * perStoreCost;
    const npvCosts = costY1 * df1 + costY2 * df2 + costY3 * df3;

    const roi = npvCosts !== 0 ? (npv / npvCosts) : 0;

    // Simple payback: when cumulative undiscounted CF turns positive
    const cum1 = year1;
    const cum2 = year1 + year2;
    const cum3 = year1 + year2 + year3;
    let paybackYears: string | number = "—";
    if (cum1 >= 0) paybackYears = 1;
    else if (cum2 >= 0) paybackYears = 2;
    else if (cum3 >= 0) paybackYears = 3;

    return {
      perStoreBenefit,
      perStoreCost,
      year1,
      year2,
      year3,
      npv,
      roi,
      paybackYears,
      perStoreBreakdown: {
        salesUplift,
        marginGain,
        wasteSaving,
        laborSaving,
        fixedCompliance
      }
    };
  }, [
    stores,
    annualRevenuePerStore,
    subscriptionFeePerStore,
    discountRatePct,
    grossMarginPct,
    salesUpliftPct,
    marginImprovementPP,
    wasteReductionPct,
    laborEfficiencyPct,
    complianceSavingPerStore,
    adoptY1Pct,
    adoptY2Pct,
    adoptY3Pct
  ]);

  return (
    <div className="app-container">
      <h1>Orbital Chain ROI Simulator</h1>

      {/* --- Currency is managed by parent (App) --- */}
      <p style={{ marginTop: -8, color: "var(--muted)" }}>
        Currency: <strong>{currency}</strong> (no decimals)
      </p>

      {/* GRID: Inputs left, Results right */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* LEFT: Key Inputs */}
        <section>
          <h3 style={{ marginBottom: 8 }}>Key Inputs</h3>

          <Field label="Stores in chain" tooltip="Total number of stores in the chain.">
            <input type="number" value={stores} onChange={(e) => setStores(num(e.target.value, stores))} />
          </Field>

          <Field
            label={`Annual revenue per store (${currency})`}
            tooltip="Average store turnover per year."
          >
            <input
              type="number"
              value={annualRevenuePerStore}
              onChange={(e) => setAnnualRevenuePerStore(num(e.target.value, annualRevenuePerStore))}
            />
          </Field>

          <Field
            label={`Annual subscription fee per store (${currency})`}
            tooltip="Your annual platform/solution fee per store (treated as a cost)."
          >
            <input
              type="number"
              value={subscriptionFeePerStore}
              onChange={(e) => setSubscriptionFeePerStore(num(e.target.value, subscriptionFeePerStore))}
            />
          </Field>

          <Field
            label="Discount rate (%)"
            tooltip="Used for NPV. Typical WACC 8–12%."
          >
            <input
              type="number"
              value={discountRatePct}
              onChange={(e) => setDiscountRatePct(num(e.target.value, discountRatePct))}
            />
          </Field>

          <hr />

          <h4 style={{ margin: "8px 0" }}>Value Drivers (per store)</h4>

          <Field label="Baseline gross margin (%)" tooltip="Gross margin on base sales before improvement.">
            <input
              type="number"
              value={grossMarginPct}
              onChange={(e) => setGrossMarginPct(num(e.target.value, grossMarginPct))}
            />
          </Field>

          <Field label="Sales uplift (%)" tooltip="Expected sales growth thanks to loyalty & trust.">
            <input
              type="number"
              step="0.1"
              value={salesUpliftPct}
              onChange={(e) => setSalesUpliftPct(num(e.target.value, salesUpliftPct))}
            />
          </Field>

          <Field label="Margin improvement (pp)" tooltip="Gross margin delta in percentage points (e.g., +1.5 = +1.5pp).">
            <input
              type="number"
              step="0.1"
              value={marginImprovementPP}
              onChange={(e) => setMarginImprovementPP(num(e.target.value, marginImprovementPP))}
            />
          </Field>

          <Field label="Waste/shrink reduction (%)" tooltip="Direct saving (conservative assumption).">
            <input
              type="number"
              step="0.1"
              value={wasteReductionPct}
              onChange={(e) => setWasteReductionPct(num(e.target.value, wasteReductionPct))}
            />
          </Field>

          <Field label="Labor/OPEX efficiency (%)" tooltip="Proxy for staff or process efficiency gains.">
            <input
              type="number"
              step="0.1"
              value={laborEfficiencyPct}
              onChange={(e) => setLaborEfficiencyPct(num(e.target.value, laborEfficiencyPct))}
            />
          </Field>

          <Field label={`Compliance savings per store (${currency})`} tooltip="Fixed annual savings from compliance automation.">
            <input
              type="number"
              value={complianceSavingPerStore}
              onChange={(e) => setComplianceSavingPerStore(num(e.target.value, complianceSavingPerStore))}
            />
          </Field>

          <hr />

          <h4 style={{ margin: "8px 0" }}>Adoption (% of stores live)</h4>

          <Field label="Year 1 adoption (%)" tooltip="Share of stores realizing the value in year 1.">
            <input type="number" value={adoptY1Pct} onChange={(e) => setAdoptY1Pct(num(e.target.value, adoptY1Pct))} />
          </Field>
          <Field label="Year 2 adoption (%)" tooltip="Share of stores realizing the value in year 2.">
            <input type="number" value={adoptY2Pct} onChange={(e) => setAdoptY2Pct(num(e.target.value, adoptY2Pct))} />
          </Field>
          <Field label="Year 3 adoption (%)" tooltip="Share of stores realizing the value in year 3.">
            <input type="number" value={adoptY3Pct} onChange={(e) => setAdoptY3Pct(num(e.target.value, adoptY3Pct))} />
          </Field>
        </section>

        {/* RIGHT: Results */}
        <section>
          <h3 style={{ marginBottom: 8 }}>Results</h3>

          <Card title="ROI (3-year, NPV-based)">
            <Big>{(computed.roi * 100).toFixed(1)}%</Big>
            <small>ROI = NPV / NPV(costs)</small>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Card title="Payback (years)">
              <Big>{computed.paybackYears}</Big>
              <small>Undiscounted cumulative cash flow</small>
            </Card>
            <Card title={`NPV (3 yrs, chain) – ${currency}`}>
              <Big>{fmt.format(Math.round(computed.npv))}</Big>
            </Card>
          </div>

          <hr />

          <h4>Incremental cash flow (chain)</h4>
          <ul style={{ marginTop: 8, lineHeight: 1.8 }}>
            <li>Year 1: <strong>{fmt.format(Math.round(computed.year1))}</strong></li>
            <li>Year 2: <strong>{fmt.format(Math.round(computed.year2))}</strong></li>
            <li>Year 3: <strong>{fmt.format(Math.round(computed.year3))}</strong></li>
          </ul>

          <h4 style={{ marginTop: 16 }}>Per store – annual value breakdown</h4>
          <ul style={{ marginTop: 8, lineHeight: 1.8 }}>
            <li>Sales uplift value: <strong>{fmt.format(Math.round(computed.perStoreBreakdown.salesUplift))}</strong></li>
            <li>Margin improvement: <strong>{fmt.format(Math.round(computed.perStoreBreakdown.marginGain))}</strong></li>
            <li>Waste/shrink reduction: <strong>{fmt.format(Math.round(computed.perStoreBreakdown.wasteSaving))}</strong></li>
            <li>Labor/OPEX efficiency: <strong>{fmt.format(Math.round(computed.perStoreBreakdown.laborSaving))}</strong></li>
            <li>Compliance saving: <strong>{fmt.format(Math.round(computed.perStoreBreakdown.fixedCompliance))}</strong></li>
          </ul>

          <div style={{ marginTop: 12 }}>
            <small style={{ color: "var(--muted)" }}>
              Note: This model is intentionally simple and conservative. Sales uplift uses
              <em> (baseline margin + margin pp)</em> on incremental sales. Margin pp applies on base revenue.
              Waste & labor are treated as direct savings. All currency values show no decimals.
            </small>
          </div>
        </section>
      </div>
    </div>
  );
}

/** Small presentational helpers */
function Field({
  label,
  tooltip,
  children
}: {
  label: string;
  tooltip?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "block", marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>{label}</span>
        {tooltip && <span title={tooltip} style={{ color: "var(--muted)" }}>ⓘ</span>}
      </div>
      <div style={{ marginTop: 6 }}>{children}</div>
    </label>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        background: "var(--panel)",
        borderRadius: 12,
        padding: 16
      }}
    >
      <div style={{ color: "var(--muted)", marginBottom: 4 }}>{title}</div>
      {children}
    </div>
  );
}

function Big({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 28, fontWeight: 700 }}>{children}</div>;
}

