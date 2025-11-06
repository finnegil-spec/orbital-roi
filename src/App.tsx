import React, { useState } from 'react'

export default function App() {
  const [customers, setCustomers] = useState(2000)
  const [avgSpend, setAvgSpend] = useState(180)
  const [upliftPercent, setUpliftPercent] = useState(4)

  const revenueBefore = customers * avgSpend
  const revenueAfter  = customers * avgSpend * (1 + upliftPercent / 100)
  const upliftValue   = revenueAfter - revenueBefore

  return (
    <div className="app-container">
      <h1>Orbital ROI Simulator</h1>

      <label>Antall aktive kunder:</label>
      <input
        type="number"
        value={customers}
        onChange={(e) => setCustomers(Number(e.target.value))}
      />

      <label>Gjennomsnittlig månedlig forbruk per kunde (NOK):</label>
      <input
        type="number"
        value={avgSpend}
        onChange={(e) => setAvgSpend(Number(e.target.value))}
      />

      <label>Forventet lojalitetsdrevet omsetningsøkning (%):</label>
      <input
        type="number"
        value={upliftPercent}
        onChange={(e) => setUpliftPercent(Number(e.target.value))}
      />

      <hr />

      <p>Omsetning før: <strong>{revenueBefore.toLocaleString('no-NO')} NOK</strong></p>
      <p>Omsetning etter: <strong>{revenueAfter.toLocaleString('no-NO')} NOK</strong></p>
      <p>Årlig lojalitetsverdi: <strong>{upliftValue.toLocaleString('no-NO')} NOK</strong></p>
    </div>
  )
}


