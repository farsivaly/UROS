import { useMemo, useState, type ReactNode } from 'react'
import CollapsibleSection from './CollapsibleSection'
import FibreGraph from './FibreGraph'
import {
  displayInvId,
  formatRul,
  healthTone,
  maintenanceBand,
  sceneUnitId,
  severityLabel,
  type ActiveTwinState,
  type ConnectionStatus,
  type GraphKind,
  type TwinAlarm,
  type TwinMode,
  type TwinScenario,
  type TwinSnapshot,
} from './digitalTwin'
import { STRING_INVERTER_UNIT_IDS } from './componentMeta'
import { getAssetDetails } from './digitalTwinData'
import type { HealthStatus } from './componentMeta'
import type { CameraPreset } from './FarmScene'

type SectionKey = 'overview' | 'asset' | 'analysis' | 'controls' | 'system'
type AnalysisTab = 'thermal' | 'raman' | 'prediction' | 'signals'

type Props = {
  twin: TwinSnapshot | null
  active: ActiveTwinState | null
  scenario: TwinScenario | null
  mode: TwinMode
  onMode: (m: TwinMode) => void
  connection: ConnectionStatus
  dataLabel: string
  lastError: string | null
  tempOverlay: boolean
  fibreOverlay: boolean
  showLabels: boolean
  thermalFixed: boolean
  onTempOverlay: (v: boolean) => void
  onFibreOverlay: (v: boolean) => void
  onShowLabels: (v: boolean) => void
  onThermalFixed: (v: boolean) => void
  graphKind: GraphKind
  onGraphKind: (k: GraphKind) => void
  alarms: TwinAlarm[]
  onAckAlarm: (id: string) => void
  selectedName: string | null
  onPick: (name: string) => void
  activeUnit: string
  hasInverterContext: boolean
  doorMode: 'auto' | 'open' | 'closed'
  exploded: boolean
  xray: boolean
  onDoorMode: (m: 'auto' | 'open' | 'closed') => void
  onExplode: () => void
  onResetInverter: () => void
  onXray: (v: boolean) => void
  onNav: (preset: CameraPreset) => void
  onInspect: (unitId?: string) => void
  onOverview: () => void
  onLoadJson: () => void
  onRefresh: () => void
  onResetView: () => void
  progress: number
  onProgress: (p: number) => void
  playing: boolean
  onPlaying: (v: boolean) => void
  playSpeed: number
  onPlaySpeed: (v: number) => void
  ramanPulse: boolean
  onRamanPulse: (v: boolean) => void
  packets: { received: number; rejected: number }
  scenarioId: string
  onScenario: (id: string) => void
}

const MODES: { id: TwinMode; label: string }[] = [
  { id: 'inspection', label: 'Inspection' },
  { id: 'live', label: 'Live' },
  { id: 'replay', label: 'Replay' },
  { id: 'fault', label: 'Fault Injection' },
  { id: 'prediction', label: 'Prediction' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'raman', label: 'Raman Demo' },
]

const QUICK_COMPONENTS: { key: string; label: string }[] = [
  { key: 'IGBT_02', label: 'IGBT' },
  { key: 'TIM_IGBT_02', label: 'TIM' },
  { key: 'HeatSink', label: 'Heat Sink' },
  { key: 'Capacitor_01', label: 'Capacitor' },
  { key: 'CoolingFan_01', label: 'Fan' },
  { key: 'Busbar_Positive', label: 'Busbar' },
  { key: 'RamanFibre', label: 'Raman Fibre' },
]

function statusClass(health: HealthStatus) {
  if (health === 'warn') return 'status warn'
  if (health === 'danger') return 'status danger'
  return 'status'
}

function connLabel(s: ConnectionStatus) {
  if (s === 'connected') return 'Connected'
  if (s === 'loading') return 'Loading…'
  if (s === 'error') return 'Error'
  return 'Disconnected'
}

function kv(label: string, value: ReactNode, tone?: HealthStatus) {
  return (
    <div className="kv-row">
      <span>{label}</span>
      <strong className={tone ? statusClass(tone) : undefined}>{value}</strong>
    </div>
  )
}

export default function ScadaDashboard(props: Props) {
  const {
    twin,
    active,
    scenario,
    mode,
    onMode,
    connection,
    dataLabel,
    lastError,
    tempOverlay,
    fibreOverlay,
    showLabels,
    thermalFixed,
    onTempOverlay,
    onFibreOverlay,
    onShowLabels,
    onThermalFixed,
    graphKind,
    onGraphKind,
    alarms,
    onAckAlarm,
    selectedName,
    onPick,
    activeUnit,
    hasInverterContext,
    doorMode,
    exploded,
    xray,
    onDoorMode,
    onExplode,
    onResetInverter,
    onXray,
    onNav,
    onInspect,
    onOverview,
    onLoadJson,
    onRefresh,
    onResetView,
    progress,
    onProgress,
    playing,
    onPlaying,
    playSpeed,
    onPlaySpeed,
    ramanPulse,
    onRamanPulse,
    packets,
    scenarioId,
    onScenario,
  } = props

  const [openSection, setOpenSection] = useState<SectionKey | null>('overview')
  const [analysisTab, setAnalysisTab] = useState<AnalysisTab>('thermal')
  const [debugLog, setDebugLog] = useState(false)

  const toggle = (key: SectionKey) =>
    setOpenSection((current) => (current === key ? null : key))

  const details = useMemo(
    () => getAssetDetails(selectedName, twin),
    [selectedName, twin],
  )

  const fleet = useMemo(() => {
    const list = twin?.inverters ?? []
    let healthy = 0
    let warning = 0
    let critical = 0
    for (const inv of list) {
      if (inv.health >= 90) healthy++
      else if (inv.health >= 70) warning++
      else critical++
    }
    return { total: list.length, healthy, warning, critical, offline: 0 }
  }, [twin])

  const activeAlarms = alarms.filter((a) => !a.acknowledged)
  const topAlarm = activeAlarms.find((a) => a.severity === 'Critical')
    ?? activeAlarms.find((a) => a.severity === 'High')
    ?? activeAlarms[0]

  const isComponent =
    !!selectedName &&
    /^StringInverter_\d{2}_/.test(selectedName) &&
    !STRING_INVERTER_UNIT_IDS.includes(selectedName as never)

  const unitSelected =
    !!selectedName &&
    (STRING_INVERTER_UNIT_IDS.includes(selectedName as never) ||
      selectedName.startsWith('StringInverter_'))

  const focusComponent = (key: string) => {
    onPick(`${activeUnit}_${key}`)
  }

  const modeLabel = MODES.find((m) => m.id === mode)?.label ?? mode
  const invTone = active ? healthTone(active.health) : undefined

  return (
    <aside className={`side-panel scada-panel${mode === 'maintenance' ? ' maintenance-mode' : ''}`}>
        <div className="scada-header">
        <h2>Expert Mode</h2>
        <p className="hint tight">SCADA condition monitoring</p>
      </div>

      {/* 1. OVERVIEW */}
      <CollapsibleSection
        title="Overview"
        open={openSection === 'overview'}
        onToggle={() => toggle('overview')}
        badge={active ? `${active.health}%` : undefined}
        tone={invTone}
      >
        <div className="compact-block">
          {kv('Mode', modeLabel)}
          {kv(
            'Connection',
            <>
              <span className="status-dot" />
              {connLabel(connection)}
            </>,
            connection === 'connected' ? 'ok' : connection === 'error' ? 'danger' : 'warn',
          )}
        </div>

        <h4 className="subhead">Fleet</h4>
        <div className="stat-row">
          <span><em>Healthy</em> {fleet.healthy}</span>
          <span><em>Warning</em> {fleet.warning}</span>
          <span><em>Critical</em> {fleet.critical}</span>
          <span><em>Offline</em> {fleet.offline}</span>
        </div>

        <h4 className="subhead">Selected Inverter</h4>
        {active ? (
          <div className="compact-block">
            {kv('ID', active.inverter_id)}
            {kv('Health', `${active.health}%`, healthTone(active.health))}
            {kv('Status', active.status, healthTone(active.health))}
            {kv('Temperature', `${active.temperature.toFixed(1)} °C`)}
            {kv('Fault', active.fault_type)}
          </div>
        ) : (
          <p className="hint">No inverter selected.</p>
        )}

        <div className="compact-block" style={{ marginTop: '0.45rem' }}>
          {kv(
            'Active Alarms',
            activeAlarms.length
              ? `${activeAlarms.length}${topAlarm ? ` · ${topAlarm.severity}` : ''}`
              : '0',
            activeAlarms.some((a) => a.severity === 'Critical')
              ? 'danger'
              : activeAlarms.length
                ? 'warn'
                : 'ok',
          )}
        </div>

        <div className="btn-row">
          <button
            type="button"
            className="tool-btn"
            disabled={!active}
            onClick={() => active && onInspect(sceneUnitId(active.inverter_id))}
          >
            Focus Selected
          </button>
          <button
            type="button"
            className="tool-btn"
            disabled={!active}
            onClick={() => onInspect(active ? sceneUnitId(active.inverter_id) : activeUnit)}
          >
            Inspect
          </button>
          <button
            type="button"
            className="tool-btn"
            disabled={!topAlarm}
            onClick={() => topAlarm && onAckAlarm(topAlarm.alarm_id)}
          >
            Acknowledge Alarm
          </button>
        </div>
      </CollapsibleSection>

      {/* 2. ASSET INSPECTION */}
      <CollapsibleSection
        title="Asset Inspection"
        open={openSection === 'asset'}
        onToggle={() => toggle('asset')}
        badge={details?.displayName}
      >
        <h4 className="subhead">Selected Asset</h4>
        {!unitSelected && !details ? (
          <p className="hint">No inverter selected.</p>
        ) : details ? (
          <div className="compact-block">
            {kv('Name', details.displayName)}
            {kv('ID', details.assetId)}
            {kv('Type', details.assetType)}
            {details.parentInverter && kv('Parent', details.parentInverter)}
            {kv('Status', details.status, details.health)}
            {kv('Health', `${details.healthPct}%`, details.health)}
            {isComponent && details.temperature && kv('Temperature', details.temperature)}
            {!isComponent && !unitSelected && (
              <p className="hint tight">Select a component for detail values.</p>
            )}
          </div>
        ) : (
          <p className="hint">No inverter selected.</p>
        )}

        <h4 className="subhead">Navigation</h4>
        <div className="btn-row">
          <button type="button" className="tool-btn" onClick={onOverview}>Site</button>
          <button type="button" className="tool-btn" onClick={() => onInspect()}>Inverter</button>
          <button type="button" className="tool-btn" disabled={!hasInverterContext} onClick={() => onNav('interior')}>Interior</button>
          <button type="button" className="tool-btn" disabled={!hasInverterContext} onClick={() => onNav('top')}>Top</button>
        </div>

        <h4 className="subhead">Inspection</h4>
        <div className="btn-row">
          <button type="button" className={`tool-btn${doorMode === 'open' ? ' active' : ''}`} disabled={!hasInverterContext} onClick={() => onDoorMode(doorMode === 'open' ? 'closed' : 'open')}>
            {doorMode === 'open' ? 'Close Door' : 'Open Door'}
          </button>
          <button type="button" className={`tool-btn${exploded ? ' active' : ''}`} disabled={!hasInverterContext} onClick={onExplode}>Explode</button>
          <button type="button" className={`tool-btn${xray ? ' active' : ''}`} disabled={!hasInverterContext} onClick={() => onXray(!xray)}>X-Ray</button>
          <button type="button" className="tool-btn" disabled={!hasInverterContext} onClick={onResetInverter}>Reset</button>
        </div>

        <h4 className="subhead">Quick Component Focus</h4>
        <div className="btn-row wrap">
          {QUICK_COMPONENTS.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`tool-btn${selectedName === `${activeUnit}_${c.key}` ? ' active' : ''}`}
              disabled={!hasInverterContext}
              onClick={() => focusComponent(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <p className="hint tight">Overlay and label toggles live in the top-left viewport HUD.</p>
      </CollapsibleSection>

      {/* 3. ANALYSIS */}
      <CollapsibleSection
        title="Analysis"
        open={openSection === 'analysis'}
        onToggle={() => toggle('analysis')}
        badge={analysisTab}
      >
        <div className="filter-row">
          {([
            ['thermal', 'Thermal'],
            ['raman', 'Raman DTS'],
            ['prediction', 'Prediction'],
            ['signals', 'Signals'],
          ] as [AnalysisTab, string][]).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`chip${analysisTab === id ? ' active' : ''}`}
              onClick={() => setAnalysisTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {!active && <p className="hint">No active twin state.</p>}

        {active && analysisTab === 'thermal' && (
          <div className="compact-block">
            {kv('Current temp', `${active.temperature.toFixed(1)} °C`)}
            {kv('Max temp', `${active.max_temperature.toFixed(1)} °C`)}
            {kv('Hotspot pos.', `${active.hotspot_position.toFixed(2)} m`)}
            {kv('Hotspot radius', active.hotspot_radius.toFixed(3))}
            {kv('Severity', severityLabel(active.severity))}
            {kv('Thermal R', `${active.thermal_resistance.toFixed(2)} K/W`)}
            <div className="btn-row" style={{ marginTop: '0.4rem' }}>
              <button
                type="button"
                className={`tool-btn${tempOverlay ? ' active' : ''}`}
                onClick={() => onTempOverlay(!tempOverlay)}
              >
                Temperature Overlay
              </button>
            </div>
          </div>
        )}

        {active && analysisTab === 'raman' && (
          <>
            <div className="compact-block">
              {kv('Fibre length', `${scenario?.fibre_length_m?.toFixed(1) ?? '—'} m`)}
              {kv('Max DTS', `${active.max_temperature.toFixed(1)} °C`)}
              {kv('Avg DTS', `${active.average_temperature.toFixed(1)} °C`)}
              {kv('Hotspot distance', `${active.hotspot_position.toFixed(2)} m`)}
              {kv(
                'Raman ratio',
                active.raman_ratio_profile.length
                  ? Math.max(...active.raman_ratio_profile).toFixed(2)
                  : '—',
              )}
              {kv(
                'Stokes peak',
                active.stokes_profile.length
                  ? Math.max(...active.stokes_profile).toFixed(2)
                  : '—',
              )}
              {kv(
                'Anti-Stokes peak',
                active.anti_stokes_profile.length
                  ? Math.max(...active.anti_stokes_profile).toFixed(2)
                  : '—',
              )}
            </div>
            <div className="btn-row" style={{ marginTop: '0.35rem' }}>
              <button
                type="button"
                className={`tool-btn${fibreOverlay ? ' active' : ''}`}
                onClick={() => onFibreOverlay(!fibreOverlay)}
              >
                Fibre Overlay
              </button>
            </div>
            <div className="filter-row">
              {([
                ['dts', 'DTS'],
                ['ratio', 'Ratio'],
                ['stokes', 'Stokes'],
                ['antistokes', 'Anti-Stokes'],
              ] as [GraphKind, string][]).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  className={`chip${graphKind === k ? ' active' : ''}`}
                  onClick={() => onGraphKind(k)}
                >
                  {label}
                </button>
              ))}
            </div>
            <FibreGraph state={active} kind={graphKind} />
          </>
        )}

        {active && analysisTab === 'prediction' && (
          <div className="compact-block">
            {kv('Predicted fault', active.ml_fault_class)}
            {kv('ML confidence', `${Math.round(active.ml_confidence * 100)}%`)}
            <div className="conf-bar" style={{ margin: '0.25rem 0 0.45rem' }}>
              <div style={{ width: `${Math.round(active.ml_confidence * 100)}%` }} />
            </div>
            {kv('RUL', formatRul(active.remaining_useful_life))}
            {kv('Priority', active.maintenance_priority)}
            {kv('Action', active.recommended_action)}
            {kv('Horizon', active.prediction_horizon)}
            {kv('Health band', maintenanceBand(active.health).label, maintenanceBand(active.health).tone)}
            <div className="btn-row" style={{ marginTop: '0.4rem' }}>
              <button type="button" className="tool-btn" onClick={() => { onMode('prediction'); onPlaying(true) }}>Start Prediction</button>
              <button type="button" className="tool-btn" onClick={() => onPlaying(false)}>Pause</button>
              <button type="button" className="tool-btn" onClick={() => { onProgress(0); onPlaying(false) }}>Reset</button>
            </div>
          </div>
        )}

        {active && analysisTab === 'signals' && (
          <>
            <div className="compact-block">
              {kv('Source', active.is_predicted ? 'Predicted' : 'Measured / Simulated')}
              {kv('Samples', active.fibre_temperature_profile.length)}
              {kv('Fibre span', `${active.fibre_distance_profile[0]?.toFixed(1) ?? 0}–${active.fibre_distance_profile.at(-1)?.toFixed(1) ?? '—'} m`)}
            </div>
            <div className="filter-row">
              {([
                ['dts', 'T_DTS'],
                ['ratio', 'Ratio'],
                ['stokes', 'Stokes'],
                ['antistokes', 'Anti-Stokes'],
              ] as [GraphKind, string][]).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  className={`chip${graphKind === k ? ' active' : ''}`}
                  onClick={() => onGraphKind(k)}
                >
                  {label}
                </button>
              ))}
            </div>
            <FibreGraph state={active} kind={graphKind} />
          </>
        )}
      </CollapsibleSection>

      {/* 4. CONTROLS */}
      <CollapsibleSection
        title="Controls"
        open={openSection === 'controls'}
        onToggle={() => toggle('controls')}
        badge={modeLabel}
      >
        <h4 className="subhead">Mode</h4>
        <div className="filter-row">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`chip${mode === m.id ? ' active' : ''}`}
              onClick={() => onMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === 'live' && (
          <div className="btn-row wrap">
            <button type="button" className="tool-btn" onClick={onRefresh}>Refresh</button>
            <button type="button" className="tool-btn" onClick={onLoadJson}>Load JSON</button>
            <span className="hint tight">Update rate: 1 Hz (simulated)</span>
          </div>
        )}

        {mode === 'fault' && (
          <div className="compact-block">
            {kv('Fault type', scenario?.fault_type ?? '—')}
            {kv('Severity', severityLabel(progress))}
            <label className="slider-label">Progression · {Math.round(progress * 100)}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(progress * 100)}
              onChange={(e) => {
                onPlaying(false)
                onProgress(Number(e.target.value) / 100)
              }}
              className="fault-slider"
            />
            <div className="btn-row wrap">
              <button type="button" className={`tool-btn${scenarioId === 'tim' ? ' active' : ''}`} onClick={() => onScenario('tim')}>Apply TIM</button>
              <button type="button" className={`tool-btn${scenarioId === 'fan' ? ' active' : ''}`} onClick={() => onScenario('fan')}>Apply Fan</button>
              <button type="button" className={`tool-btn${scenarioId === 'cap' ? ' active' : ''}`} onClick={() => onScenario('cap')}>Apply Cap</button>
              <button type="button" className="tool-btn" onClick={() => { onScenario('healthy'); onProgress(0) }}>Reset Scenario</button>
            </div>
          </div>
        )}

        {mode === 'replay' && (
          <div className="compact-block">
            <label className="slider-label">Timeline · {Math.round(progress * 100)}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(progress * 100)}
              onChange={(e) => {
                onPlaying(false)
                onProgress(Number(e.target.value) / 100)
              }}
              className="fault-slider"
            />
            <div className="btn-row wrap">
              <button type="button" className={`tool-btn${playing ? ' active' : ''}`} onClick={() => onPlaying(!playing)}>{playing ? 'Pause' : 'Play'}</button>
              <button type="button" className="tool-btn" onClick={() => { onPlaying(false); onProgress(0) }}>Stop</button>
              <select value={playSpeed} onChange={(e) => onPlaySpeed(Number(e.target.value))}>
                <option value={0.5}>0.5×</option>
                <option value={1}>1×</option>
                <option value={2}>2×</option>
                <option value={4}>4×</option>
              </select>
              <button type="button" className="tool-btn" onClick={onLoadJson}>Load Recording</button>
            </div>
          </div>
        )}

        {mode === 'prediction' && (
          <div className="btn-row wrap">
            <button type="button" className="tool-btn" onClick={() => onPlaying(true)}>Start</button>
            <button type="button" className="tool-btn" onClick={() => onPlaying(false)}>Pause</button>
            <button type="button" className="tool-btn" onClick={() => { onProgress(0); onPlaying(false) }}>Reset</button>
            <span className="hint tight">Horizon: {active?.prediction_horizon ?? '+6 h'}</span>
          </div>
        )}

        {mode === 'raman' && (
          <div className="btn-row wrap">
            <button type="button" className={`tool-btn${ramanPulse ? ' active' : ''}`} onClick={() => onRamanPulse(!ramanPulse)}>
              {ramanPulse ? 'Pause Pulse' : 'Play Pulse'}
            </button>
            <button type="button" className="tool-btn" onClick={() => onRamanPulse(false)}>Reset Pulse</button>
          </div>
        )}

        {mode === 'inspection' && (
          <p className="hint">Static inspection — use Asset Inspection tools above.</p>
        )}

        {mode === 'maintenance' && (
          <div className="compact-block">
            {active && kv('Priority', active.maintenance_priority)}
            {active && kv('Action', active.recommended_action)}
            {active && kv('Affected', active.hotspot_component)}
            <div className="btn-row">
              <button type="button" className={`tool-btn${showLabels ? ' active' : ''}`} onClick={() => onShowLabels(!showLabels)}>Labels</button>
              <button type="button" className={`tool-btn${tempOverlay ? ' active' : ''}`} onClick={() => onTempOverlay(!tempOverlay)}>Thermal</button>
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* 5. SYSTEM */}
      <CollapsibleSection
        title="System"
        open={openSection === 'system'}
        onToggle={() => toggle('system')}
        badge={connLabel(connection)}
        tone={connection === 'connected' ? 'ok' : connection === 'error' ? 'danger' : 'warn'}
      >
        <div className="compact-block">
          {kv('Data source', dataLabel)}
          {kv('Connection', connLabel(connection))}
          {kv('Last update', active?.timestamp ?? twin?.timestamp ?? '—')}
          {kv('Packets RX', packets.received)}
          {kv('Packets rejected', packets.rejected)}
          {kv('Visual update', '~5 Hz')}
          {kv('Active inverter', active?.inverter_id ?? displayInvId(activeUnit))}
          {kv('Version', 'UROS DT 0.4')}
          {kv('Data file', scenario?.simulation_id ?? '—')}
          {kv('Temp range', thermalFixed ? 'Fixed' : 'Auto')}
        </div>
        <div className="btn-row wrap" style={{ marginTop: '0.4rem' }}>
          <button type="button" className={`tool-btn${thermalFixed ? ' active' : ''}`} onClick={() => onThermalFixed(!thermalFixed)}>
            {thermalFixed ? 'Fixed Range' : 'Auto Range'}
          </button>
          <button type="button" className={`tool-btn${debugLog ? ' active' : ''}`} onClick={() => setDebugLog((v) => !v)}>
            Debug Logging
          </button>
          <button type="button" className="tool-btn" onClick={onRefresh}>Reload Data</button>
          <button type="button" className="tool-btn" onClick={() => console.info('[UROS] logs cleared')}>Clear Logs</button>
          <button type="button" className="tool-btn" onClick={onResetView}>Reset Digital Twin</button>
          <button
            type="button"
            className="tool-btn"
            onClick={() => {
              const payload = {
                mode,
                connection,
                packets,
                active,
                scenario: scenario?.simulation_id,
                alarms: activeAlarms.length,
              }
              console.info('[UROS] diagnostics', payload)
              void navigator.clipboard?.writeText(JSON.stringify(payload, null, 2))
            }}
          >
            Export Diagnostics
          </button>
        </div>
        {lastError && <p className="hint danger-text">{lastError}</p>}
        {debugLog && <p className="hint tight">Debug logging on — see browser console.</p>}
      </CollapsibleSection>
    </aside>
  )
}
