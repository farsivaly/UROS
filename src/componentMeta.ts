export type HealthStatus = 'ok' | 'warn' | 'danger'

export type ComponentMeta = {
  id: string
  label: string
  category: string
  description: string
  health: HealthStatus
  tags: string[]
}

/** Part suffixes shared by every string inverter unit */
export const STRING_INVERTER_INTERNAL_DEFS: Omit<ComponentMeta, 'id'>[] = [
  {
    label: 'DC Disconnect',
    category: 'Electrical',
    description: 'DC input disconnect inside the string inverter.',
    health: 'ok',
    tags: ['dc', 'safety'],
  },
  {
    label: 'MPPT Section',
    category: 'Power Electronics',
    description: 'Maximum power-point tracking section.',
    health: 'ok',
    tags: ['mppt', 'dc'],
  },
  {
    label: 'IGBT Module 01',
    category: 'Power Electronics',
    description: 'Power semiconductor module in the inverter stack.',
    health: 'ok',
    tags: ['igbt', 'hotspot'],
  },
  {
    label: 'IGBT Module 02',
    category: 'Power Electronics',
    description: 'Power semiconductor module in the inverter stack.',
    health: 'warn',
    tags: ['igbt', 'hotspot'],
  },
  {
    label: 'IGBT Module 03',
    category: 'Power Electronics',
    description: 'Power semiconductor module in the inverter stack.',
    health: 'ok',
    tags: ['igbt', 'hotspot'],
  },
  {
    label: 'Heat Sink',
    category: 'Thermal',
    description: 'Aluminium finned heat sink behind the IGBT modules.',
    health: 'ok',
    tags: ['thermal'],
  },
  {
    label: 'DC Link Capacitor',
    category: 'Electrical',
    description: 'DC bus energy storage capacitor.',
    health: 'ok',
    tags: ['dc-link'],
  },
  {
    label: 'Positive Busbar',
    category: 'Electrical',
    description: 'Positive DC copper busbar.',
    health: 'ok',
    tags: ['copper', 'dc'],
  },
  {
    label: 'Negative Busbar',
    category: 'Electrical',
    description: 'Negative DC copper busbar.',
    health: 'ok',
    tags: ['copper', 'dc'],
  },
  {
    label: 'Cooling Fan',
    category: 'Thermal',
    description: 'Forced-air cooling fan at the top of the cabinet.',
    health: 'ok',
    tags: ['cooling'],
  },
  {
    label: 'Air Duct',
    category: 'Thermal',
    description: 'Internal cooling air duct.',
    health: 'ok',
    tags: ['cooling'],
  },
  {
    label: 'AC Output Section',
    category: 'Electrical',
    description: 'AC output terminals and filter stage.',
    health: 'ok',
    tags: ['ac'],
  },
  {
    label: 'Control PCB',
    category: 'Controls',
    description: 'Inverter control and sensing printed circuit board.',
    health: 'ok',
    tags: ['controls'],
  },
  {
    label: 'Raman Fibre',
    category: 'Sensing',
    description: 'DTS fibre routed past IGBTs, heatsink, capacitors and busbars.',
    health: 'ok',
    tags: ['dts', 'fibre', 'raman'],
  },
  {
    label: 'Cabinet Door',
    category: 'Mechanical',
    description: 'Access door for the string inverter cabinet.',
    health: 'ok',
    tags: ['mechanical'],
  },
]

const INTERNAL_SUFFIXES = [
  'DCDisconnect',
  'MPPTSection',
  'IGBT_01',
  'IGBT_02',
  'IGBT_03',
  'HeatSink',
  'Capacitor_01',
  'Busbar_Positive',
  'Busbar_Negative',
  'CoolingFan_01',
  'AirDuct',
  'ACOutputSection',
  'ControlPCB',
  'RamanFibre',
  'Door',
] as const

export const STRING_INVERTER_UNIT_IDS = [
  'StringInverter_01',
  'StringInverter_02',
  'StringInverter_03',
  'StringInverter_04',
] as const

export function internalsForUnit(unitId: string): ComponentMeta[] {
  return STRING_INVERTER_INTERNAL_DEFS.map((def, i) => ({
    ...def,
    id: `${unitId}_${INTERNAL_SUFFIXES[i]}`,
    description: def.description.replace(
      'the string inverter',
      unitId.replace('StringInverter_', 'string inverter '),
    ),
  }))
}

/** All internals across units 01–04 (for meta lookup) */
export const STRING_INVERTER_INTERNALS: ComponentMeta[] =
  STRING_INVERTER_UNIT_IDS.flatMap((id) => internalsForUnit(id))

/** Top-level Quick focus entries (internals hang under each string inverter) */
export const QUICK_FOCUS: ComponentMeta[] = [
  {
    id: 'SolarPanelsCAD',
    label: 'Solar Panel Arrays',
    category: 'Generation',
    description: 'Eight horizontal ground-mount rows, 10 large modules each.',
    health: 'ok',
    tags: ['dc', 'pv'],
  },
  {
    id: 'SolarPanel_01_01',
    label: 'Panel Row 01',
    category: 'Generation',
    description: 'First tilted PV row on the ground-mount rack.',
    health: 'ok',
    tags: ['dc', 'pv'],
  },
  {
    id: 'StringInverterRow',
    label: 'String Inverter Row',
    category: 'Conversion',
    description: 'One SMA-style string inverter at the left end of each panel row, plus AC combiner on the main trench.',
    health: 'ok',
    tags: ['ac', 'string'],
  },
  {
    id: 'StringInverter_01',
    label: 'String Inverter 01',
    category: 'Conversion',
    description: 'Mounted on the left end of panel row 01.',
    health: 'ok',
    tags: ['string', 'igbt', 'mppt'],
  },
  {
    id: 'StringInverter_02',
    label: 'String Inverter 02',
    category: 'Conversion',
    description: 'Mounted on the left end of panel row 02.',
    health: 'ok',
    tags: ['string'],
  },
  {
    id: 'StringInverter_03',
    label: 'String Inverter 03',
    category: 'Conversion',
    description: 'Mounted on the left end of panel row 03.',
    health: 'warn',
    tags: ['string'],
  },
  {
    id: 'StringInverter_04',
    label: 'String Inverter 04',
    category: 'Conversion',
    description: 'Mounted on the left end of panel row 04.',
    health: 'ok',
    tags: ['string'],
  },
  {
    id: 'ACCombiner',
    label: 'AC Combiner / Switchgear',
    category: 'Electrical',
    description: 'AC combiner on the main cable trench collecting row inverter outputs.',
    health: 'ok',
    tags: ['ac', 'breaker'],
  },
  {
    id: 'InverterStation',
    label: 'Central Inverter Station',
    category: 'Conversion',
    description: 'Central MV transformer and switchgear skid on concrete pad.',
    health: 'ok',
    tags: ['ac', 'transformer'],
  },
  {
    id: 'Transformer',
    label: 'MV Transformer',
    category: 'Electrical',
    description: 'Step-up transformer section of the central station.',
    health: 'ok',
    tags: ['mv', 'transformer'],
  },
  {
    id: 'ControlRoom',
    label: 'Control Building',
    category: 'Buildings',
    description: 'Operations building on the west access road, separate from the MV pad.',
    health: 'ok',
    tags: ['scada'],
  },
  {
    id: 'CableTrench_Main',
    label: 'Cable Trenches',
    category: 'Electrical',
    description: 'Underground DC / fibre routing corridors.',
    health: 'ok',
    tags: ['cable', 'fibre'],
  },
]

const ALL_FOCUS: ComponentMeta[] = [...QUICK_FOCUS, ...STRING_INVERTER_INTERNALS]

/** Lookup map for resolveMeta / selection */
export const COMPONENT_META: Record<string, ComponentMeta> = Object.fromEntries(
  ALL_FOCUS.map((item) => [item.id, item]),
)

export const FOCUSABLE = ALL_FOCUS.map((item) => item.id)

export function resolveMeta(name: string): ComponentMeta | null {
  if (COMPONENT_META[name]) return COMPONENT_META[name]

  if (name === 'SolarPanels' || name === 'SolarPanelsCAD' || name.startsWith('SolarRow_')) {
    return COMPONENT_META.SolarPanelsCAD
  }
  if (name.startsWith('SolarPanel_')) {
    const row = name.split('_')[1]
    return {
      id: name,
      label: `Solar Panel ${name.replace('SolarPanel_', '').replaceAll('_', '-')}`,
      category: 'Generation',
      description: `PV module on ground-mount row ${row}.`,
      health: 'ok',
      tags: ['dc', 'pv'],
    }
  }
  if (name.startsWith('CableTrench')) {
    return COMPONENT_META.CableTrench_Main
  }

  // String inverter internals: StringInverter_01_HeatSink → focus meta
  if (name.startsWith('StringInverter_')) {
    const parts = name.split('_')
    // StringInverter_01
    if (parts.length === 2) {
      return COMPONENT_META[name] ?? COMPONENT_META.StringInverter_01
    }
    // StringInverter_01_IGBT_01 etc.
    const unit = `${parts[0]}_${parts[1]}`
    const rest = parts.slice(2).join('_')
    const keyed = `${unit}_${rest}`
    if (COMPONENT_META[keyed]) return COMPONENT_META[keyed]
    // Map unit 02-04 internals back to unit 01 labels as templates
    const as01 = `StringInverter_01_${rest}`
    if (COMPONENT_META[as01]) {
      return { ...COMPONENT_META[as01], id: keyed, label: `${COMPONENT_META[as01].label} (${unit})` }
    }
    if (rest.startsWith('IGBT')) {
      return {
        id: keyed,
        label: rest.replaceAll('_', ' '),
        category: 'Power Electronics',
        description: `IGBT module inside ${unit}.`,
        health: 'ok',
        tags: ['igbt'],
      }
    }
    if (rest.startsWith('Capacitor')) return COMPONENT_META.StringInverter_01_Capacitor_01
    if (rest.startsWith('CoolingFan')) return COMPONENT_META.StringInverter_01_CoolingFan_01
    if (rest.startsWith('HeatSink')) return COMPONENT_META.StringInverter_01_HeatSink
    if (rest.startsWith('Busbar_Positive')) return COMPONENT_META.StringInverter_01_Busbar_Positive
    if (rest.startsWith('Busbar_Negative')) return COMPONENT_META.StringInverter_01_Busbar_Negative
    if (rest === 'RamanFibre') return COMPONENT_META.StringInverter_01_RamanFibre
    if (rest === 'AirDuct') return COMPONENT_META.StringInverter_01_AirDuct
    if (rest === 'Door') return COMPONENT_META.StringInverter_01_Door
    if (rest === 'Cabinet' || rest.startsWith('Cabinet')) {
      return COMPONENT_META[unit] ?? COMPONENT_META.StringInverter_01
    }
    return COMPONENT_META[unit] ?? null
  }

  if (name.startsWith('ACCombiner')) return COMPONENT_META.ACCombiner
  if (name.startsWith('InverterStation') || name.startsWith('InverterCabinet')) {
    return COMPONENT_META.InverterStation
  }
  if (name.startsWith('Transformer')) return COMPONENT_META.Transformer
  if (name.startsWith('ControlRoom')) return COMPONENT_META.ControlRoom

  return null
}
