/** External engineering snapshot — visualization never invents these values. */

export type TwinComponentData = {
  temperature?: number
  health?: number
  status?: string
  thermal_resistance?: number
  max_temperature?: number
  average_temperature?: number
  hotspot_position?: number
  hotspot_radius?: number
  temperature_profile?: number[]
  /** Future MATLAB fields accepted without breaking the parser */
  T_surface?: number
  T_fibre?: number
  T_DTS?: number
  Confidence?: number
  PredictedRemainingLife?: number
  [key: string]: unknown
}

export type TwinInverterData = {
  id: string
  status: string
  health: number
  temperature: number
  fault: string
  severity?: string
  recommended_action?: string
  components?: Record<string, TwinComponentData>
}

export type TwinSnapshot = {
  timestamp: string
  source?: string
  fibre_length_m?: number
  inverters: TwinInverterData[]
}

export type ConnectionStatus =
  | 'disconnected'
  | 'loading'
  | 'connected'
  | 'error'

export type DataSourceKind = 'json-file' | 'json-url' | 'websocket' | 'rest'

export function sceneUnitId(invId: string): string {
  const m = invId.match(/(\d+)/)
  const n = m ? Number(m[1]) : 1
  return `StringInverter_${String(n).padStart(2, '0')}`
}

export function displayInvId(unitId: string): string {
  const m = unitId.match(/StringInverter_(\d+)/)
  return m ? `INV-${m[1]}` : unitId
}

export function findInverter(
  snapshot: TwinSnapshot | null,
  unitOrInvId: string,
): TwinInverterData | null {
  if (!snapshot) return null
  const want = unitOrInvId.startsWith('StringInverter_')
    ? displayInvId(unitOrInvId)
    : unitOrInvId
  return (
    snapshot.inverters.find((inv) => inv.id === want) ??
    snapshot.inverters.find((inv) => sceneUnitId(inv.id) === unitOrInvId) ??
    null
  )
}
