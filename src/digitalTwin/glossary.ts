/** Shared glossary — Learning Mode presentation of the same twin assets. */

export type GlossaryEntry = {
  simple_name: string
  technical_name: string
  short_explanation: string
  what_is_it: string
  what_does_it_do: string
  why_temperature: string
  if_fails: string
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  IGBT: {
    simple_name: 'Power switch module',
    technical_name: 'Insulated-Gate Bipolar Transistor (IGBT)',
    short_explanation: 'A high-power electronic switch used during DC-to-AC conversion.',
    what_is_it: 'An IGBT is a high-power electronic switch.',
    what_does_it_do:
      'It rapidly switches electrical current to help convert DC power from the solar panels into AC power for the grid.',
    why_temperature:
      'Excess heat can reduce efficiency and shorten the component’s life.',
    if_fails:
      'The inverter may derate, trip, or stop converting power safely.',
  },
  TIM: {
    simple_name: 'Thermal interface pad',
    technical_name: 'Thermal Interface Material (TIM)',
    short_explanation: 'Thin layer between the IGBT baseplate and the heat sink.',
    what_is_it: 'A thin pad between the IGBT baseplate and the heat sink.',
    what_does_it_do: 'It transfers heat from the IGBT into the heat sink.',
    why_temperature:
      'If the TIM degrades, heat stays in the IGBT and a hotspot forms.',
    if_fails:
      'IGBT temperature rises while cooling looks less effective: the core research fault story.',
  },
  HeatSink: {
    simple_name: 'Cooling metal block',
    technical_name: 'Heat Sink',
    short_explanation: 'Transfers heat away from power electronics.',
    what_is_it: 'A finned metal block attached to the power modules.',
    what_does_it_do:
      'It moves heat away from hot electronics into the cooling air stream.',
    why_temperature:
      'If the heat sink runs hot, the IGBTs are not being cooled well enough.',
    if_fails:
      'Temperatures rise across the stack and health falls quickly.',
  },
  Capacitor: {
    simple_name: 'Energy storage capacitor',
    technical_name: 'DC Link Capacitor',
    short_explanation: 'Stores energy on the DC bus inside the inverter.',
    what_is_it: 'A large capacitor on the DC link inside the cabinet.',
    what_does_it_do:
      'It smooths DC voltage and supplies short bursts of energy during switching.',
    why_temperature:
      'Ageing capacitors run hotter and become less effective.',
    if_fails:
      'Voltage ripple increases and the inverter may fault or age faster.',
  },
  CoolingFan: {
    simple_name: 'Cooling fan',
    technical_name: 'Forced-Air Cooling Fan',
    short_explanation: 'Moves air through the cabinet to remove heat.',
    what_is_it: 'A fan that pushes air across the heat sink and electronics.',
    what_does_it_do: 'It keeps the internal air flowing so heat can leave the cabinet.',
    why_temperature:
      'Without airflow, almost every component warms up together.',
    if_fails:
      'Cabinet air temperature rises and multiple alarms can appear.',
  },
  Busbar: {
    simple_name: 'Power conductor bar',
    technical_name: 'Busbar',
    short_explanation: 'Carries high current between internal sections.',
    what_is_it: 'A thick metal bar that carries high current.',
    what_does_it_do: 'It connects major power sections inside the inverter.',
    why_temperature:
      'A loose or overloaded joint creates a local hotspot.',
    if_fails:
      'Local overheating can damage insulation and trip the unit.',
  },
  RamanFibre: {
    simple_name: 'Temperature-sensing fibre',
    technical_name: 'Raman Distributed Temperature Sensing (DTS) Fibre',
    short_explanation: 'Measures temperature at many points along the fibre.',
    what_is_it: 'An optical fibre that senses temperature along its length.',
    what_does_it_do:
      'It reports a temperature profile so hotspots can be located without many separate sensors.',
    why_temperature:
      'A red or orange section means that part of the fibre is seeing higher heat.',
    if_fails:
      'Operators lose distributed temperature visibility inside the cabinet.',
  },
}

export function glossaryForComponent(key: string): GlossaryEntry | null {
  if (key.startsWith('IGBT')) return GLOSSARY.IGBT
  if (key.startsWith('TIM')) return GLOSSARY.TIM
  if (key.startsWith('HeatSink')) return GLOSSARY.HeatSink
  if (key.startsWith('Capacitor')) return GLOSSARY.Capacitor
  if (key.startsWith('CoolingFan')) return GLOSSARY.CoolingFan
  if (key.startsWith('Busbar')) return GLOSSARY.Busbar
  if (key.includes('Raman') || key.includes('Fibre')) return GLOSSARY.RamanFibre
  return null
}

export type ScenarioLesson = {
  id: string
  title: string
  what_changing: string
  what_watch: string
  expected: string
}

export const SCENARIO_LESSONS: Record<string, ScenarioLesson> = {
  healthy: {
    id: 'healthy',
    title: 'Healthy Operation',
    what_changing: 'Nothing unusual: temperatures and health stay in the normal range.',
    what_watch: 'Cool/green fibre colours and a high health score.',
    expected: 'The inverter stays healthy with only small temperature variation.',
  },
  tim: {
    id: 'tim',
    title: 'Thermal Interface Degradation',
    what_changing:
      'Heat is no longer transferred efficiently from the IGBT to the heat sink.',
    what_watch:
      'IGBT temperature, hotspot size, Raman fibre colour, and health percentage.',
    expected:
      'A hotspot grows near the IGBT, fibre colours shift toward orange/red, and health falls.',
  },
  fan: {
    id: 'fan',
    title: 'Cooling Fan Failure',
    what_changing: 'Airflow through the cabinet is reduced or stopped.',
    what_watch: 'Rising temperatures on several components at once, not just one hotspot.',
    expected: 'Health drops and alarms warn that cooling has failed.',
  },
  cap: {
    id: 'cap',
    title: 'Capacitor Ageing',
    what_changing: 'The DC-link capacitor runs hotter as it ages.',
    what_watch: 'Capacitor temperature, health trend, and remaining useful life.',
    expected: 'A maintenance recommendation appears before a hard failure.',
  },
}

export function faultDevelopmentLabel(progress: number): string {
  if (progress < 0.2) return '0%: Healthy'
  if (progress < 0.4) return '25%: Early Warning'
  if (progress < 0.65) return '50%: Developing Fault'
  if (progress < 0.85) return '75%: Serious'
  return '100%: Severe'
}

export function faultDevelopmentExplain(progress: number, scenarioId: string): string {
  if (scenarioId === 'healthy' || progress < 0.15) {
    return 'The inverter is operating normally. Temperatures are stable and health is high.'
  }
  if (progress < 0.4) {
    return 'Early signs of trouble are appearing. Watch for a small hotspot and a slight health drop.'
  }
  if (progress < 0.65) {
    if (scenarioId === 'tim') {
      return 'The thermal interface is becoming less effective. Heat is building up near the IGBT, so the hotspot is growing and the fibre is detecting a higher local temperature.'
    }
    if (scenarioId === 'fan') {
      return 'Cooling airflow is reduced. Several parts of the cabinet are warming together.'
    }
    return 'The fault is developing. Temperatures are rising and health is falling.'
  }
  if (progress < 0.85) {
    return 'The fault is serious. Operators would usually plan maintenance or reduce load soon.'
  }
  return 'The fault is severe. The digital twin shows critical temperatures, low health, and a short remaining useful life.'
}

export type QuizQuestion = {
  prompt: string
  choices: string[]
  answer: number
}

export const QUIZ_BANK: QuizQuestion[] = [
  {
    prompt: 'Which component removes heat from the IGBT?',
    choices: ['Heat sink', 'Capacitor', 'Busbar', 'Control PCB'],
    answer: 0,
  },
  {
    prompt: 'What does a red fibre section indicate?',
    choices: [
      'Lower voltage',
      'Higher local temperature',
      'Faster fan speed',
      'Open cabinet door',
    ],
    answer: 1,
  },
  {
    prompt: 'What does a string inverter do?',
    choices: [
      'Store battery energy only',
      'Convert DC from solar panels into AC for the grid',
      'Measure wind speed',
      'Cool the solar modules directly',
    ],
    answer: 1,
  },
]
