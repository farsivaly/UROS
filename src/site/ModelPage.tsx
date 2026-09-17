import { useEffect, useState } from 'react'
import {
  INVERTER_PIPELINE,
  MODEL_FILES,
  MODEL_VIEWS,
  PIPELINE,
  RAMAN_PIPELINE,
  SEVERITY,
  type ModelViewId,
} from './content'

function parseModelView(): ModelViewId {
  const query = window.location.hash.split('?')[1] ?? ''
  const view = new URLSearchParams(query).get('view')
  return view === 'matlab' ? 'matlab' : 'blocks'
}

export default function ModelPage() {
  const [view, setView] = useState<ModelViewId>(parseModelView)
  const active = MODEL_VIEWS.find((item) => item.id === view) ?? MODEL_VIEWS[0]

  useEffect(() => {
    const sync = () => setView(parseModelView())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  return (
    <section>
      <div className="site-page-head">
        <div>
          <p className="site-kicker">{active.kicker}</p>
          <h1>{active.title}</h1>
          <p>{active.summary}</p>
          <div className="site-seg" role="tablist" aria-label="Model type">
            {MODEL_VIEWS.map((item) => (
              <a
                key={item.id}
                href={item.hash}
                role="tab"
                aria-selected={item.id === view}
                className={`site-seg-btn${item.id === view ? ' is-active' : ''}`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
        {view === 'matlab' && (
          <div className="site-actions">
            <a className="site-btn primary" href="/research/matlab-model.zip" download>
              Download all (.zip)
            </a>
            <a className="site-btn" href="/research/matlab/init_pv_inverter.m" download>
              init_pv_inverter.m
            </a>
          </div>
        )}
      </div>

      {view === 'blocks' && (
        <>
          <h2 className="site-kicker site-files-label">Inverter electrical model</h2>
          <figure className="model-diagram">
            <img
              src="/research/previews/inverter-block.png"
              alt="Three-phase inverter electrical model from PV array through MPPT, DC-link, and IGBT inverter"
            />
            <figcaption>
              PV array → MPPT / DC–DC → DC-link → IGBT three-phase inverter (SPWM)
            </figcaption>
          </figure>
          <div className="pipeline" aria-label="Inverter electrical path">
            {INVERTER_PIPELINE.map((step) => (
              <div key={step.from} className="pipeline-step">
                <strong>{step.from}</strong>
                <span>→ {step.to}</span>
                <em>{step.note}</em>
              </div>
            ))}
          </div>

          <h2 className="site-kicker site-files-label">Raman DTS sensing chain</h2>
          <figure className="model-diagram">
            <img
              src="/research/previews/raman-block.png"
              alt="Raman DTS sensing chain from pump launch through fibre interaction, detection, and temperature reconstruction"
            />
            <figcaption>
              Pump launch → fibre Raman scatter → detection → ratio reconstruction → T_DTS(x)
            </figcaption>
          </figure>
          <div className="pipeline" aria-label="Raman DTS sensing path">
            {RAMAN_PIPELINE.map((step) => (
              <div key={step.from} className="pipeline-step">
                <strong>{step.from}</strong>
                <span>→ {step.to}</span>
                <em>{step.note}</em>
              </div>
            ))}
          </div>

          <div className="model-grid">
            <div className="model-block">
              <h2>Inverter electrical model</h2>
              <p>
                A PV string feeds an MPPT-controlled DC–DC stage, a DC-link, and
                an IGBT three-phase inverter under SPWM. Voltage and current
                readings close the MPPT loop. This is the electrical front end
                of the digital twin.
              </p>
            </div>
            <div className="model-block">
              <h2>Raman DTS chain</h2>
              <p>
                A modulated pump is launched into the sensing fibre. Stokes and
                anti-Stokes backscatter are filtered, detected, and ratioed to
                reconstruct the spatial temperature profile T_DTS(x) along 20 m
                of fibre at 0.5 m steps.
              </p>
            </div>
          </div>
        </>
      )}

      {view === 'matlab' && (
        <>
          <figure className="model-diagram">
            <img
              src="/research/previews/matlab.png"
              alt="Simulink chain from the three-phase inverter through conduction and switching loss, the thermal system, and Raman scattering"
            />
            <figcaption>
              Three-phase inverter → conduction and switching loss → thermal system → Raman scattering
            </figcaption>
          </figure>

          <div className="pipeline" aria-label="Model signal path">
            {PIPELINE.map((step) => (
              <div key={step.from} className="pipeline-step">
                <strong>{step.from}</strong>
                <span>→ {step.to}</span>
                <em>{step.note}</em>
              </div>
            ))}
          </div>

          <div className="model-grid">
            <div className="model-block">
              <h2>Operating envelope</h2>
              <p>
                Ambient temperature 15–35 °C, DC-link 500–700 V, load 2 kW,
                modulation index 0.8, 60 s runs. Raman attenuation is enabled;
                measurement noise is off for the baseline dataset.
              </p>
            </div>
            <div className="model-block">
              <h2>Degradation states</h2>
              <p>Internal thermal-path severity scales Rth2 only.</p>
              <dl className="severity">
                {SEVERITY.map((row) => (
                  <div key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>α = {row.alpha}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="model-block wide">
              <h2>Diagnostic figures</h2>
              <p>Feature extraction from the Simulink time series, used to check that severity moves the thermal response.</p>
              <div className="figure-row">
                <figure>
                  <img
                    src="/research/figures/01_T_DTS_inv_timeseries.png"
                    alt="Inverter-region DTS temperature versus time"
                  />
                  <figcaption>T_DTS in the inverter region over 60 s</figcaption>
                </figure>
                <figure>
                  <img
                    src="/research/figures/03_Delta_T_DTS_vs_severity.png"
                    alt="DTS temperature rise versus degradation severity"
                  />
                  <figcaption>ΔT_DTS versus severity</figcaption>
                </figure>
                <figure>
                  <img
                    src="/research/figures/08_xgb_test_cases_confusion.png"
                    alt="Severity classifier confusion matrix on held-out cases"
                  />
                  <figcaption>Severity classifier on held-out cases</figcaption>
                </figure>
              </div>
            </div>
          </div>

          <h2 className="site-kicker site-files-label">Files</h2>
          <div className="file-table">
            {MODEL_FILES.map((file) => (
              <a key={file.name} className="file-row" href={file.href} download>
                <b>{file.name}</b>
                <span className="file-kind">{file.kind}</span>
                <p>{file.role}</p>
                <span>{file.bytes}</span>
              </a>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
