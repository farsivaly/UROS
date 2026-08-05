export type IntroStepId =
  | 'welcome'
  | 'energy'
  | 'solar'
  | 'inverters'
  | 'temperature'
  | 'monitoring'
  | 'raman'
  | 'twin'
  | 'start'

export type IntroSceneCue =
  | 'space'
  | 'space-demand'
  | 'farm-overview'
  | 'inverter-highlight'
  | 'inverter-interior'
  | 'tim-hotspot'
  | 'point-sensors'
  | 'raman-fibre'
  | 'twin-ready'

export type IntroCounter = {
  label: string
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  /** Count duration in ms */
  durationMs?: number
  /** Hover citation — placeholder until real source is added */
  reference?: string
}

/** Inline number/phrase in body or stat that shows a hover citation. */
export type IntroInlineRef = {
  /** Exact substring to wrap (first match). */
  text: string
  reference: string
}

export type IntroStep = {
  id: IntroStepId
  headline: string
  body: string
  stat: string
  scene: IntroSceneCue
  counters?: IntroCounter[]
  /** Citations for numbers mentioned in body / stat */
  refs?: IntroInlineRef[]
}

export const REF_PLACEHOLDER = 'Reference placeholder — add source later'

export const INTRO_STEPS: IntroStep[] = [
  {
    id: 'welcome',
    headline: 'Welcome',
    body: 'This digital twin explores how solar farms generate electricity, and how thermal sensing and analytics can keep string inverters healthy for decades of operation.',
    stat: 'UROS digital twin · research showcase',
    scene: 'space',
  },
  {
    id: 'energy',
    headline: 'The Energy Challenge',
    body: 'Energy is becoming a critical bottleneck. Electricity demand is rising rapidly, driven by AI data centres, expanding digital services, and the electrification of transport and industry. Meeting United Nations 2030 sustainability targets will require a substantial expansion of reliable low-carbon generation.',
    stat: 'UN 2030 sustainability targets',
    scene: 'space-demand',
    counters: [
      {
        label: 'UN target year',
        value: 2030,
        durationMs: 1600,
        reference: REF_PLACEHOLDER,
      },
      {
        label: 'Solar growth (2022)',
        value: 270,
        prefix: '+',
        suffix: ' TWh',
        durationMs: 1800,
        reference: REF_PLACEHOLDER,
      },
      {
        label: 'Solar share → 2030',
        value: 50,
        suffix: '%',
        durationMs: 2000,
        reference: REF_PLACEHOLDER,
      },
    ],
    refs: [
      { text: '2030', reference: REF_PLACEHOLDER },
      { text: 'AI data centres', reference: REF_PLACEHOLDER },
    ],
  },
  {
    id: 'solar',
    headline: 'Why Solar?',
    body: 'Photovoltaic systems are well placed to meet that need. Since 2022, solar output rose by a record 270 TWh (26%), bringing total generation to nearly 1,300 TWh. Solar now accounts for 42% of world electricity generation, and is projected to reach 50% by 2030.',
    stat: '+270 TWh in 2022 · ~1,300 TWh total · 50% by 2030',
    scene: 'farm-overview',
    refs: [
      { text: '270 TWh', reference: REF_PLACEHOLDER },
      { text: '26%', reference: REF_PLACEHOLDER },
      { text: '1,300 TWh', reference: REF_PLACEHOLDER },
      { text: '42%', reference: REF_PLACEHOLDER },
      { text: '50%', reference: REF_PLACEHOLDER },
      { text: '2030', reference: REF_PLACEHOLDER },
    ],
  },
  {
    id: 'inverters',
    headline: 'Why Inverters?',
    body: 'String inverters convert DC from the panels into AC for the grid. Count scales with plant size: as capacity grows in MW, more panel strings are added and each needs its own inverter, so a multi-MW farm can need hundreds of units. They remain among the most failure-prone assets and a leading driver of maintenance and energy losses over a 25+ year life.',
    stat: 'More MW → more strings → more inverters',
    scene: 'inverter-highlight',
    refs: [{ text: '25+', reference: REF_PLACEHOLDER }],
  },
  {
    id: 'temperature',
    headline: 'Why Temperature?',
    body: 'A key failure path is thermal interface degradation between IGBT modules and the heat sink. As the interface ages, heat transfer weakens, local hotspots form, and component risk rises long before a hard failure.',
    stat: 'IGBT → TIM → Heat sink',
    scene: 'tim-hotspot',
  },
  {
    id: 'monitoring',
    headline: 'Limits of Current Monitoring',
    body: 'Most inverter thermal monitoring is still reactive: alarms fire after temperatures are already high, or after a protection trip. Conventional point sensors only sample a few discrete locations, so a developing hotspot between those points can go unseen until damage is underway.',
    stat: 'Reactive alarms · sparse point sensors · blind spots',
    scene: 'point-sensors',
  },
  {
    id: 'raman',
    headline: 'How Raman DTS Works',
    body: 'Raman DTS measures temperature along a fibre, not just at one point. Stokes and anti-Stokes returns tell how hot; return delay tells where. Together they find hotspots between ordinary sensors.',
    stat: 'Δt → distance · I_as/I_s → temperature',
    scene: 'raman-fibre',
  },
  {
    id: 'twin',
    headline: 'The Digital Twin',
    body: 'This twin combines thermal evidence, Raman DTS, and predictive analytics so you can inspect components, watch faults develop, and practise maintenance decisions in real time. The underlying models were built in MATLAB and validated against real-world data; see the research appendix for methods, validation results, and further detail.',
    stat: 'MATLAB models · real-world validation · research appendix',
    scene: 'twin-ready',
  },
  {
    id: 'start',
    headline: 'Start Exploration',
    body: 'Continue into Learning Mode for a guided investigation, or skip ahead to Expert Mode for full SCADA-style controls. The Earth model credit stays available from the intro footer.',
    stat: 'Ready when you are',
    scene: 'twin-ready',
  },
]

export const EARTH_CREDIT = {
  title: 'Earth',
  url: 'https://skfb.ly/6TwGG',
  author: 'Akshat',
  license: 'Creative Commons Attribution',
  licenseUrl: 'http://creativecommons.org/licenses/by/4.0/',
}
