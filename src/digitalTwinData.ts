import type { HealthStatus } from './componentMeta'
import {
  displayInvId,
  faultDetails,
  findInverter,
  healthTone,
  type TwinSnapshot,
} from './digitalTwin'

export type AssetField = { label: string; value: string }

export type AssetDetails = {
  displayName: string
  assetType: string
  assetId: string
  parentInverter: string | null
  status: string
  healthPct: number
  health: HealthStatus
  temperature: string | null
  description: string
  fields: AssetField[]
  fault?: string
  severity?: string
  recommendedAction?: string
  raman?: {
    max: string
    avg: string
    hotspot: string
    length: string
  }
}

function unitIdFromName(name: string): string | null {
  const m = name.match(/^(StringInverter_\d{2})/)
  return m ? m[1] : null
}

function componentAssetId(unit: string, rest: string) {
  return `${displayInvId(unit)}-${rest.replaceAll('_', '-')}`
}

function fmtTemp(v: number | undefined | null) {
  if (v == null || Number.isNaN(v)) return null
  return `${v.toFixed(1)} °C`
}

/** Live digital-twin details driven by external snapshot (Phase 3). */
export function getAssetDetails(
  name: string | null,
  snapshot: TwinSnapshot | null = null,
): AssetDetails | null {
  if (!name) return null

  const unit = unitIdFromName(name)
  const inv = unit ? findInverter(snapshot, unit) : null

  if (unit && name === unit) {
    const fault = inv ? faultDetails(inv) : null
    const raman = inv?.components?.RamanFibre
    return {
      displayName: `String Inverter ${unit.slice(-2)}`,
      assetType: 'String Inverter',
      assetId: inv?.id ?? displayInvId(unit),
      parentInverter: null,
      status: inv?.status ?? 'Unknown',
      healthPct: inv?.health ?? 0,
      health: healthTone(inv?.health ?? 0),
      temperature: fmtTemp(inv?.temperature),
      description:
        'SMA-style string inverter with MPPT, IGBT stack, cooling and Raman fibre.',
      fault: fault?.fault,
      severity: fault?.severity,
      recommendedAction: fault?.recommended_action,
      raman: raman
        ? {
            max: fmtTemp(raman.max_temperature) ?? '—',
            avg: fmtTemp(raman.average_temperature) ?? '—',
            hotspot:
              raman.hotspot_position != null
                ? `${raman.hotspot_position.toFixed(2)} m`
                : '—',
            length:
              snapshot?.fibre_length_m != null
                ? `${snapshot.fibre_length_m.toFixed(1)} m`
                : '—',
          }
        : undefined,
      fields: [
        { label: 'Fault State', value: fault?.fault ?? '—' },
        { label: 'Severity', value: fault?.severity ?? '—' },
        {
          label: 'Recommended Action',
          value: fault?.recommended_action ?? '—',
        },
        { label: 'Last Update', value: snapshot?.timestamp ?? '—' },
      ],
    }
  }

  if (unit && name.startsWith(`${unit}_`)) {
    const rest = name.slice(unit.length + 1)
    const parent = `String Inverter ${unit.slice(-2)}`
    const base = {
      parentInverter: parent,
      assetId: componentAssetId(unit, rest),
    }

    const compKey = rest.match(/^(IGBT_\d{2}|HeatSink|RamanFibre|Capacitor_\d{2}|CoolingFan_\d{2}|Door)/)?.[1]
      ?? rest.split('_').slice(0, 2).join('_')
    const shortKey =
      rest.startsWith('HeatSink')
        ? 'HeatSink'
        : rest.startsWith('TIM_IGBT')
          ? rest.match(/^TIM_IGBT_\d{2}/)?.[0] ?? rest
          : rest.startsWith('IGBT')
            ? rest.match(/^IGBT_\d{2}/)?.[0] ?? rest
            : rest.startsWith('Capacitor')
              ? rest.match(/^Capacitor_\d{2}/)?.[0] ?? 'Capacitor_01'
              : rest.startsWith('CoolingFan')
                ? rest.match(/^CoolingFan_\d{2}/)?.[0] ?? 'CoolingFan_01'
                : rest

    const comp = inv?.components?.[shortKey]

    if (rest.startsWith('TIM_IGBT')) {
      const idx = rest.replace('TIM_IGBT_', '').slice(0, 2)
      const parentIgbt = inv?.components?.[`IGBT_${idx}`]
      return {
        ...base,
        displayName: `TIM Layer ${idx}`,
        assetType: 'Thermal Interface Material',
        status: String(parentIgbt?.status ?? 'Unknown'),
        healthPct: Number(parentIgbt?.health ?? inv?.health ?? 0),
        health: healthTone(Number(parentIgbt?.health ?? inv?.health ?? 0)),
        temperature: fmtTemp(parentIgbt?.temperature),
        description: 'Thermal interface between IGBT baseplate and heat sink.',
        fields: [
          { label: 'Parent IGBT', value: `IGBT_${idx}` },
          { label: 'Parent Asset', value: parent },
        ],
      }
    }

    if (rest.startsWith('IGBT')) {
      const idx = rest.replace('IGBT_', '').slice(0, 2)
      return {
        ...base,
        displayName: `IGBT Module ${idx}`,
        assetType: 'IGBT Module',
        status: String(comp?.status ?? 'Unknown'),
        healthPct: Number(comp?.health ?? inv?.health ?? 0),
        health: healthTone(Number(comp?.health ?? inv?.health ?? 0)),
        temperature: fmtTemp(comp?.temperature),
        description: 'Power semiconductor module used in DC-to-AC conversion.',
        fields: [
          { label: 'Switching State', value: String(comp?.status ?? '—') },
          { label: 'Parent Asset', value: parent },
        ],
      }
    }

    if (rest.startsWith('HeatSink')) {
      return {
        ...base,
        displayName: 'Heat Sink',
        assetType: 'Heat Sink',
        status: String(comp?.status ?? 'Unknown'),
        healthPct: Number(comp?.health ?? 0),
        health: healthTone(Number(comp?.health ?? 0)),
        temperature: fmtTemp(comp?.temperature),
        description: 'Aluminium finned heat sink behind the IGBT modules.',
        fields: [
          {
            label: 'Thermal Resistance',
            value:
              comp?.thermal_resistance != null
                ? `${comp.thermal_resistance} K/W`
                : '—',
          },
          { label: 'Parent Asset', value: parent },
        ],
      }
    }

    if (rest === 'RamanFibre') {
      return {
        ...base,
        displayName: 'Raman Fibre',
        assetType: 'Raman Fibre / DTS',
        status: 'Live',
        healthPct: inv?.health ?? 0,
        health: healthTone(inv?.health ?? 0),
        temperature: fmtTemp(comp?.average_temperature ?? comp?.T_fibre),
        description: 'DTS fibre routed past IGBTs, heatsink, capacitors and busbars.',
        raman: {
          max: fmtTemp(comp?.max_temperature) ?? '—',
          avg: fmtTemp(comp?.average_temperature) ?? '—',
          hotspot:
            comp?.hotspot_position != null
              ? `${comp.hotspot_position.toFixed(2)} m`
              : '—',
          length:
            snapshot?.fibre_length_m != null
              ? `${snapshot.fibre_length_m.toFixed(1)} m`
              : '—',
        },
        fields: [
          { label: 'Maximum Temperature', value: fmtTemp(comp?.max_temperature) ?? '—' },
          { label: 'Average Temperature', value: fmtTemp(comp?.average_temperature) ?? '—' },
          {
            label: 'Hotspot Position',
            value:
              comp?.hotspot_position != null
                ? `${comp.hotspot_position.toFixed(2)} m`
                : '—',
          },
          { label: 'Parent Asset', value: parent },
        ],
      }
    }

    if (rest.startsWith('Capacitor')) {
      return {
        ...base,
        displayName: 'DC Link Capacitor',
        assetType: 'DC Link Capacitor',
        status: String(comp?.status ?? 'Healthy'),
        healthPct: Number(comp?.health ?? 95),
        health: healthTone(Number(comp?.health ?? 95)),
        temperature: fmtTemp(comp?.temperature),
        description: 'DC bus energy storage capacitor.',
        fields: [{ label: 'Parent Asset', value: parent }],
      }
    }

    if (rest.startsWith('CoolingFan')) {
      return {
        ...base,
        displayName: 'Cooling Fan',
        assetType: 'Cooling Fan',
        status: String(comp?.status ?? 'Running'),
        healthPct: Number(comp?.health ?? 92),
        health: healthTone(Number(comp?.health ?? 92)),
        temperature: fmtTemp(comp?.temperature),
        description: 'Forced-air cooling fan at the top of the cabinet.',
        fields: [{ label: 'Parent Asset', value: parent }],
      }
    }

    if (rest === 'Door') {
      return {
        ...base,
        displayName: 'Cabinet Door',
        assetType: 'Mechanical',
        status: 'Healthy',
        healthPct: 100,
        health: 'ok',
        temperature: null,
        description: 'Access door for the string inverter cabinet.',
        fields: [{ label: 'Parent Asset', value: parent }],
      }
    }

    void compKey
    const label = rest.replaceAll('_', ' ')
    return {
      ...base,
      displayName: label,
      assetType: 'Inverter Component',
      status: String(comp?.status ?? 'Healthy'),
      healthPct: Number(comp?.health ?? inv?.health ?? 96),
      health: healthTone(Number(comp?.health ?? inv?.health ?? 96)),
      temperature: fmtTemp(comp?.temperature),
      description: `${label} inside ${parent}.`,
      fields: [{ label: 'Parent Asset', value: parent }],
    }
  }

  if (name === 'ACCombiner' || name.startsWith('ACCombiner_')) {
    return {
      displayName: 'AC Combiner / Switchgear',
      assetType: 'AC Combiner',
      assetId: 'AC-COMB-01',
      parentInverter: null,
      status: 'Healthy',
      healthPct: 98,
      health: 'ok',
      temperature: '38.5 °C',
      description: 'Collects AC outputs from string inverters on the main trench.',
      fields: [
        { label: 'AC Voltage', value: '800 V' },
        { label: 'Fault State', value: 'None' },
      ],
    }
  }

  if (name.startsWith('SolarPanel') || name === 'SolarPanelsCAD' || name.startsWith('SolarRow')) {
    return {
      displayName: 'Solar Panel Array',
      assetType: 'PV Generation',
      assetId: 'PV-ARRAY-01',
      parentInverter: null,
      status: 'Healthy',
      healthPct: 99,
      health: 'ok',
      temperature: '36.2 °C',
      description: 'Ground-mount PV modules.',
      fields: [{ label: 'DC String', value: 'Nominal' }],
    }
  }

  return {
    displayName: name,
    assetType: 'Site Asset',
    assetId: name,
    parentInverter: null,
    status: 'Healthy',
    healthPct: 100,
    health: 'ok',
    temperature: null,
    description: 'Site infrastructure asset.',
    fields: [],
  }
}

export function activeInverterId(selectedName: string | null): string {
  return unitIdFromName(selectedName ?? '') ?? 'StringInverter_01'
}
