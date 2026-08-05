/** Phase 4 — time-series / scenario frame from external engineering export. */

export type TwinFrame = {
  progress: number
  timestamp: string
  health: number
  severity: number
  status?: string
  T_surface?: number[]
  T_fibre?: number[]
  T_DTS?: number[]
  hotspot_position?: number
  hotspot_radius?: number
  hotspot_component?: string
  ml_confidence?: number
  remaining_useful_life_hours?: number
  predicted_fault?: string
  maintenance_priority?: string
  recommended_action?: string
  thermal_resistance?: number
  ac_power_kw?: number
  dc_voltage?: number
  ac_voltage?: number
  current_a?: number
  stokes_profile?: number[]
  anti_stokes_profile?: number[]
  raman_ratio_profile?: number[]
  fibre_distance_m?: number[]
  alarms?: TwinAlarmSeed[]
}

export type TwinAlarmSeed = {
  alarm_id: string
  severity: 'Information' | 'Warning' | 'High' | 'Critical'
  message: string
  component_id?: string
  recommended_action?: string
}

export type TwinScenario = {
  simulation_id: string
  inverter_id: string
  fault_type: string
  fibre_length_m?: number
  model_version?: string
  frames: TwinFrame[]
  prediction_frames?: TwinFrame[]
}

export type TwinMode =
  | 'inspection'
  | 'live'
  | 'replay'
  | 'fault'
  | 'prediction'
  | 'maintenance'
  | 'raman'

export type FleetFilter = 'all' | 'healthy' | 'warnings' | 'critical' | 'offline'

export type GraphKind = 'dts' | 'ratio' | 'stokes' | 'antistokes'

export type TwinAlarm = TwinAlarmSeed & {
  timestamp: string
  inverter_id: string
  acknowledged: boolean
}

/** Central active-inverter state — single source for UI + scene. */
export type ActiveTwinState = {
  timestamp: string
  inverter_id: string
  operating_mode: TwinMode
  health: number
  status: string
  fault_type: string
  severity: number
  fault_progress: number
  temperature: number
  max_temperature: number
  average_temperature: number
  hotspot_position: number
  hotspot_radius: number
  hotspot_component: string
  thermal_resistance: number
  fibre_temperature_profile: number[]
  fibre_distance_profile: number[]
  stokes_profile: number[]
  anti_stokes_profile: number[]
  raman_ratio_profile: number[]
  ml_fault_class: string
  ml_confidence: number
  remaining_useful_life: number
  maintenance_priority: string
  recommended_action: string
  prediction_horizon: string
  connection_status: string
  ac_power_kw: number
  dc_voltage: number
  ac_voltage: number
  current_a: number
  is_predicted: boolean
  component_temps: Record<string, number>
  model_version: string
}
