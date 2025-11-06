 // src/components/ChainROI.tsx
import React, { useMemo, useState } from "react";

/** -----------------------------
 *  Currency helpers (no-decimals)
 *  ----------------------------- */
type Currency = "NOK" | "EUR" | "USD" | "ZAR";

const currencyFormat = (currency: Currency) =>
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

const pct = (v: number) =>
  `${Number.isFinite(v) ? (v * 100).toFixed(1) : "0.0"}%`;

/** -----------------------------
 *  Small UI bits
 *  ----------------------------- */
function BadgeStoreInput() {
  return (
    <span
      style={{
        marginLeft: 8,
        fontSize: 10,
        padding: "2px 6px",
        borderRadius: 999,
        background: "#0f1726",
        border: "1px solid var(--border)",
        color: "var(--muted)",
      }}
      title="Dette fylles inn av butikken"
    >
      Store input
    </span>
  );
}

function InfoButton({ text }: { text: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => {
        // enkel “press i for forklaring” – kan byttes til egen modal om ønskelig
        const asString =
          typeof text === "string" ? text : (text as any)?.props?.children?.join?.("") ?? "";
        alert(asString || "No info");
      }}
      title="Forklaring"
      style={{
        border: "1px solid var(--border)",
        background: "#0f1726",
        color: "var(--text)",
        width: 18,
        height: 18,
        lineHeight: "16px",
        fontSize: 11,
        borderRadius: 6,
        cursor: "pointer",
      }}
    >
      i
    </button>
  );
}

function KpiCard({
  title,
  value,
  sub,
  info,
  danger,
}: {
  title: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  info?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        background: "var(--panel)",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          justifyContent: "space-between",
        }}
      >
        <div style={{ color: "var(--muted)", fontSize: 12 }}>{title}</div>
        {info ? <InfoButton text={info} /> : null}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          marginTop: 6,
          color: danger ? "#ff6b6b" : "var(--text)",
        }}
      >
        {value}
      </div>
      {sub ? (
        <div style={{ color: "var(--muted)", marginTop: 6, fontSize: 12 }}>{sub}</div>
      ) : null}
    </div>
  );
}

/** -----------------------------
 *  Input with numeric sanitizing
 *  ----------------------------- */
/**
 * Vi bruker tekstfelt (ikke type="number") + inputMode="numeric"
 * så vi slipper auto-0 og spinner. Vi parser manuelt.
 */
function NumInput({
  label,
  value,
  setValue,
  placeholder,
  rightInfo,
}: {
  label: React.ReactNode;
  value: string;
  setValue: (s: string) => void;
  placeholder?: string;
  rightInfo?: React.ReactNode;
}) {
  return (
    <label style={{ display: "block", marginTop: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span style={{ color: "var(--muted)" }}>{label}</span>
        {rightInfo}
      </div>
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "#0f1726",
          color: "var(--text)",
        }}
      />
    </label>
  );
}

/** Parser, men lar tom streng være med (viser ikke 0 i feltet) */
const toNumber = (s: string) => {
  const cleaned = s.replace(/\s/g, "").replace(",", "."); // støtt komma
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
};

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

/** -----------------------------
 *  Hovedkomponent
 *  ----------------------------- */
export default function ChainROI({ currency }: { currency: Currency }) {
  const fmt = useMemo(() => currencyFormat(currency), [currency]);

  // --- Inputs (strings, slik at felt ikke får auto-0)
  const [storesStr, setStoresStr] = useState("100");
  const [revStr, setRevStr] = useState("1200000");
  const [feeStr, setFeeStr] = useState("600000");
  const [waccStr, setWaccStr] = useState("10");

  const [marginStr, setMarginStr] = useState("32"); // %
  const [upliftStr, setUpliftStr] = useState("1,5"); // %
  const [ppStr, setPpStr] = useState("0,5"); // %-poeng
  const [wasteStr, setWasteStr] = useState("0,5"); // %
  const [laborStr, setLaborStr] = useState("2"); // %
  const [complianceStr, setComplianceStr] = useState("10000"); // fast beløp

  const [adopt1Str, setAdopt1Str] = useState("20");
  const [adopt2Str, setAdopt2Str] = useState("70");
  const [adopt3Str, setAdopt3Str] = useState("100");

  // --- Tallverdier til beregning
  const stores = clamp(Math.floor(toNumber(storesStr)), 0, 1_000_000);
  const revenue = Math.max(0, toNumber(revStr));
  const fee = Math.max(0, toNumber(feeStr));
  const WACC = clamp(toNumber(waccStr) / 100, 0, 1);

  const baselineMargin = clamp(toNumber(marginStr) / 100, 0, 1);
  const salesUplift = clamp(toNumber(upliftStr) / 100, -1, 1);
  const marginPP = clamp(toNumber(ppStr) / 100, -1, 1);
  const wasteReduction = clamp(toNumber(wasteStr) / 100, -1, 1);
  const laborEfficiency = clamp(toNumber(laborStr) / 100, -1, 1);
  const complianceSaving = Math.max(0, toNumber(complianceStr));

  const adopt1 = clamp(toNumber(adopt1Str) / 100, 0, 1);
  const adopt2 = clamp(toNumber(adopt2Str) / 100, 0, 1);
  const adopt3 = clamp(toNumber(adopt3Str) / 100, 0, 1);

  // --- Per-store verdi (årlig)
  const salesUpliftValue =
    revenue * (baselineMargin + marginPP) * salesUplift;
  const marginImprovementValue = revenue * marginPP;
  const wasteReductionValue = revenue * wasteReduction;
  const laborValue = revenue * laborEfficiency;
  const complianceValue = complianceSaving;

  const perStoreTotal =
    salesUpliftValue +
    marginImprovementValue +
    wasteReductionValue +
    laborValue +
    complianceValue;

  const perStoreNet = perStoreTotal - fee;

  // --- Kjedeflyt og NPV
  const cf1 = perStoreNet * stores * adopt1;
  const cf2 = perStoreNet * stores * adopt2;
  const cf3 = perStoreNet * stores * adopt3;

  const d1 = cf1 / (1 + WACC) ** 1;
  const d2 = cf2 / (1 + WACC) ** 2;
  const d3 = cf3 / (1 + WACC) ** 3;

  const chainNPV = d1 + d2 + d3;

  // Kostnads-NPV = abonnementsavgift diskontert, vektet av adopsjon
  const costNPV =
    (fee * stores * adopt1) / (1 + WACC) ** 1 +
    (fee * stores * adopt2) / (1 + WACC) ** 2 +
    (fee * stores * adopt3) / (1 + WACC) ** 3;

  const roiNPV = costNPV > 0 ? chainNPV / costNPV : 0;

  // Payback (år) – udiskontert kumulativ
  const paybackYears = useMemo(() => {
    const y1 = cf1;
    const y2 = y1 + cf2;
    const y3 = y2 + cf3;
    if (y1 >= 0) return 1;
    if (y2 >= 0) return 2;
    if (y3 >= 0) return 3;
    return Number.POSITIVE_INFINITY; // "—"
  }, [cf1, cf2, cf3]);

  const breakdown = {
    salesUpliftValue,
    marginImprovementValue,
    wasteReductionValue,
    laborValue,
    complianceValue,
    total: perStoreNet,
  };

  return (
    <div className="app-container">
      <h1>Orbital Chain ROI Simulator</h1>
      <div style={{ color: "var(--muted)", marginBottom: 12 }}>
        Currency: <strong>{currency}</strong> (no decimals)
      </div>

      {/* KPI cards */}
      <div
        className="results-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <KpiCard
          title="ROI (3-year, NPV-based)"
          value={<>{pct(roiNPV)}</>}
          sub="ROI = NPV / NPV(costs)"
          info={
            <>
              <strong>Formel:</strong> ROI = NPV / NPV(costs).{"\n"}
              Vi diskonterer tre års <em>netto</em> kontantstrøm (per-store verdi{" "}
              <em>minus</em> årlig abonnementsavgift), multiplisert med andel butikker live
              per år. Kostnads-NPV er abonnementsavgiften diskontert over tre år. Er
              abonnementsavgiften 0, settes ROI til 0&nbsp;% (unngår deling på null).
            </>
          }
          danger={roiNPV < 0}
        />

        <KpiCard
          title="Payback (years)"
          value={<>{Number.isFinite(paybackYears) ? paybackYears : "—"}</>}
          sub="Undiscounted cumulative cash flow"
          info={
            <>
              Første år hvor <em>udiskontert</em> kumulativ kontantstrøm for kjeden blir
              positiv. Hvis det ikke skjer innen 3 år, vises en «—».
            </>
          }
          danger={!Number.isFinite(paybackYears)}
        />

        <KpiCard
          title={`NPV (3 yrs, chain) — ${currency}`}
          value={<>{fmt.format(Math.round(chainNPV))}</>}
          sub={`Discount rate (WACC): ${(WACC * 100).toFixed(0)} %`}
          info={
            <>
              <strong>NPV</strong> er summen av diskonterte (WACC) kjedekontantstrømmer i
              år 1, 2 og 3. Hver års netto kontantstrøm er:
              {"\n"}
              (perStoreNetValue × andel live det året) × antall butikker.
            </>
          }
          danger={chainNPV < 0}
        />
      </div>

      {/* Inputs + Results */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "420px 1fr",
          gap: 16,
        }}
      >
        {/* Left panel: inputs */}
        <div
          style={{
            border: "1px solid var(--border)",
            background: "var(--panel)",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Key Inputs</h3>

          <NumInput
            label={
              <>
                Stores in chain <BadgeStoreInput />
              </>
            }
            value={storesStr}
            setValue={setStoresStr}
            placeholder="e.g. 100"
          />
          <NumInput
            label={
              <>
                Annual revenue per store ({currency}) <BadgeStoreInput />
              </>
            }
            value={revStr}
            setValue={setRevStr}
            placeholder="e.g. 1200000"
          />
          <NumInput
            label={
              <>
                Annual subscription fee per store ({currency}) <BadgeStoreInput />
              </>
            }
            value={feeStr}
            setValue={setFeeStr}
            placeholder="e.g. 600000"
            rightInfo={
              <InfoButton
                text={
                  "Fast årlig plattform/abonnements-kost per butikk. Bruk 0 hvis uaktuelt."
                }
              />
            }
          />
          <NumInput
            label={
              <>
                Discount rate (WACC) % <BadgeStoreInput />
              </>
            }
            value={waccStr}
            setValue={setWaccStr}
            placeholder="e.g. 10"
            rightInfo={<InfoButton text={"Bruk selskapets veide kapitalkost (WACC)."} />}
          />

          <h3 style={{ marginTop: 16 }}>Value Drivers (per store)</h3>

          <NumInput
            label={
              <>
                Baseline gross margin (%) <BadgeStoreInput />
              </>
            }
            value={marginStr}
            setValue={setMarginStr}
            placeholder="e.g. 32"
            rightInfo={
              <InfoButton text={"Butikkens historiske bruttofortjeneste i prosent."} />
            }
          />
          <NumInput
            label={
              <>
                Sales uplift (%) <BadgeStoreInput />
              </>
            }
            value={upliftStr}
            setValue={setUpliftStr}
            placeholder="e.g. 1.5"
            rightInfo={
              <InfoButton text={"Forventet salgsøkning (prosentvis) på samme varekurv."} />
            }
          />
          <NumInput
            label={
              <>
                Margin improvement (pp) <BadgeStoreInput />
              </>
            }
            value={ppStr}
            setValue={setPpStr}
            placeholder="e.g. 0.5"
            rightInfo={
              <InfoButton text={"Prosent-poeng forbedring på margin (ikke prosent)."} />
            }
          />
          <NumInput
            label={
              <>
                Waste/shrink reduction (%) <BadgeStoreInput />
              </>
            }
            value={wasteStr}
            setValue={setWasteStr}
            placeholder="e.g. 0.5"
            rightInfo={
              <InfoButton text={"Redusert svinn i prosent av omsetning."} />
            }
          />
          <NumInput
            label={
              <>
                Labor/OPEX efficiency (%) <BadgeStoreInput />
              </>
            }
            value={laborStr}
            setValue={setLaborStr}
            placeholder="e.g. 2"
            rightInfo={
              <InfoButton text={"Arbeids-/driftsbesparelse målt i prosent av omsetning."} />
            }
          />
          <NumInput
            label={
              <>
                Compliance savings per store ({currency}) <BadgeStoreInput />
              </>
            }
            value={complianceStr}
            setValue={setComplianceStr}
            placeholder="e.g. 10000"
            rightInfo={
              <InfoButton text={"Direkte årlig besparelse/risikoreduksjon i kroner."} />
            }
          />

          <h3 style={{ marginTop: 16 }}>Adoption (% of stores live)</h3>
          <NumInput
            label={
              <>
                Year 1 adoption (%) <BadgeStoreInput />
              </>
            }
            value={adopt1Str}
            setValue={setAdopt1Str}
            placeholder="e.g. 20"
          />
          <NumInput
            label={
              <>
                Year 2 adoption (%) <BadgeStoreInput />
              </>
            }
            value={adopt2Str}
            setValue={setAdopt2Str}
            placeholder="e.g. 70"
          />
          <NumInput
            label={
              <>
                Year 3 adoption (%) <BadgeStoreInput />
              </>
            }
            value={adopt3Str}
            setValue={setAdopt3Str}
            placeholder="e.g. 100"
          />
        </div>

        {/* Right panel: derived results */}
        <div
          style={{
            border: "1px solid var(--border)",
            background: "var(--panel)",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Incremental cash flow (chain)</h3>
          <ul style={{ marginTop: 8 }}>
            <li>
              Year 1: <strong>{fmt.format(Math.round(cf1))}</strong>
            </li>
            <li>
              Year 2: <strong>{fmt.format(Math.round(cf2))}</strong>
            </li>
            <li>
              Year 3: <strong>{fmt.format(Math.round(cf3))}</strong>
            </li>
          </ul>

          <div style={{ height: 12 }} />

          <div
            style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}
          >
            <h3 style={{ margin: 0 }}>Per store — annual value breakdown</h3>
            <InfoButton
              text={
                `Sales uplift value = Revenue_per_store × (baseline_margin + margin_pp) × sales_uplift
Margin improvement = Revenue_per_store × margin_pp
Waste/shrink reduction = Revenue_per_store × waste_reduction
Labor/OPEX efficiency = Revenue_per_store × labor_efficiency
Compliance saving = fast beløp
Net annual value per store (incl. fee) = (sum av punktene over) – annual subscription fee per store`
              }
            />
          </div>

          <ul style={{ margin: "8px 0 0 16px" }}>
            <li>
              Sales uplift value:{" "}
              <strong>{fmt.format(Math.round(breakdown.salesUpliftValue))}</strong>
            </li>
            <li>
              Margin improvement:{" "}
              <strong>{fmt.format(Math.round(breakdown.marginImprovementValue))}</strong>
            </li>
            <li>
              Waste/shrink reduction:{" "}
              <strong>{fmt.format(Math.round(breakdown.wasteReductionValue))}</strong>
            </li>
            <li>
              Labor/OPEX efficiency:{" "}
              <strong>{fmt.format(Math.round(breakdown.laborValue))}</strong>
            </li>
            <li>
              Compliance saving:{" "}
              <strong>{fmt.format(Math.round(breakdown.complianceValue))}</strong>
            </li>
            <li style={{ marginTop: 6 }}>
              <span style={{ color: "var(--muted)" }}>
                Net annual value per store (incl. fee):{" "}
              </span>
              <strong
                style={{ color: breakdown.total < 0 ? "#ff6b6b" : "var(--text)" }}
              >
                {fmt.format(Math.round(breakdown.total))}
              </strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
