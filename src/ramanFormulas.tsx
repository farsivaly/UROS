/** Shared Raman DTS formula blocks — location and temperature reconstruction. */

export function LocationFormula({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`fibre-math${compact ? ' fibre-math-compact' : ''}`}
      aria-label="d approximately equals c times delta t over 2 n"
    >
      <p className="fibre-math-label">Where · time of flight</p>
      <span className="fibre-math-eq">
        <var>d</var>
        <span className="fibre-math-op">≈</span>
        <span className="fibre-frac">
          <span className="fibre-frac-num">
            <var>c</var>
            <span className="fibre-math-op">·</span>
            <span>
              Δ<var>t</var>
            </span>
          </span>
          <span className="fibre-frac-bar" aria-hidden />
          <span className="fibre-frac-den">
            2<var>n</var>
          </span>
        </span>
      </span>
      {!compact && (
        <p className="fibre-math-caption">
          Longer return delay Δ<var>t</var> means farther along the fibre. That is how we localise each
          reading in space.
        </p>
      )}
    </div>
  )
}

export function TemperatureFormula({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`fibre-math fibre-math-temp${compact ? ' fibre-math-compact' : ''}`}
      aria-label="Temperature from anti-Stokes over Stokes ratio"
    >
      <p className="fibre-math-label">How hot · anti-Stokes / Stokes</p>
      <div className="fibre-math-stack">
        <span className="fibre-math-eq">
          <var>R</var>
          <span className="fibre-math-op">=</span>
          <span className="fibre-frac">
            <span className="fibre-frac-num">
              <var>
                I<sub>as</sub>
              </var>
            </span>
            <span className="fibre-frac-bar" aria-hidden />
            <span className="fibre-frac-den">
              <var>
                I<sub>s</sub>
              </var>
            </span>
          </span>
        </span>
      </div>
      {!compact && (
        <p className="fibre-math-caption">
          Anti-Stokes (<var>I<sub>as</sub></var>) grows with heat. Stokes (<var>I<sub>s</sub></var>) stays
          steadier. Their ratio <var>R</var> tracks temperature.
        </p>
      )}
    </div>
  )
}

export function RamanArchitectureBoard({
  beatIndex,
  hotspotDistanceM,
  maxTempC,
}: {
  beatIndex: number
  hotspotDistanceM?: number | null
  maxTempC?: number | null
}) {
  const stages = [
    { id: 'scatter', title: '01 Stokes & anti-Stokes', body: 'Two returns; heat raises anti-Stokes' },
    { id: 'locate', title: '02 Localisation', body: 'Return delay → distance along fibre' },
    { id: 'why', title: '03 Why it matters', body: 'Where + how hot along the whole path' },
  ]

  return (
    <div className="raman-arch">
      <header className="raman-arch-head">
        <p className="raman-arch-kicker">Raman DTS</p>
        <h4>Temperature and location from one fibre</h4>
      </header>

      <ol className="raman-arch-pipeline">
        {stages.map((s, i) => (
          <li key={s.id} className={`raman-arch-stage${beatIndex === i ? ' active' : ''}${beatIndex > i ? ' done' : ''}`}>
            <strong>{s.title}</strong>
            <span>{s.body}</span>
          </li>
        ))}
      </ol>

      <div className="raman-arch-split">
        <div className={`raman-arch-rail${beatIndex === 1 ? ' focus' : ''}`}>
          <LocationFormula compact />
        </div>
        <div className={`raman-arch-rail${beatIndex === 0 || beatIndex === 2 ? ' focus' : ''}`}>
          <TemperatureFormula compact />
        </div>
      </div>

      {(hotspotDistanceM != null || maxTempC != null) && (
        <div className="raman-arch-telemetry">
          {hotspotDistanceM != null && (
            <div>
              <span>Hotspot distance</span>
              <strong>{hotspotDistanceM.toFixed(2)} m</strong>
            </div>
          )}
          {maxTempC != null && (
            <div>
              <span>Max temperature</span>
              <strong>{maxTempC.toFixed(1)} °C</strong>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
