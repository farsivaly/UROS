import type { TwinFrame, TwinScenario } from './phase4Types'

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function lerpArr(a: number[] | undefined, b: number[] | undefined, t: number): number[] {
  const aa = a?.length ? a : b ?? []
  const bb = b?.length ? b : a ?? []
  if (!aa.length && !bb.length) return []
  const n = Math.max(aa.length, bb.length)
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const va = aa[Math.min(i, aa.length - 1)] ?? aa[aa.length - 1] ?? 0
    const vb = bb[Math.min(i, bb.length - 1)] ?? bb[bb.length - 1] ?? 0
    out.push(lerp(va, vb, t))
  }
  return out
}

/** Interpolate between scenario frames by fault_progress (0–1). */
export function interpolateFrame(
  scenario: TwinScenario,
  progress: number,
  usePrediction = false,
): TwinFrame {
  const frames = (usePrediction && scenario.prediction_frames?.length
    ? scenario.prediction_frames
    : scenario.frames
  ).slice().sort((a, b) => a.progress - b.progress)

  if (!frames.length) {
    return {
      progress: 0,
      timestamp: new Date().toISOString(),
      health: 100,
      severity: 0,
    }
  }

  const p = Math.max(0, Math.min(1, progress))
  if (p <= frames[0].progress) return { ...frames[0], progress: p }
  if (p >= frames[frames.length - 1].progress) {
    return { ...frames[frames.length - 1], progress: p }
  }

  let i = 0
  while (i < frames.length - 1 && frames[i + 1].progress < p) i++
  const a = frames[i]
  const b = frames[i + 1]
  const span = b.progress - a.progress || 1
  const t = (p - a.progress) / span

  return {
    progress: p,
    timestamp: t < 0.5 ? a.timestamp : b.timestamp,
    health: lerp(a.health, b.health, t),
    severity: lerp(a.severity, b.severity, t),
    status: t < 0.5 ? a.status ?? b.status : b.status ?? a.status,
    T_surface: lerpArr(a.T_surface, b.T_surface, t),
    T_fibre: lerpArr(a.T_fibre, b.T_fibre, t),
    T_DTS: lerpArr(a.T_DTS, b.T_DTS, t),
    hotspot_position: lerp(a.hotspot_position ?? 0, b.hotspot_position ?? 0, t),
    hotspot_radius: lerp(a.hotspot_radius ?? 0.02, b.hotspot_radius ?? 0.02, t),
    hotspot_component:
      t < 0.5
        ? a.hotspot_component ?? b.hotspot_component
        : b.hotspot_component ?? a.hotspot_component,
    ml_confidence: lerp(a.ml_confidence ?? 0, b.ml_confidence ?? 0, t),
    remaining_useful_life_hours: lerp(
      a.remaining_useful_life_hours ?? 5000,
      b.remaining_useful_life_hours ?? 5000,
      t,
    ),
    predicted_fault: t < 0.5 ? a.predicted_fault ?? b.predicted_fault : b.predicted_fault ?? a.predicted_fault,
    maintenance_priority:
      t < 0.5
        ? a.maintenance_priority ?? b.maintenance_priority
        : b.maintenance_priority ?? a.maintenance_priority,
    recommended_action:
      t < 0.5
        ? a.recommended_action ?? b.recommended_action
        : b.recommended_action ?? a.recommended_action,
    thermal_resistance: lerp(a.thermal_resistance ?? 0.1, b.thermal_resistance ?? 0.1, t),
    ac_power_kw: lerp(a.ac_power_kw ?? 240, b.ac_power_kw ?? 240, t),
    dc_voltage: lerp(a.dc_voltage ?? 1040, b.dc_voltage ?? 1040, t),
    ac_voltage: lerp(a.ac_voltage ?? 800, b.ac_voltage ?? 800, t),
    current_a: lerp(a.current_a ?? 180, b.current_a ?? 180, t),
    stokes_profile: lerpArr(a.stokes_profile, b.stokes_profile, t),
    anti_stokes_profile: lerpArr(a.anti_stokes_profile, b.anti_stokes_profile, t),
    raman_ratio_profile: lerpArr(a.raman_ratio_profile, b.raman_ratio_profile, t),
    fibre_distance_m: a.fibre_distance_m ?? b.fibre_distance_m,
    alarms: t < 0.5 ? a.alarms ?? b.alarms : b.alarms ?? a.alarms,
  }
}

export function severityLabel(severity: number): string {
  if (severity < 0.2) return 'Healthy'
  if (severity < 0.4) return 'Early degradation'
  if (severity < 0.6) return 'Moderate degradation'
  if (severity < 0.8) return 'Serious fault'
  return 'Severe fault'
}

export function maintenanceBand(health: number): {
  label: string
  tone: 'ok' | 'warn' | 'danger'
} {
  if (health >= 90) return { label: 'Healthy', tone: 'ok' }
  if (health >= 75) return { label: 'Monitor', tone: 'warn' }
  if (health >= 55) return { label: 'Maintenance Required', tone: 'warn' }
  return { label: 'Critical', tone: 'danger' }
}

export function formatRul(hours: number): string {
  if (hours >= 24 * 30) return `${(hours / (24 * 30)).toFixed(1)} months`
  if (hours >= 24) return `${(hours / 24).toFixed(0)} days`
  return `${Math.round(hours)} h`
}
