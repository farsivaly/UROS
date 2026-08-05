import type { TwinInverterData } from './types'

const FAULT_ACTIONS: Record<string, { severity: string; action: string }> = {
  None: {
    severity: 'Info',
    action: 'No action required. Continue nominal monitoring.',
  },
  Healthy: {
    severity: 'Info',
    action: 'No action required. Continue nominal monitoring.',
  },
  'Thermal Interface Degradation': {
    severity: 'Warning',
    action: 'Inspect TIM / heatsink contact pressure at next maintenance window.',
  },
  'Cooling Failure': {
    severity: 'Critical',
    action: 'Reduce load; verify fans and intake filters immediately.',
  },
  'Capacitor Ageing': {
    severity: 'Warning',
    action: 'Schedule DC-link capacitor health check and ESR measurement.',
  },
  Overtemperature: {
    severity: 'Critical',
    action: 'Derate or trip; investigate cooling path and ambient conditions.',
  },
  'Fan Failure': {
    severity: 'Warning',
    action: 'Replace failed cooling fan; confirm redundant airflow.',
  },
}

export function faultDetails(inv: TwinInverterData) {
  const fault = inv.fault || 'None'
  const preset = FAULT_ACTIONS[fault] ?? {
    severity: 'Warning',
    action: 'Review asset telemetry and maintenance procedure.',
  }
  return {
    fault,
    severity: inv.severity ?? preset.severity,
    recommended_action: inv.recommended_action ?? preset.action,
  }
}
