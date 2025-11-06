 import React, { useMemo, useState, useEffect } from "react";
import type { Currency } from "../App";

/* ----------------------------- Formatting ----------------------------- */
/** Currency formatting without decimals (NOK/EUR/USD/ZAR). No auto-convert. */
const currencyFormat = (currency: Currency) =>
  new Intl.NumberFormat(
    currency === "NOK"
      ? "nb-NO"
      : currency === "EUR"
      ? "de-DE"
      : currency === "USD"
      ? "en-US"
      : "en-ZA", // ZAR
    { style: "currency", currency, maximumFractionDigits: 0 }
  );

/* ------------------------------ Inputs UX ----------------------------- */
/** CleanNumberInput – integers only (no leading zeros unless value = 0) */
type CleanNumberInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  value: number;
  onValue: (n: number) => void;
};
function CleanNumberInput({ value, onValue, ...rest }: CleanNumberInputProps) {
  const [text, setText] = useState<string>(value === 0 ? "" : String(value));

  useEffect(() => {
    // sync down if value changed externally
    if ((text === "" ? 0 : parseInt(text, 10) || 0) !== value) {
      setText(value === 0 ? "" : String(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    let v = e.target.value.replace(/[^0-9]/g, ""); // numbers only

    // remove leading zeros, keep "0" if empty
    if (v.startsWith("0") && v.length > 1) {
      v = String(parseInt(v, 10));
    }

    setText(v);
    onValue(v === "" ? 0 : parseInt(v, 10));
  };

  return (
    <input type="text" inputMode="numeric" value={text} onChange={handleChange} {...rest} />
  );
}

/** CleanPercentInput – allows 0–2 decimals, no leading zeros (except "0.xx"). */
type CleanPercentInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  value: number;
  onValue: (n: number) => void;
};
function CleanPercentInput({ value, onValue, ...rest }: CleanPercentInputProps) {
  const [text, setText] = useState<string>(value === 0 ? "" : String(value));

  useEffect(() => {
    const asFloat = text === "" ? 0 : parseFloat(text) || 0;
    if (asFloat !== value) setText(value === 0 ? "" : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    let v = e.target.value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
    const parts = v.split(".");
    if (parts.length > 2) return; // only one dot

    if (parts[1] && parts[1].length > 2) parts[1] = parts[1].slice(0, 2);
    v = parts.join(".");

    if (v.startsWith("0") && !v.startsWith("0.") && v.length > 1) {
      v = String(parseInt(v, 10));
    }

    setText(v);
    onValue(v === "" ? 0 : parseFloat(v));
  };

  return (
    <input type="text" inputMode="decimal" value={text} onChange={handleChange} {...rest} />
  );
}

/* ------------------------------ Component ----------------------------- */
interface Props {
  currency: Currency;
}

/** Simple 3-year NPV/ROI model across a chain. */
export default function ChainROI({ currency }: Props) {
  /* Key inputs */
  const [stores, setStores] = useState<number>(100);
  const [revenuePerStore, setRevenuePerStore] = useState<number>(12_000_000);
  const [subscriptionPerStore, setSubscriptionPerStore] = useState<number>(600_000);
  const [discountRate, setDiscountRate] = useState<number>(10); // WACC %
  const [grossMargin, setGrossMargin] = useState<number>(32); // %
  const [salesUplift, setSalesUplift] = useState<number>(1.5); // %
  const [labourEfficiency, setLabourEfficiency] = useState<number>(2.0); // %
  const [wastageReduction, setWastageReduction] = useState<number>(0.5); // %
  const [complianceSaving, setComplianceSaving] = useState<number>(10_000);

  const [adoptionY1, setAdoptionY1] = useState<number>(20);
  const [adoptionY2, setAdoptionY2] = useState<number>(70);
  const [adoptionY3, setAdoptionY3] = useState<number>(100);

  const fmt = useMemo(() => currencyFormat(currency), [currency]);

  /* Calculations */
  const results = useMemo(() => {
    const r = discountRate / 100;

    // incremental contribution per store (before adoption ramp)
    const upliftRevenue = revenuePerStore * (salesUplift / 100);
    const marginProfit = upliftRevenue * (grossMargin / 100);

    const labourSaving = revenuePerStore * (labourEfficiency / 100);
    const wasteSaving = revenuePerStore * (wastageReduction / 100);

    // Annual net benefit (per store, full adoption)
    const annualNetPerStore = marginProfit + labourSaving + wasteSaving + complianceSaving - subscriptionPerStore;

    // Apply adoption + discount
    const y1 = (annualNetPerStore * adoptionY1) / 100 / Math.pow(1 + r, 1);
    const y2 = (annualNetPerStore * adoptionY2) / 100 / Math.pow(1 + r, 2);
    const y3 = (annualNetPerStore * adoptionY3) / 100 / Math.pow(1 + r, 3);

    const npvPerStore = y1 + y2 + y3;
    const npvChain = npvPerStore * stores;

    // PV of subscription (cost only) for ROI denominator
    const c1 = (subscriptionPerStore * adoptionY1) / 100 / Math.pow(1 + r, 1);
    const c2 = (subscriptionPerStore * adoptionY2) / 100 / Math.pow(1 + r, 2);
    const c3 = (subscriptionPerStore * adoptionY3) / 100 / Math.pow(1 + r, 3);
    const pvSubPerStore = c1 + c2 + c3;
    const pvSubChain = pvSubPerStore * stores || 1; // avoid /0

    const roiPct = (npvChain / pvSubChain - 1) * 100;

    return {
      annualNetPerStore,
      npvPerStore,
      npvChain,
      roiPct,
      yByYear: [
        { year: 1, value: y1 },
        { year: 2, value: y2 },
        { year: 3, value: y3 },
      ],
    };
  }, [
    stores,
    revenuePerStore,
    subscriptionPerStore,
    discountRate,
    grossMargin,
    salesUplift,
    labourEfficiency,
    wastageReduction,
    complianceSaving,
    adoptionY1,
    adoptionY2,
    adoptionY3,
  ]);

  return (
    <div className="app-container">
      <h1>Chain ROI Simulator</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* LEFT: Outputs */}
        <div style={{ paddingRight: 8 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: "var(--muted)" }}>ROI (full effect)</div>
            <div style={{ fontSize: 28, fontWeight: 600 }}>
              {results.roiPct.toFixed(1)}%
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ color: "var(--muted)" }}>NPV – chain (3 years)</div>
            <div style={{ fontSize: 28, fontWeight: 600 }}>
              {fmt.format(Math.round(results.npvChain))}
            </div>
          </div>

          <div style={{ marginBottom: 8, color: "var(--muted)" }}>
            Incremental cash flow per store (discounted)
          </div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {results.yByYear.map((y) => (
              <li key={y.year} style={{ lineHeight: 1.8 }}>
                Year {y.year}: <strong>{fmt.format(Math.round(y.value))}</strong>
              </li>
            ))}
          </ul>

          <hr />
          <div style={{ color: "var(--muted)" }}>Annual net value per store (full adoption):</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>
            {fmt.format(Math.round(results.annualNetPerStore))}
          </div>
        </div>

        {/* RIGHT: Inputs */}
        <div style={{ paddingLeft: 8 }}>
          <div className="group">
            <label>Stores in chain</label>
            <CleanNumberInput
              value={stores}
              onValue={setStores}
              className="input"
              placeholder="0"
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>

          <div className="group">
            <label>Annual revenue per store ({currency})</label>
            <CleanNumberInput
              value={revenuePerStore}
              onValue={setRevenuePerStore}
              className="input"
              placeholder="0"
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>

          <div className="group">
            <label>Annual subscription / store ({currency})</label>
            <CleanNumberInput
              value={subscriptionPerStore}
              onValue={setSubscriptionPerStore}
              className="input"
              placeholder="0"
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>

          <div className="group">
            <label>Discount rate (WACC) %</label>
            <CleanPercentInput
              value={discountRate}
              onValue={setDiscountRate}
              className="input"
              placeholder="0.0"
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>

          <hr />

          <div className="group">
            <label>Gross margin +pp (%)</label>
            <CleanPercentInput
              value={grossMargin}
              onValue={setGrossMargin}
              className="input"
              placeholder="0.0"
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>

          <div className="group">
            <label>Sales uplift (%)</label>
            <CleanPercentInput
              value={salesUplift}
              onValue={setSalesUplift}
              className="input"
              placeholder="0.0"
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>

          <div className="group">
            <label>Labour efficiency (%)</label>
            <CleanPercentInput
              value={labourEfficiency}
              onValue={setLabourEfficiency}
              className="input"
              placeholder="0.0"
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>

          <div className="group">
            <label>Wastage reduction (%)</label>
            <CleanPercentInput
              value={wastageReduction}
              onValue={setWastageReduction}
              className="input"
              placeholder="0.0"
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>

          <div className="group">
            <label>Compliance saving / store / year ({currency})</label>
            <CleanNumberInput
              value={complianceSaving}
              onValue={setComplianceSaving}
              className="input"
              placeholder="0"
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>

          <hr />

          <div className="group">
            <label>Adoption year 1 (%)</label>
            <CleanPercentInput
              value={adoptionY1}
              onValue={setAdoptionY1}
              className="input"
              placeholder="0.0"
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>
          <div className="group">
            <label>Adoption year 2 (%)</label>
            <CleanPercentInput
              value={adoptionY2}
              onValue={setAdoptionY2}
              className="input"
              placeholder="0.0"
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>
          <div className="group">
            <label>Adoption year 3 (%)</label>
            <CleanPercentInput
              value={adoptionY3}
              onValue={setAdoptionY3}
              className="input"
              placeholder="0.0"
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
