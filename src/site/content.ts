export type SiteRoute =
  | 'home'
  | 'report'
  | 'poster'
  | 'presentation'
  | 'literature'
  | 'model'

export type PortalId = SiteRoute | 'playground'

export const RESEARCH = {
  brand: 'UROS',
  institution: 'UCL',
  author: 'Tengku Faris Bin Tengku Zuhri',
  supervisors: ['Professor Martyn Fice', 'Dr Mohamed Nihal Munshi'] as const,
  title:
    'Digital Twin-based Condition Monitoring of Solar Farm Inverters Using Electrothermal Degradation Modelling and Raman Distributed Temperature Sensing',
  shortTitle: 'Condition monitoring of solar-farm inverters',
  kicker: 'Research companion',
  lead: 'A written report, research poster, presentation, literature review, physics-informed MATLAB/Simulink twin, and an interactive learning playground for Raman distributed temperature sensing on photovoltaic string inverters.',
}

export const NAV = [
  { id: 'home' as const, href: '#/', label: 'Overview' },
  { id: 'report' as const, href: '#/report', label: 'Report' },
  { id: 'poster' as const, href: '#/poster', label: 'Poster' },
  { id: 'presentation' as const, href: '#/presentation', label: 'Presentation' },
  { id: 'literature' as const, href: '#/literature', label: 'Literature' },
  { id: 'model' as const, href: '#/model', label: 'Models' },
  { id: 'playground' as const, href: '#/playground', label: 'Playground' },
]

export const PORTALS: {
  id: PortalId
  index: string
  href: string
  title: string
  kicker: string
  body: string
  cta: string
  media: 'poster' | 'pipeline' | 'farm' | 'document' | 'slides' | 'literature'
  soon?: boolean
}[] = [
  {
    id: 'report',
    index: '01',
    href: '#/report',
    title: 'Research report',
    kicker: '2-page report · extended article',
    body: 'Physics-informed digital twin integrating Raman distributed fibre sensing for predictive maintenance of utility-scale solar farm inverters.',
    cta: 'Open the report',
    media: 'document',
  },
  {
    id: 'poster',
    index: '02',
    href: '#/poster',
    title: 'Research poster',
    kicker: 'UCL A0 poster · PDF',
    body: 'The conference poster: problem, electrothermal method, Raman DTS, and the current thermal-feature results.',
    cta: 'Open the poster',
    media: 'poster',
  },
  {
    id: 'presentation',
    index: '03',
    href: '#/presentation',
    title: 'Research presentation',
    kicker: 'UCL200 slides · PDF',
    body: 'Electrothermal digital twin and Raman DTS for solar inverter condition monitoring — the research talk deck.',
    cta: 'Open the presentation',
    media: 'slides',
  },
  {
    id: 'literature',
    index: '04',
    href: '#/literature',
    title: 'Literature review',
    kicker: 'Review · PDF',
    body: 'Prior work on inverter reliability, Raman DTS, and predictive maintenance. A placeholder is up now; the review PDF will sit here when it is ready.',
    cta: 'Open the literature review',
    media: 'literature',
    soon: true,
  },
  {
    id: 'model',
    index: '05',
    href: '#/model',
    title: 'Models',
    kicker: 'Block diagrams · MATLAB',
    body: 'System block diagrams for the three-phase inverter and Raman DTS chain, plus the physics-informed MATLAB/Simulink twin.',
    cta: 'Open the models',
    media: 'pipeline',
  },
  {
    id: 'playground',
    index: '06',
    href: '#/playground',
    title: 'Learning playground',
    kicker: '3D digital twin',
    body: 'Investigate a solar-farm fault in the virtual environment: walk the site, open a string inverter, and read the Raman fibre the way a maintenance engineer would.',
    cta: 'Enter the playground',
    media: 'farm',
  },
]

export const DOCUMENTS: Record<
  'report' | 'poster' | 'presentation' | 'literature',
  {
    kicker: string
    title: string
    summary: string
    href: string
    preview?: string
    dropPath: string
    openLabel: string
    downloadLabel: string
    extraActions?: { href: string; label: string }[]
    cover: string
  }
> = {
  report: {
    kicker: '01 · Report',
    title: 'Research report',
    summary:
      'Choose the 2-page report or the extended article. The short paper is available now; the extended version will appear here when it is ready.',
    href: '/research/report.pdf',
    preview: '/research/previews/report.jpg',
    dropPath: 'public/research/report.pdf',
    openLabel: 'Open report PDF',
    downloadLabel: 'Download report',
    cover: 'Aims, method, and current write-up.',
  },
  poster: {
    kicker: '02 · Poster',
    title: 'Research poster',
    summary:
      'UCL A0 poster for the digital-twin and Raman DTS study. This is the displayed poster, not the written report.',
    href: '/research/poster.pdf',
    preview: '/research/previews/poster.jpg',
    dropPath: 'public/research/poster.pdf',
    openLabel: 'Open poster PDF',
    downloadLabel: 'Download poster',
    extraActions: [
      { href: '/research/report-brief.pdf', label: 'Abstract note' },
    ],
    cover: 'Problem, method, and current thermal-feature results.',
  },
  presentation: {
    kicker: '03 · Presentation',
    title: 'Research presentation',
    summary:
      'UCL200 slide deck for the research talk: electrothermal digital twin and Raman DTS for solar inverter condition monitoring.',
    href: '/research/presentation.pdf',
    preview: '/research/previews/presentation.jpg',
    dropPath: 'public/research/presentation.pdf',
    openLabel: 'Open presentation PDF',
    downloadLabel: 'Download slides',
    cover: 'Talk slides for the UROS project.',
  },
  literature: {
    kicker: '04 · Literature',
    title: 'Literature review',
    summary:
      'The literature review is a separate document from the report and poster. Add the PDF at the path below and this page will show it automatically.',
    href: '/research/literature-review.pdf',
    dropPath: 'public/research/literature-review.pdf',
    openLabel: 'Open literature review',
    downloadLabel: 'Download review',
    cover: 'Prior work on inverter reliability, Raman DTS, and predictive maintenance.',
  },
}

export const REPORT_VERSIONS = [
  {
    id: 'short' as const,
    label: '2-page report',
    href: '/research/report.pdf',
    preview: '/research/previews/report.jpg',
    dropPath: 'public/research/report.pdf',
    summary:
      'The short written report on the physics-informed digital twin and Raman DTS method.',
    cover: 'Two-page research report.',
    openLabel: 'Open 2-page PDF',
    downloadLabel: 'Download 2-page report',
    hash: '#/report',
  },
  {
    id: 'extended' as const,
    label: 'Extended article',
    href: '/research/report-extended.pdf',
    dropPath: 'public/research/report-extended.pdf',
    summary:
      'The extended article will sit here when it is ready. Drop the PDF at the path below and refresh.',
    cover: 'Full-length research article.',
    openLabel: 'Open extended PDF',
    downloadLabel: 'Download extended article',
    hash: '#/report?view=extended',
  },
] as const

export type ReportVersionId = (typeof REPORT_VERSIONS)[number]['id']

export const MODEL_VIEWS = [
  {
    id: 'blocks' as const,
    label: 'Block diagrams',
    hash: '#/model',
    kicker: '05 · Models',
    title: 'Block diagrams',
    summary:
      'The three-phase inverter electrical model and the Raman DTS sensing chain. Switch to MATLAB for the Simulink implementation.',
  },
  {
    id: 'matlab' as const,
    label: 'MATLAB model',
    hash: '#/model?view=matlab',
    kicker: '05 · Models',
    title: 'MATLAB / Simulink twin',
    summary:
      'Open these files in MATLAB/Simulink. The campaign model injects IGBT losses into a Cauer network, applies thermal-path degradation to Rth2, and reconstructs T_DTS(x, t) along a 20 m fibre.',
  },
] as const

export type ModelViewId = (typeof MODEL_VIEWS)[number]['id']

export const INVERTER_PIPELINE = [
  { from: 'PV array', to: 'V / I readings', note: 'String DC source' },
  { from: 'MPPT controller', to: 'DC–DC converter', note: 'Boost / MPPT' },
  { from: 'DC-link', to: 'HV capacitor', note: 'Vdc 500–700 V' },
  { from: 'SPWM control', to: 'Gate signals', note: 'f_sw = 2 kHz' },
  { from: 'IGBT inverter', to: 'Three-phase AC', note: 'P = 2 kW · 50 Hz' },
]

export const RAMAN_PIPELINE = [
  { from: 'Pump source', to: 'Fibre launch', note: '1550 nm · ~70 mW' },
  { from: 'Fibre interaction', to: 'Stokes / anti-Stokes', note: 'L = 20 m · Δz = 0.5 m' },
  { from: 'Optical collection', to: 'Photocurrents', note: 'I_S · I_AS' },
  { from: 'Front-end electronics', to: 'V_S(t) · V_AS(t)', note: 'TIA · LPF' },
  { from: 'Ratio reconstruction', to: 'T_DTS(x)', note: '41 spatial channels' },
]

export const PIPELINE = [
  { from: 'PV string', to: 'DC link', note: 'Vdc 500–700 V · P 2 kW' },
  { from: 'Three-phase inverter', to: 'IGBT losses', note: 'Conduction + switching' },
  { from: 'Cauer network', to: 'TIM / Rth2', note: 'α = 1.00–2.00' },
  { from: 'Surface temperature', to: 'Sensing fibre', note: '20 m · 0.5 m step' },
  { from: 'Stokes / anti-Stokes', to: 'T_DTS(x, t)', note: '41 spatial channels' },
]

export const MODEL_FILES: {
  name: string
  kind: 'Simulink' | 'Script'
  href: string
  role: string
  bytes: string
}[] = [
  {
    name: 'thermal_IGBT_Loss.slx',
    kind: 'Simulink',
    href: '/research/matlab/thermal_IGBT_Loss.slx',
    role: 'Primary electrothermal campaign model used for the degradation sweep.',
    bytes: '333 KB',
  },
  {
    name: 'raman_updated.slx',
    kind: 'Simulink',
    href: '/research/matlab/raman_updated.slx',
    role: 'Raman interrogator, fibre attenuation, and temperature reconstruction.',
    bytes: '329 KB',
  },
  {
    name: 'thermal_loss.slx',
    kind: 'Simulink',
    href: '/research/matlab/thermal_loss.slx',
    role: 'Semiconductor loss to controlled heat-flow source.',
    bytes: '226 KB',
  },
  {
    name: 'Full_model.slx',
    kind: 'Simulink',
    href: '/research/matlab/Full_model.slx',
    role: 'Coupled electrical–thermal–optical assembly.',
    bytes: '178 KB',
  },
  {
    name: 'inverter.slx',
    kind: 'Simulink',
    href: '/research/matlab/inverter.slx',
    role: 'Three-phase switching inverter and wye-connected load.',
    bytes: '148 KB',
  },
  {
    name: 'raman.slx',
    kind: 'Simulink',
    href: '/research/matlab/raman.slx',
    role: 'Earlier Raman DTS optical chain.',
    bytes: '115 KB',
  },
  {
    name: 'temperature_network.slx',
    kind: 'Simulink',
    href: '/research/matlab/temperature_network.slx',
    role: 'Cauer thermal network (Rth, Cth).',
    bytes: '103 KB',
  },
  {
    name: 'init_pv_inverter.m',
    kind: 'Script',
    href: '/research/matlab/init_pv_inverter.m',
    role: 'Physics parameterisation: electrical, thermal, Raman, and degradation.',
    bytes: '13 KB',
  },
  {
    name: 'Inverter_new.m',
    kind: 'Script',
    href: '/research/matlab/Inverter_new.m',
    role: 'Optical transmitter, pulse width from 0.5 m spatial resolution.',
    bytes: '11 KB',
  },
  {
    name: 'degradations_states_new.m',
    kind: 'Script',
    href: '/research/matlab/degradations_states_new.m',
    role: '100-run Ta × Vdc × severity campaign (P = 2 kW, m = 0.8).',
    bytes: '26 KB',
  },
  {
    name: 'run_degradation.m',
    kind: 'Script',
    href: '/research/matlab/run_degradation.m',
    role: 'Screening campaign runner for internal thermal degradation.',
    bytes: '23 KB',
  },
  {
    name: 'generate_degradation.m',
    kind: 'Script',
    href: '/research/matlab/generate_degradation.m',
    role: 'Dataset generation helper for labelled thermal-path states.',
    bytes: '20 KB',
  },
  {
    name: 'degradation_states.m',
    kind: 'Script',
    href: '/research/matlab/degradation_states.m',
    role: 'Four-class severity mapping (Healthy / Mild / Moderate / Severe).',
    bytes: '15 KB',
  },
  {
    name: 'blindval.m',
    kind: 'Script',
    href: '/research/matlab/blindval.m',
    role: 'Blind-validation condition export.',
    bytes: '9 KB',
  },
  {
    name: 'inverter_hotspot.m',
    kind: 'Script',
    href: '/research/matlab/inverter_hotspot.m',
    role: 'Hotspot localisation along the inverter fibre segment (5–7 m).',
    bytes: '3 KB',
  },
  {
    name: 't_surface_degradation.m',
    kind: 'Script',
    href: '/research/matlab/t_surface_degradation.m',
    role: 'Inverter surface-temperature export.',
    bytes: '4 KB',
  },
  {
    name: 'RamanDTS.m',
    kind: 'Script',
    href: '/research/matlab/RamanDTS.m',
    role: 'Normalised DTS feature plot versus severity.',
    bytes: '1 KB',
  },
]

export const SEVERITY = [
  { label: 'Healthy', alpha: '1.00' },
  { label: 'Mild', alpha: '1.25' },
  { label: 'Moderate', alpha: '1.50' },
  { label: 'Severe', alpha: '2.00' },
]

// Held-out score is quoted over the independent Simulink exports only. Six
// condition/severity pairs were synthesised from training runs, and the load
// normalisation makes those algebraically identical to their source, so they
// carry no test information.
export const CLASSIFIER_RESULTS = [
  { label: 'Training runs', value: '95' },
  { label: 'Independent tests', value: '14' },
  { label: 'Test accuracy', value: '14 / 14' },
  { label: 'Noise limit', value: '0.2 mK' },
]
