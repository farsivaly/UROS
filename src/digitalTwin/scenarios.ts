import type { TwinScenario } from './phase4Types'

export const SCENARIO_CATALOG = [
  {
    id: 'healthy',
    label: 'Healthy Operation',
    url: '/data/scenarios/healthy.json',
  },
  {
    id: 'tim',
    label: 'Thermal Interface Degradation',
    url: '/data/scenarios/tim_degradation.json',
  },
  {
    id: 'fan',
    label: 'Cooling Fan Failure',
    url: '/data/scenarios/cooling_fan.json',
  },
  {
    id: 'cap',
    label: 'Capacitor Ageing',
    url: '/data/scenarios/capacitor_ageing.json',
  },
] as const

export async function loadScenario(url: string): Promise<TwinScenario> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to load scenario (${res.status})`)
  const json = (await res.json()) as TwinScenario
  if (!json.frames?.length) throw new Error('Scenario has no frames')
  return json
}
