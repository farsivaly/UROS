import type { TwinSnapshot } from './types'

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Parse / validate external twin JSON. Throws on malformed payloads. */
export function parseTwinSnapshot(raw: unknown): TwinSnapshot {
  if (!isRecord(raw)) throw new Error('Twin payload must be an object')
  if (typeof raw.timestamp !== 'string') {
    throw new Error('Missing timestamp')
  }
  if (!Array.isArray(raw.inverters)) {
    throw new Error('Missing inverters array')
  }

  const inverters = raw.inverters.map((item, i) => {
    if (!isRecord(item)) throw new Error(`inverters[${i}] invalid`)
    if (typeof item.id !== 'string') throw new Error(`inverters[${i}].id required`)
    return {
      id: item.id,
      status: String(item.status ?? 'Unknown'),
      health: Number(item.health ?? 0),
      temperature: Number(item.temperature ?? 0),
      fault: String(item.fault ?? 'None'),
      severity: item.severity != null ? String(item.severity) : undefined,
      recommended_action:
        item.recommended_action != null
          ? String(item.recommended_action)
          : undefined,
      components: isRecord(item.components)
        ? (item.components as TwinSnapshot['inverters'][0]['components'])
        : undefined,
    }
  })

  return {
    timestamp: raw.timestamp,
    source: raw.source != null ? String(raw.source) : undefined,
    fibre_length_m:
      raw.fibre_length_m != null ? Number(raw.fibre_length_m) : undefined,
    inverters,
  }
}
