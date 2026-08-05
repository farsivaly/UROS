import { useEffect, useState } from 'react'
import type { LabelMode } from './ComponentLabels'

const NARROW_MQ = '(max-width: 820px)'

type Props = {
  viewMode: 'overview' | 'inverter'
  tempOverlay: boolean
  onTempOverlay: (v: boolean) => void
  fibreOverlay: boolean
  onFibreOverlay: (v: boolean) => void
  showLabels: boolean
  onShowLabels: (v: boolean) => void
  componentLabels: boolean
  onComponentLabels: (v: boolean) => void
  labelMode: LabelMode
  onLabelMode: (m: LabelMode) => void
  doorMode: 'auto' | 'open' | 'closed'
  onDoorMode: (m: 'auto' | 'open' | 'closed') => void
  exploded: boolean
  onExplode: () => void
  xray: boolean
  onXray: (v: boolean) => void
  onResetInverter: () => void
}

function isNarrowViewport() {
  return typeof window !== 'undefined' && window.matchMedia(NARROW_MQ).matches
}

export default function ViewportHud({
  viewMode,
  tempOverlay,
  onTempOverlay,
  fibreOverlay,
  onFibreOverlay,
  showLabels,
  onShowLabels,
  componentLabels,
  onComponentLabels,
  labelMode,
  onLabelMode,
  doorMode,
  onDoorMode,
  exploded,
  onExplode,
  xray,
  onXray,
  onResetInverter,
}: Props) {
  // Collapsed by default on phone so it does not fight the dashboard sheet.
  const [open, setOpen] = useState(() => !isNarrowViewport())

  useEffect(() => {
    const mq = window.matchMedia(NARROW_MQ)
    const sync = () => {
      if (mq.matches) setOpen(false)
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return (
    <aside className={`viewport-hud${open ? '' : ' collapsed'}`} aria-label="Viewport toggles">
      <button
        type="button"
        className="hud-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title={open ? 'Hide tools' : 'Show tools'}
      >
        <span className="hud-toggle-title">Tools</span>
        <span className="hud-toggle-icon" aria-hidden>
          {open ? '‹' : '›'}
        </span>
      </button>

      {open && (
        <div className="hud-body">
          <div className="hud-block">
            <span className="hud-heading">Overlays</span>
            <button
              type="button"
              className={`hud-btn${tempOverlay ? ' active' : ''}`}
              onClick={() => onTempOverlay(!tempOverlay)}
            >
              Thermal
            </button>
            <button
              type="button"
              className={`hud-btn${fibreOverlay ? ' active' : ''}`}
              onClick={() => onFibreOverlay(!fibreOverlay)}
            >
              Fibre
            </button>
            <button
              type="button"
              className={`hud-btn${showLabels ? ' active' : ''}`}
              onClick={() => onShowLabels(!showLabels)}
              title="Overview inverter badges"
            >
              Fleet badges
            </button>
          </div>

          <div className="hud-block">
            <span className="hud-heading">Component labels</span>
            <button
              type="button"
              className={`hud-btn${componentLabels ? ' active' : ''}`}
              onClick={() => onComponentLabels(!componentLabels)}
            >
              {componentLabels ? 'On' : 'Off'}
            </button>
            <div className="hud-btn-row">
              {(
                [
                  ['names', 'Names'],
                  ['temp', 'Temp'],
                  ['health', 'Health'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`hud-btn compact${componentLabels && labelMode === id ? ' active' : ''}`}
                  disabled={!componentLabels}
                  onClick={() => onLabelMode(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {viewMode === 'inverter' && (
            <div className="hud-block">
              <span className="hud-heading">Inspection</span>
              <button
                type="button"
                className={`hud-btn${doorMode === 'open' ? ' active' : ''}`}
                onClick={() => onDoorMode(doorMode === 'open' ? 'closed' : 'open')}
              >
                {doorMode === 'open' ? 'Close door' : 'Open door'}
              </button>
              <button
                type="button"
                className={`hud-btn${exploded ? ' active' : ''}`}
                onClick={onExplode}
              >
                Explode
              </button>
              <button
                type="button"
                className={`hud-btn${xray ? ' active' : ''}`}
                onClick={() => onXray(!xray)}
              >
                X-Ray
              </button>
              <button type="button" className="hud-btn" onClick={onResetInverter}>
                Reset
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
