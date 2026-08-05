import type { ReactNode } from 'react'
import {
  formatRul,
  healthTone,
  sceneUnitId,
  severityLabel,
  type ActiveTwinState,
  type ConnectionStatus,
  type TwinMode,
  type TwinScenario,
} from './digitalTwin'
import type { HealthStatus } from './componentMeta'

type Props = {
  active: ActiveTwinState | null
  scenario: TwinScenario | null
  scenarioId: string
  mode: TwinMode
  connection: ConnectionStatus
  progress: number
  onProgress: (p: number) => void
  playing: boolean
  onPlaying: (v: boolean) => void
  playSpeed: number
  onPlaySpeed: (v: number) => void
  selectedName: string | null
  packets: { received: number; rejected: number }
  ramanPulse: boolean
  experience: 'learning' | 'expert'
}

function StatusBadge({
  tone,
  children,
}: {
  tone?: HealthStatus | 'offline' | 'info'
  children: ReactNode
}) {
  const cls =
    tone === 'warn'
      ? 'warn'
      : tone === 'danger'
        ? 'danger'
        : tone === 'offline'
          ? 'offline'
          : tone === 'info'
            ? 'info'
            : 'ok'
  return <span className={`status-badge ${cls}`}>{children}</span>
}

function Seg({
  icon,
  label,
  value,
  tone,
}: {
  icon?: string
  label: string
  value: ReactNode
  tone?: HealthStatus | 'offline' | 'info'
}) {
  return (
    <div className="status-seg">
      {icon && (
        <span className="status-ico" aria-hidden>
          {icon}
        </span>
      )}
      <span className="status-seg-label">{label}</span>
      <StatusBadge tone={tone}>{value}</StatusBadge>
    </div>
  )
}

function Divider() {
  return <span className="status-div" aria-hidden />
}

function componentLabel(selectedName: string | null, unit: string): string {
  if (!selectedName) return '—'
  if (selectedName === unit || /^StringInverter_\d{2}$/.test(selectedName)) return '—'
  if (selectedName.startsWith(`${unit}_`)) {
    return selectedName.slice(unit.length + 1).replaceAll('_', '-')
  }
  return selectedName
}

function clock(ts?: string | null) {
  if (!ts) return new Date().toTimeString().slice(0, 8)
  const m = ts.match(/T(\d{2}:\d{2}:\d{2})/)
  return m ? m[1] : ts.slice(-8)
}

function modeLabel(mode: TwinMode) {
  const map: Record<TwinMode, string> = {
    inspection: 'Inspection',
    live: 'Live',
    replay: 'Replay',
    fault: 'Fault Injection',
    prediction: 'Prediction',
    maintenance: 'Maintenance',
    raman: 'Raman Demo',
  }
  return map[mode] ?? mode
}

/**
 * Compact industrial SCADA status bar.
 * Expands to a timeline only in Replay mode.
 */
export default function StatusBar({
  active,
  scenario,
  scenarioId,
  mode,
  connection,
  progress,
  onProgress,
  playing,
  onPlaying,
  playSpeed,
  onPlaySpeed,
  selectedName,
  packets,
  ramanPulse,
}: Props) {
  const health = active?.health ?? null
  const invId = active?.inverter_id ?? '—'
  const unit = active ? sceneUnitId(active.inverter_id) : 'StringInverter_01'
  const comp = componentLabel(selectedName, unit)
  const connTone: HealthStatus | 'offline' =
    connection === 'connected' ? 'ok' : connection === 'error' ? 'danger' : 'offline'
  const expanded = mode === 'replay'
  const critical = (health != null && health < 55) || (active?.severity ?? 0) >= 0.8

  const scenarioShort =
    scenarioId === 'tim'
      ? 'TIM Degradation'
      : scenarioId === 'fan'
        ? 'Fan Failure'
        : scenarioId === 'cap'
          ? 'Cap Ageing'
          : (scenario?.fault_type ?? 'Healthy')

  let body: ReactNode

  if (critical && mode !== 'replay') {
    body = (
      <>
        <Seg icon="⚠" label="Critical" value={invId} tone="danger" />
        <Divider />
        <Seg
          label="Issue"
          value={comp !== '—' ? comp : (active?.hotspot_component ?? 'Hotspot')}
          tone="danger"
        />
        <Divider />
        <Seg
          icon="🌡"
          label="Temp"
          value={`${(active?.max_temperature ?? active?.temperature ?? 0).toFixed(0)}°C`}
          tone="danger"
        />
        <Divider />
        <Seg
          icon="🛡"
          label="Health"
          value={health != null ? `${health}%` : '—'}
          tone="danger"
        />
        <Divider />
        <Seg label="Fault" value={active?.fault_type ?? scenarioShort} tone="danger" />
      </>
    )
  } else if (mode === 'live') {
    body = (
      <>
        <Seg
          icon="🔌"
          label="Connection"
          value={connection === 'connected' ? 'Connected' : connection}
          tone={connTone}
        />
        <Divider />
        <Seg label="Update" value="1 Hz" tone="info" />
        <Divider />
        <Seg label="Packets" value={String(packets.received)} />
        <Divider />
        <Seg icon="🕒" label="Time" value={clock(active?.timestamp)} />
        <Divider />
        <Seg label="Last" value={active?.timestamp?.replace('T', ' ').slice(0, 19) ?? '—'} />
        {playing && (
          <>
            <Divider />
            <Seg label="REC" value="●" tone="danger" />
          </>
        )}
      </>
    )
  } else if (mode === 'fault') {
    body = (
      <>
        <Seg label="Scenario" value={scenarioShort} tone="warn" />
        <Divider />
        <Seg
          label="Severity"
          value={`${Math.round((active?.severity ?? progress) * 100)}%`}
          tone={health != null ? healthTone(health) : 'warn'}
        />
        <Divider />
        <Seg
          icon="🛡"
          label="Health"
          value={health != null ? `${health}%` : '—'}
          tone={health != null ? healthTone(health) : undefined}
        />
        <Divider />
        <Seg label="Progress" value={`${Math.round(progress * 100)}%`} />
        <Divider />
        <Seg label="Fault" value={active?.fault_type ?? '—'} />
      </>
    )
  } else if (mode === 'prediction') {
    body = (
      <>
        <Seg label="Prediction" value={active?.prediction_horizon ?? '+6 h'} tone="warn" />
        <Divider />
        <Seg
          icon="🛡"
          label="Health"
          value={health != null ? `${health}%` : '—'}
          tone={health != null ? healthTone(health) : 'warn'}
        />
        <Divider />
        <Seg icon="🌡" label="Temp" value={active ? `${active.temperature.toFixed(0)}°C` : '—'} />
        <Divider />
        <Seg
          label="RUL"
          value={active ? formatRul(active.remaining_useful_life) : '—'}
          tone="warn"
        />
        <Divider />
        <Seg
          label="Confidence"
          value={active ? `${Math.round(active.ml_confidence * 100)}%` : '—'}
        />
      </>
    )
  } else if (mode === 'raman') {
    body = (
      <>
        <Seg
          icon="🌡"
          label="Fibre"
          value={active ? `${active.average_temperature.toFixed(1)}°C` : '—'}
        />
        <Divider />
        <Seg
          label="Hotspot"
          value={active ? `${active.hotspot_position.toFixed(2)} m` : '—'}
          tone="warn"
        />
        <Divider />
        <Seg
          label="Max"
          value={active ? `${active.max_temperature.toFixed(1)}°C` : '—'}
          tone={active && active.max_temperature > 70 ? 'danger' : undefined}
        />
        <Divider />
        <Seg
          label="Pulse"
          value={ramanPulse ? 'Running' : 'Idle'}
          tone={ramanPulse ? 'info' : 'offline'}
        />
        <Divider />
        <Seg icon="🕒" label="Time" value={clock(active?.timestamp)} />
      </>
    )
  } else if (mode === 'maintenance') {
    body = (
      <>
        <Seg
          icon="🛡"
          label="Health"
          value={health != null ? `${health}%` : '—'}
          tone={health != null ? healthTone(health) : undefined}
        />
        <Divider />
        <Seg label="Priority" value={active?.maintenance_priority ?? '—'} tone="warn" />
        <Divider />
        <Seg label="Affected" value={active?.hotspot_component ?? '—'} />
        <Divider />
        <Seg label="Action" value={active?.recommended_action?.slice(0, 48) ?? '—'} />
      </>
    )
  } else {
    body = (
      <>
        <Seg
          icon="🛡"
          label="Health"
          value={health != null ? `${health}%` : '—'}
          tone={health != null ? healthTone(health) : 'offline'}
        />
        <Divider />
        <Seg
          icon="🔌"
          label="Connection"
          value={connection === 'connected' ? 'Connected' : connection}
          tone={connTone}
        />
        <Divider />
        <Seg label="Inverter" value={invId} />
        <Divider />
        <Seg label="Component" value={comp} />
        <Divider />
        <Seg icon="🌡" label="Temp" value={active ? `${active.temperature.toFixed(0)}°C` : '—'} />
        <Divider />
        <Seg
          label="Status"
          value={active?.status ?? '—'}
          tone={health != null ? healthTone(health) : undefined}
        />
        <Divider />
        <Seg icon="⚙" label="Mode" value={modeLabel(mode)} />
        <Divider />
        <Seg icon="🕒" label="Time" value={clock(active?.timestamp)} />
      </>
    )
  }

  return (
    <div className={`scada-statusbar${expanded ? ' expanded' : ''}`}>
      <div className="scada-statusbar-main">{body}</div>

      <div className="scada-statusbar-replay" aria-hidden={!expanded}>
        <span className="status-seg-label">Replay</span>
        <button
          type="button"
          className={`tool-btn compact${playing ? ' active' : ''}`}
          onClick={() => onPlaying(!playing)}
          tabIndex={expanded ? 0 : -1}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          className="tool-btn compact"
          onClick={() => onPlaying(false)}
          tabIndex={expanded ? 0 : -1}
        >
          Stop
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(progress * 100)}
          onChange={(e) => {
            onPlaying(false)
            onProgress(Number(e.target.value) / 100)
          }}
          className="replay-slider"
          tabIndex={expanded ? 0 : -1}
          aria-label="Replay timeline"
        />
        <span className="replay-time">
          {Math.round(progress * 100)}%
          <span className="status-seg-label"> / 100%</span>
        </span>
        <select
          value={playSpeed}
          onChange={(e) => onPlaySpeed(Number(e.target.value))}
          tabIndex={expanded ? 0 : -1}
          aria-label="Playback speed"
        >
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={2}>2×</option>
          <option value={4}>4×</option>
        </select>
        <span className="status-seg-label">{severityLabel(progress)}</span>
      </div>
    </div>
  )
}
