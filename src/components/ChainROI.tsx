 import React, { useMemo, useState } from "react";

/** Keep this in sync with App.tsx’s currency union */
type Currency = "NOK" | "EUR" | "USD" | "ZAR";

/* ----------------------------- Format helpers ----------------------------- */

/** Currency formatter: no decimals, only group separators. */
function currencyFormatter(currency: Currency) {
  const locale =
    currency === "NOK" ? "nb-NO" :
    currency === "EUR" ? "de-DE" :
    currency === "USD" ? "en-US" :
    "en-ZA"; // ZAR

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  });
}
const pct = (x: number) => `${(isFinite(x) ? x : 0).toFixed(1)}%`;

/** Accept comma or dot; strip spaces; prevent leading “0x…” → “x…” */
function parseNum(s: string, fallback = 0): number {
  if (typeof s !== "string") return fallback;
  const cleaned = s.trim().replace(/\s+/g, "").replace(",", ".");
  const n = Number(cleaned);
  return isFinite(n) ? n : fallback;
}

/* ---------------------------- Little UI helpers --------------------------- */

const FieldLine: React.FC<{
  label: string;
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  requiredForStore?: boolean;
  info?: string;
  type?: "text" | "number";
}> = ({ label, value, onChange, placeholder, requiredForStore, info, type = "text" }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <label style={{ color: "var(--muted)" }}>{label}</label>
        {requiredForStore && (
          <span
            style={{
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 999,
              border: "1px solid var(--border)",
              background: "#0f1726",
              color: "var(--accent)",
              letterSpacing: ".02em"
            }}
          >
            STORE INPUT
          </span>
        )}
        {info && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            title="More info"
            style={{
              border: "1px solid var(--border)",
              background: "#0f1726",
              color: "var(--text)",
              width: 18, height: 18,
              lineHeight: "16px", fontSize: 11,
              borderRadius: 6, cursor: "pointer"
            }}
          >
            i
          </button>
        )}
      </div>

      {open && info && (
        <div
          style={{
            marginBottom: 8,
            background: "#0f1726",
            border: "1px solid var(--border)",
            padding: 10,
            borderRadius: 8,
            color: "var(--muted)",
            fontSize: 12
          }}
        >
          {info}
        </div>
      )}

      <input
        inputMode="decimal"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          // prevent “0x” when first char is 0 and second is digit
          let next = e.target.value;
          if (/^0\d/.test(next)) next = next.replace(/^0+/, "");
          onChange(next);
        }}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "#0f1726",
          color: "var(--text)"
        }}
      />
    </div>
  );
};

const KpiCard: React.FC<{
  title: string;
  value: React.ReactNode;
  sub?: string;
  info?: string;
  danger?: boolean;
}> = ({ title, value, sub, info, danger }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="kpi">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {info && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            title="What does this mean?"
            style={{
              border: "1px solid var(--border)",
              background: "#0f1726",
              color: "var(--text)",
              width: 18, height: 18,
              lineHeight: "16px", fontSize: 11,
              borderRadius: 6, cursor: "pointer"
            }}
          >
            i
          </button>
        )}
      </div>

      {open && info && (
        <div
          style={{
            marginTop: 8,
            marginBottom: 8,
            background: "#0f1726",
            border: "1px solid var(--border)",
            padding: 10,
            borderRadius: 8,
            color: "var(--muted)",
            fontSize: 12
          }}
        >
          {info}
        </div>
      )}

      <div className="big" style={{ color: danger ? "#ff7a7a" : undefined }}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
};

/* -------------------------------- Component -------------------------------- */

export default function ChainROI({ currency }: { currency: Currency }) {
  const cur = currencyFormatter(currency);

  /* ------------------------------ Store inputs ------------------------------ */
  // (Store should fill these)
  const [stores, setStores] = useState("100");
  const [revPerStore, setRevPerStore] = useState("1200000");          // annual revenue/store
  const [subPerStore, setSubPerStore] = useState("600000");           // annual subscription/store (cost)
  const [discountRate, setDiscountRate] = useState("10");             // WACC %

  /* -------------------------- Value drivers per store ----------------------- */
  const [baselineMarginPct, setBaselineMarginPct] = useState("32");
  const [salesUpliftPct, setSalesUpliftPct]       = useState("1,5");   // accepts comma
  const [marginImprovementPP, setMarginImprovementPP] = useState("0,5");
  const [wasteReductionPct, setWasteReductionPct] = useState("0,5");
  const [laborEfficiencyPct, setLaborEfficiencyPct] = useState("2");
  const [complianceSaving, setComplianceSaving] = useState("10000");   // currency

  /* ------------------------------ Adoption curve ---------------------------- */
  const [adoptY1, setAdoptY1] = useState("20");
  const [adoptY2, setAdoptY2] = useState("70");
  const [adoptY3, setAdoptY3] = useState("100");

  /* ------------------------------ Parsed numbers ---------------------------- */
  const S     = parseNum(stores, 0);
  const R     = parseNum(revPerStore, 0);          // revenue/store
  const Fee   = parseNum(subPerStore, 0);          // fee/store/year
  const WACC  = parseNum(discountRate, 0) / 100;

  const baseMargin = parseNum(baselineMarginPct, 0) / 100; // 0..1
  const uplift     = parseNum(salesUpliftPct, 0) / 100;    // %
  const marginPP   = parseNum(marginImprovementPP, 0) / 100; // percentage points → fraction
  const waste      = parseNum(wasteReductionPct, 0) / 100;
  const labor      = parseNum(laborEfficiencyPct, 0) / 100;
  const compliance = parseNum(complianceSaving, 0);

  const a1 = parseNum(adoptY1, 0) / 100;
  const a2 = parseNum(adoptY2, 0) / 100;
  const a3 = parseNum(adoptY3, 0) / 100;

  /* ----------------------- Per-store annual value model --------------------- */
  const perStoreBreakdown = useMemo(() => {
    // Conservative & simple:
    const salesUpliftValue = R * (baseMargin + marginPP) * uplift;
    const marginImprovementValue = R * marginPP;
    const wasteReductionValue = R * waste;
    const laborValue = R * labor; // treat as direct opex saving
    const complianceValue = compliance;

    const total = salesUpliftValue + marginImprovementValue + wasteReductionValue + laborValue + complianceValue - Fee;
    return {
      salesUpliftValue,
      marginImprovementValue,
      wasteReductionValue,
      laborValue,
      complianceValue,
      total
    };
  }, [R, baseMargin, marginPP, uplift, waste, labor, compliance, Fee]);

  /* ------------------------- 3-year chain cash flows ------------------------ */
  const chainCF = useMemo(() => {
    const v = perStoreBreakdown.total;
    return [
      S * a1 * v,
      S * a2 * v,
      S * a3 * v
    ];
  }, [S, a1, a2, a3, perStoreBreakdown]);

  const chainNPV = useMemo(() => {
    // discount chainCF (at end of each year)
    return chainCF[0] / (1 + WACC) + chainCF[1] / Math.pow(1 + WACC, 2) + chainCF[2] / Math.pow(1 + WACC, 3);
  }, [chainCF, WACC]);

  // The “cost NPV” is simply the discounted subscription cost (embedded in perStoreBreakdown.total),
  // so ROI (NPV-based) = NPV / NPV(costs).
  const costPerStore = Fee; // yearly
  const costChain = [S * a1 * costPerStore, S * a2 * costPerStore, S * a3 * costPerStore];
  const costNPV = costChain[0] / (1 + WACC) + costChain[1] / Math.pow(1 + WACC, 2) + costChain[2] / Math.pow(1 + WACC, 3);
  const roiNPV = costNPV > 0 ? (chainNPV / costNPV) * 100 : 0;

  // Payback years from undiscounted cumulative chain cash flow
  const paybackYears = useMemo(() => {
    const cumulative = [chainCF[0], chainCF[0] + chainCF[1], chainCF[0] + chainCF[1] + chainCF[2]];
    const needed = 0; // since v already net of fee, we check when cumulative > 0
    if (cumulative[0] > needed) return 1;
    if (cumulative[1] > needed) return 2;
    if (cumulative[2] > needed) return 3;
    return Infinity;
  }, [chainCF]);

  /* ---------------------------------- UI ----------------------------------- */

  const fmt = (n: number) => currencyFormatter(currency).format(Math.round(n));
  const neg = (n: number) => n < 0;

  return (
    <div className="app-container">
      <h1>Orbital Chain ROI Simulator</h1>
      <div style={{ color: "var(--muted)", marginBottom: 16 }}>
        Currency: <strong style={{ color: "var(--text)" }}>{currency}</strong> (no decimals)
      </div>

      {/* KPI cards */}
      <div className="results-grid" style={{ marginBottom: 16 }}>
        <KpiCard
          title="ROI (3-year, NPV-based)"
          value={<>{pct(roiNPV)}</>}
          sub="ROI = NPV / NPV(costs)"
          info="We discount three years of net cash flows (value minus subscription fee). ROI is the ratio of discounted net value to discounted subscription costs. If the subscription cost is set to zero, ROI is shown as 0% to avoid dividing by zero."
          danger={roiNPV < 0}
        />
        <KpiCard
          title="Payback (years)"
          value={<>{Number.isFinite(paybackYears) ? paybackYears : "—"}</>}
          sub="Undiscounted cumulative cash flow"
          info="Payback is computed from the undiscounted chain cash flow each year. It’s the first year when the running total turns positive. If it never turns positive in 3 years, we show a dash."
          danger={!Number.isFinite(paybackYears)}
        />
        <KpiCard
          title={`NPV (3 yrs, chain) — ${currency}`}
          value={<>{fmt(chainNPV)}</>}
          sub={`Discount rate: ${WACC * 100}%`}
          info="Net Present Value of the entire chain over three years at the selected discount rate (WACC). Each year’s net cash flow is discounted back to today’s value."
          danger={neg(chainNPV)}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* LEFT: Results details */}
        <div>
          <div className="kpi" style={{ marginBottom: 16 }}>
            <h3>Incremental cash flow (chain)</h3>
            <ul style={{ margin: "8px 0 0 16px" }}>
              <li>Year 1: <strong className={neg(chainCF[0]) ? "neg" : "pos"}>{fmt(chainCF[0])}</strong></li>
              <li>Year 2: <strong className={neg(chainCF[1]) ? "neg" : "pos"}>{fmt(chainCF[1])}</strong></li>
              <li>Year 3: <strong className={neg(chainCF[2]) ? "neg" : "pos"}>{fmt(chainCF[2])}</strong></li>
            </ul>
          </div>

          <div className="kpi">
            <h3>Per store — annual value breakdown</h3>
            <ul style={{ margin: "8px 0 0 16px" }}>
              <li>
                Sales uplift value:{" "}
                <strong className="pos">{fmt(perStoreBreakdown.salesUpliftValue)}</strong>
              </li>
              <li>
                Margin improvement:{" "}
                <strong className="pos">{fmt(perStoreBreakdown.marginImprovementValue)}</strong>
              </li>
              <li>
                Waste/shrink reduction:{" "}
                <strong className="pos">{fmt(perStoreBreakdown.wasteReductionValue)}</strong>
              </li>
              <li>
                Labor/OPEX efficiency:{" "}
                <strong className="pos">{fmt(perStoreBreakdown.laborValue)}</strong>
              </li>
              <li>
                Compliance saving:{" "}
                <strong className="pos">{fmt(perStoreBreakdown.complianceValue)}</strong>
              </li>
              <li style={{ marginTop: 6 }}>
                <span style={{ color: "var(--muted)" }}>Net annual value per store (incl. fee): </span>
                <strong className={neg(perStoreBreakdown.total) ? "neg" : "pos"}>
                  {fmt(perStoreBreakdown.total)}
                </strong>
              </li>
            </ul>
          </div>
        </div>

        {/* RIGHT: Inputs */}
        <div>
          <div className="kpi" style={{ marginBottom: 16 }}>
            <h3>Key Inputs</h3>
            <FieldLine
              label="Stores in chain"
              requiredForStore
              value={stores}
              onChange={setStores}
              info="Total number of stores in the chain."
            />
            <FieldLine
              label={`Annual revenue per store (${currency})`}
              requiredForStore
              value={revPerStore}
              onChange={setRevPerStore}
              info="Average annual store turnover. Used to scale the value of % improvements."
            />
            <FieldLine
              label={`Annual subscription fee per store (${currency})`}
              requiredForStore
              value={subPerStore}
              onChange={setSubPerStore}
              info="What you pay per store per year for the solution. Affects ROI and net cash flow."
            />
            <FieldLine
              label="Discount rate (WACC) %"
              requiredForStore
              value={discountRate}
              onChange={setDiscountRate}
              info="Used to discount future cash flows into today’s money (NPV). Typically your corporate WACC."
            />
          </div>

          <div className="kpi" style={{ marginBottom: 16 }}>
            <h3>Value Drivers (per store)</h3>
            <FieldLine
              label="Baseline gross margin (%)"
              value={baselineMarginPct}
              onChange={setBaselineMarginPct}
              info="Existing gross margin before improvements. Affects the value of sales uplift."
            />
            <FieldLine
              label="Sales uplift (%)"
              value={salesUpliftPct}
              onChange={setSalesUpliftPct}
              info="Expected sales increase (like-for-like) due to loyalty and better operations."
            />
            <FieldLine
              label="Margin improvement (pp)"
              value={marginImprovementPP}
              onChange={setMarginImprovementPP}
              info="Gross-margin improvement in percentage points (pp), e.g. 0.5 means +0.5 pp."
            />
            <FieldLine
              label="Waste/shrink reduction (%)"
              value={wasteReductionPct}
              onChange={setWasteReductionPct}
              info="Reduction in waste & shrink; treated as direct saving on base revenue."
            />
            <FieldLine
              label="Labor/OPEX efficiency (%)"
              value={laborEfficiencyPct}
              onChange={setLaborEfficiencyPct}
              info="Direct reduction in operating costs from efficiency (automation, better planning, etc.)."
            />
            <FieldLine
              label={`Compliance savings per store (${currency})`}
              value={complianceSaving}
              onChange={setComplianceSaving}
              info="Fixed annual saving per store from compliance & reporting efficiency."
            />
          </div>

          <div className="kpi">
            <h3>Adoption (% of stores live)</h3>
            <FieldLine
              label="Year 1 adoption (%)"
              value={adoptY1}
              onChange={setAdoptY1}
              info="Share of stores live during year 1."
            />
            <FieldLine
              label="Year 2 adoption (%)"
              value={adoptY2}
              onChange={setAdoptY2}
              info="Share of stores live during year 2."
            />
            <FieldLine
              label="Year 3 adoption (%)"
              value={adoptY3}
              onChange={setAdoptY3}
              info="Share of stores live during year 3."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
