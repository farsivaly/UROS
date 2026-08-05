import type { TwinSnapshot } from './types'
import type {
  ActiveTwinState,
  TwinAlarm,
  TwinFrame,
  TwinMode,
  TwinScenario,
} from './phase4Types'
import { interpolateFrame, severityLabel } from './interpolation'

function avg(arr: number[] | undefined, fallback: number) {
  if (!arr?.length) return fallback
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

function max(arr: number[] | undefined, fallback: number) {
  if (!arr?.length) return fallback
  return Math.max(...arr)
}

function distances(n: number, length: number): number[] {
  if (n <= 1) return [0]
  return Array.from({ length: n }, (_, i) => (i / (n - 1)) * length)
}

function defaultStokes(n: number, base = 1): number[] {
  return Array.from({ length: n }, (_, i) => base * (0.9 + 0.1 * Math.sin(i * 0.4)))
}

function defaultAntiStokes(dts: number[]): number[] {
  return dts.map((t) => 0.35 + (t - 35) * 0.018)
}

function defaultRatio(stokes: number[], anti: number[]): number[] {
  return stokes.map((s, i) => (anti[i] ?? 0.4) / Math.max(0.05, s))
}

/** Build central active state from an interpolated frame + scenario metadata. */
export function buildActiveState(opts: {
  scenario: TwinScenario
  frame: TwinFrame
  mode: TwinMode
  connectionStatus: string
  isPredicted?: boolean
}): ActiveTwinState {
  const { scenario, frame, mode, connectionStatus } = opts
  const fibreLen = scenario.fibre_length_m ?? 12.4
  const dts = frame.T_DTS?.length
    ? frame.T_DTS
    : frame.T_fibre?.length
      ? frame.T_fibre
      : Array.from({ length: 24 }, (_, i) => 40 + Math.sin(i * 0.3) * 2)

  const dist =
    frame.fibre_distance_m?.length === dts.length
      ? frame.fibre_distance_m
      : distances(dts.length, fibreLen)

  const stokes =
    frame.stokes_profile?.length === dts.length
      ? frame.stokes_profile
      : defaultStokes(dts.length)
  const anti =
    frame.anti_stokes_profile?.length === dts.length
      ? frame.anti_stokes_profile
      : defaultAntiStokes(dts)
  const ratio =
    frame.raman_ratio_profile?.length === dts.length
      ? frame.raman_ratio_profile
      : defaultRatio(stokes, anti)

  const surface = frame.T_surface ?? []
  const component_temps: Record<string, number> = {
    IGBT_01: surface[0] ?? avg(dts, 45),
    IGBT_02: surface[1] ?? max(dts, 50),
    IGBT_03: surface[2] ?? avg(dts, 45),
    HeatSink: avg(surface, avg(dts, 46)),
    Capacitor_01: avg(dts, 44) - 2,
    CoolingFan_01: 38 + frame.severity * 12,
  }

  const hotspotComp = frame.hotspot_component ?? 'IGBT_02'
  if (frame.hotspot_radius && frame.hotspot_radius > 0.05) {
    component_temps[hotspotComp] = max(surface.length ? surface : dts, 55)
  }

  const health = Math.round(frame.health)
  const status =
    frame.status ??
    (health >= 90 ? 'Healthy' : health >= 70 ? 'Attention' : 'Critical')

  return {
    timestamp: frame.timestamp,
    inverter_id: scenario.inverter_id,
    operating_mode: mode,
    health,
    status,
    fault_type: scenario.fault_type,
    severity: frame.severity,
    fault_progress: frame.progress,
    temperature: avg(surface.length ? surface : dts, 45),
    max_temperature: max(dts, 45),
    average_temperature: avg(dts, 42),
    hotspot_position: frame.hotspot_position ?? 0,
    hotspot_radius: frame.hotspot_radius ?? 0.02,
    hotspot_component: hotspotComp,
    thermal_resistance: frame.thermal_resistance ?? 0.1,
    fibre_temperature_profile: dts,
    fibre_distance_profile: dist,
    stokes_profile: stokes,
    anti_stokes_profile: anti,
    raman_ratio_profile: ratio,
    ml_fault_class: frame.predicted_fault ?? scenario.fault_type,
    ml_confidence: frame.ml_confidence ?? 0,
    remaining_useful_life: frame.remaining_useful_life_hours ?? 4000,
    maintenance_priority: frame.maintenance_priority ?? (health >= 90 ? 'Low' : health >= 70 ? 'Medium' : 'High'),
    recommended_action:
      frame.recommended_action ??
      (scenario.fault_type === 'Healthy'
        ? 'Continue nominal monitoring.'
        : 'Inspect affected thermal path.'),
    prediction_horizon: opts.isPredicted ? '+6 h forecast' : 'Current',
    connection_status: connectionStatus,
    ac_power_kw: frame.ac_power_kw ?? 245,
    dc_voltage: frame.dc_voltage ?? 1045,
    ac_voltage: frame.ac_voltage ?? 800,
    current_a: frame.current_a ?? 178,
    is_predicted: !!opts.isPredicted,
    component_temps,
    model_version: scenario.model_version ?? 'TIM-CNN-v2.1',
  }
}

export function activeStateToSnapshot(
  base: TwinSnapshot | null,
  active: ActiveTwinState,
  fibreLen: number,
): TwinSnapshot {
  const inverters = (base?.inverters ?? []).map((inv) => {
    if (inv.id !== active.inverter_id) return inv
    const comps = { ...(inv.components ?? {}) }
    for (const [key, temp] of Object.entries(active.component_temps)) {
      comps[key] = {
        ...comps[key],
        temperature: temp,
        health: active.health,
        status: active.status,
        hotspot_radius:
          key === active.hotspot_component ? active.hotspot_radius : undefined,
        hotspot_position:
          key === active.hotspot_component ? active.hotspot_position : undefined,
        thermal_resistance:
          key === 'HeatSink' ? active.thermal_resistance : comps[key]?.thermal_resistance,
      }
    }
    comps.RamanFibre = {
      ...comps.RamanFibre,
      max_temperature: active.max_temperature,
      average_temperature: active.average_temperature,
      hotspot_position: active.hotspot_position,
      hotspot_radius: active.hotspot_radius,
      temperature_profile: active.fibre_temperature_profile,
    }
    return {
      ...inv,
      status: active.status,
      health: active.health,
      temperature: active.temperature,
      fault: active.fault_type,
      severity: severityLabel(active.severity),
      recommended_action: active.recommended_action,
      components: comps,
    }
  })

  // Ensure active inverter exists in snapshot
  if (!inverters.some((i) => i.id === active.inverter_id)) {
    inverters.push({
      id: active.inverter_id,
      status: active.status,
      health: active.health,
      temperature: active.temperature,
      fault: active.fault_type,
      severity: severityLabel(active.severity),
      recommended_action: active.recommended_action,
      components: Object.fromEntries(
        Object.entries(active.component_temps).map(([k, temperature]) => [
          k,
          { temperature, health: active.health, status: active.status },
        ]),
      ),
    })
  }

  return {
    timestamp: active.timestamp,
    source: base?.source ?? 'phase4-scenario',
    fibre_length_m: fibreLen,
    inverters,
  }
}

export function alarmsFromFrame(
  scenario: TwinScenario,
  frame: TwinFrame,
): TwinAlarm[] {
  if (!frame.alarms?.length) {
    if (frame.severity < 0.35) return []
    return [
      {
        alarm_id: `${scenario.simulation_id}-auto`,
        timestamp: frame.timestamp,
        inverter_id: scenario.inverter_id,
        component_id: frame.hotspot_component ?? 'IGBT_02',
        severity:
          frame.severity >= 0.8
            ? 'Critical'
            : frame.severity >= 0.6
              ? 'High'
              : 'Warning',
        message: `${scenario.fault_type} — ${severityLabel(frame.severity)}`,
        acknowledged: false,
        recommended_action: frame.recommended_action,
      },
    ]
  }
  return frame.alarms.map((a) => ({
    ...a,
    timestamp: frame.timestamp,
    inverter_id: scenario.inverter_id,
    acknowledged: false,
  }))
}

export function resolveFrame(
  scenario: TwinScenario,
  progress: number,
  mode: TwinMode,
): { frame: TwinFrame; isPredicted: boolean } {
  const usePrediction = mode === 'prediction'
  return {
    frame: interpolateFrame(scenario, progress, usePrediction),
    isPredicted: usePrediction,
  }
}
