import { useEffect, useMemo, useState } from 'react'
import FibreGraph from './FibreGraph'
import RamanFibreDetailPopup from './RamanFibreDetailPopup'
import { RamanArchitectureBoard } from './ramanFormulas'
import InvestigationComplete from './InvestigationComplete'
import InvestigationAward from './InvestigationAward'
import TrophyCeremony from './TrophyCeremony'
import {
  formatRul,
  healthTone,
  maintenanceBand,
  sceneUnitId,
  type ActiveTwinState,
  type TwinScenario,
} from './digitalTwin'
import {
  SCENARIO_LESSONS,
  faultDevelopmentExplain,
  faultDevelopmentLabel,
} from './digitalTwin/glossary'
import type { CameraPreset } from './FarmScene'

type MatchItem = {
  id: string
  label: string
  pickSuffix: string
  functionId: string
}

type FunctionOption = {
  id: string
  text: string
}

const INSIDE_MATCH_PARTS: MatchItem[] = [
  { id: 'mppt', label: 'MPPT', pickSuffix: '_MPPTSection', functionId: 'fn_mppt' },
  { id: 'igbt', label: 'IGBT', pickSuffix: '_IGBT_02', functionId: 'fn_igbt' },
  { id: 'heatsink', label: 'Heat sink', pickSuffix: '_HeatSink', functionId: 'fn_heatsink' },
  { id: 'fan', label: 'Cooling fan', pickSuffix: '_CoolingFan_01', functionId: 'fn_fan' },
  { id: 'busbar', label: 'Busbar', pickSuffix: '_Busbar_Positive', functionId: 'fn_busbar' },
  { id: 'capacitor', label: 'Capacitor', pickSuffix: '_Capacitor_01', functionId: 'fn_capacitor' },
]

const INSIDE_MATCH_FUNCTIONS: FunctionOption[] = [
  { id: 'fn_mppt', text: 'Adjusts panel operating point for maximum power' },
  { id: 'fn_igbt', text: 'Rapidly switches DC to generate AC' },
  { id: 'fn_heatsink', text: 'Removes heat from the switching devices' },
  { id: 'fn_fan', text: 'Moves air across the heat sink' },
  { id: 'fn_busbar', text: 'Carries high current between sections' },
  { id: 'fn_capacitor', text: 'Stores energy on the DC link' },
]

function shuffleIds(ids: string[]) {
  const arr = [...ids]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function ComponentMatchQuiz({
  unit,
  onPick,
  passed,
  onPassed,
}: {
  unit: string
  onPick: (name: string) => void
  passed: boolean
  onPassed: (v: boolean) => void
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)
  const optionOrder = useMemo(
    () => shuffleIds(INSIDE_MATCH_FUNCTIONS.map((f) => f.id)),
    [],
  )
  const options = optionOrder
    .map((id) => INSIDE_MATCH_FUNCTIONS.find((f) => f.id === id)!)
    .filter(Boolean)

  const allFilled = INSIDE_MATCH_PARTS.every((p) => answers[p.id])
  const results = INSIDE_MATCH_PARTS.map((p) => ({
    id: p.id,
    ok: answers[p.id] === p.functionId,
  }))
  const allCorrect = allFilled && results.every((r) => r.ok)

  useEffect(() => {
    if (allCorrect) onPassed(true)
  }, [allCorrect, onPassed])

  const setAnswer = (partId: string, functionId: string) => {
    setAnswers((prev) => ({ ...prev, [partId]: functionId }))
    setChecked(false)
    if (passed) onPassed(false)
  }

  return (
    <div className="match-quiz">
      <p className="match-quiz-lead">Match each component to its function</p>
      <div className="match-quiz-rows">
        {INSIDE_MATCH_PARTS.map((part) => {
          const result = results.find((r) => r.id === part.id)
          const show = checked || passed
          const tone = !show || !answers[part.id] ? '' : result?.ok ? ' correct' : ' wrong'
          return (
            <div key={part.id} className={`match-quiz-row${tone}`}>
              <button
                type="button"
                className="match-part-btn"
                onClick={() => onPick(`${unit}${part.pickSuffix}`)}
                title="Highlight in cabinet"
              >
                {part.label}
              </button>
              <span className="match-arrow" aria-hidden>
                →
              </span>
              <select
                className="match-select"
                value={answers[part.id] ?? ''}
                onChange={(e) => setAnswer(part.id, e.target.value)}
                aria-label={`Function for ${part.label}`}
              >
                <option value="">Select function…</option>
                {options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.text}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>
      <div className="btn-row wrap">
        <button
          type="button"
          className="tool-btn"
          disabled={!allFilled}
          onClick={() => {
            setChecked(true)
            if (allCorrect) onPassed(true)
          }}
        >
          Check matches
        </button>
        {(checked || passed) && (
          <span className={`match-status${allCorrect ? ' ok' : ''}`}>
            {allCorrect ? 'All matched — continue when ready' : 'Some pairs are wrong — try again'}
          </span>
        )}
      </div>
    </div>
  )
}

type LessonId =
  | 'farm'
  | 'inside'
  | 'heat'
  | 'raman'
  | 'twin'
  | 'predict'

type Props = {
  active: ActiveTwinState | null
  scenario: TwinScenario | null
  scenarioId: string
  onScenario: (id: string) => void
  progress: number
  onProgress: (p: number) => void
  playing: boolean
  onPlaying: (v: boolean) => void
  selectedName: string | null
  activeUnit: string
  onPick: (name: string) => void
  onInspect: (unitId?: string) => void
  onOverview: () => void
  onNav: (preset: CameraPreset) => void
  doorMode: 'auto' | 'open' | 'closed'
  onDoorMode: (m: 'auto' | 'open' | 'closed') => void
  onExplode: () => void
  onResetInverter: () => void
  onRamanPulse: (v: boolean) => void
  ramanPulse: boolean
  onModePrediction: () => void
  fibreOverlay: boolean
  onFibreOverlay: (v: boolean) => void
  tempOverlay: boolean
  onTempOverlay: (v: boolean) => void
  onSkipTutorial: () => void
}

type Beat = {
  title: string
  narrative: string
  ask?: string
  cue: string
  run: (ctx: LessonCtx) => void
}

type LessonCtx = {
  unit: string
  onPick: (name: string) => void
  onInspect: (unitId?: string) => void
  onOverview: () => void
  onNav: (preset: CameraPreset) => void
  onDoorMode: (m: 'auto' | 'open' | 'closed') => void
  onExplode: () => void
  onResetInverter: () => void
  onScenario: (id: string) => void
  onProgress: (p: number) => void
  onPlaying: (v: boolean) => void
  onRamanPulse: (v: boolean) => void
  onFibreOverlay: (v: boolean) => void
  onTempOverlay: (v: boolean) => void
  onModePrediction: () => void
}

const LESSON_META: {
  id: LessonId
  label: string
  short: string
}[] = [
  { id: 'farm', label: 'Solar Farm', short: 'How electricity flows' },
  { id: 'inside', label: 'Inside the Inverter', short: 'What’s inside' },
  { id: 'heat', label: 'Heat Generation', short: 'Why faults happen' },
  { id: 'raman', label: 'Raman Sensing', short: 'Stokes, anti-Stokes & location' },
  { id: 'twin', label: 'Digital Twin', short: 'What the dashboard shows' },
  { id: 'predict', label: 'Predictive Maintenance', short: 'Would you keep running?' },
]

function beatsFor(lesson: LessonId): Beat[] {
  if (lesson === 'farm') {
    return [
      {
        title: 'Mission briefing',
        narrative:
          'A solar farm has suddenly reported a fault. Your job is to investigate why — starting from the site, then into one inverter.',
        ask: 'Where does the electricity begin?',
        cue: 'Look over the whole farm.',
        run: (c) => {
          c.onOverview()
          c.onPlaying(false)
          c.onProgress(0)
        },
      },
      {
        title: 'Photovoltaic modules',
        narrative:
          'Sunlight produces DC electricity in the photovoltaic modules. That DC power is the starting point of this investigation.',
        cue: 'Highlight the solar array.',
        run: (c) => {
          c.onOverview()
          c.onPick('SolarPanelsCAD')
        },
      },
      {
        title: 'Path to the inverter',
        narrative:
          'The electricity travels along cables and trenches toward the string inverter. Follow that path in your mind — DC in, AC out.',
        cue: 'Focus one string inverter.',
        run: (c) => {
          c.onInspect(c.unit)
          c.onNav('front')
          c.onDoorMode('closed')
          c.onPick(c.unit)
        },
      },
      {
        title: 'Enter the cabinet',
        narrative:
          'Only now do we go inside. The fault will make sense once you understand what each part does under normal power conversion.',
        cue: 'Open the selected inverter.',
        run: (c) => {
          c.onInspect(c.unit)
          c.onDoorMode('open')
          c.onNav('interior')
          c.onPick(c.unit)
        },
      },
    ]
  }

  if (lesson === 'inside') {
    return [
      {
        title: 'Electricity enters here',
        narrative:
          'DC from the array arrives at the cabinet. Operators can isolate the strings here before working inside.',
        cue: 'Open the door and look at the DC side.',
        run: (c) => {
          c.onInspect(c.unit)
          c.onDoorMode('open')
          c.onNav('interior')
          c.onPick(`${c.unit}_DCDisconnect`)
        },
      },
      {
        title: 'MPPT tracks maximum power',
        narrative:
          'Power from a panel is P = V × I. On the I–V curve there is one Maximum Power Point (Vmp, Imp). MPPT continually adjusts the load so the string operates near that point as sunlight changes.',
        cue: 'Highlight the MPPT section and study the I–V curve.',
        run: (c) => {
          c.onDoorMode('open')
          c.onPick(`${c.unit}_MPPTSection`)
        },
      },
      {
        title: 'IGBTs create AC',
        narrative:
          'The IGBT modules rapidly switch the DC power to generate AC. That switching is where electrical stress — and heat — begins.',
        cue: 'Highlight an IGBT module.',
        run: (c) => {
          c.onDoorMode('open')
          c.onPick(`${c.unit}_IGBT_02`)
          c.onTempOverlay(true)
        },
      },
      {
        title: 'Heat sink removes heat',
        narrative:
          'Switching generates heat. The heat sink removes this heat before temperatures become dangerous — but only if the thermal interface stays healthy.',
        cue: 'Highlight the heat sink.',
        run: (c) => c.onPick(`${c.unit}_HeatSink`),
      },
      {
        title: 'Fan, busbars, capacitors',
        narrative:
          'The cooling fan moves air across the sink. Busbars carry high current. Capacitors store energy on the DC link. Each part exists because of a job in the conversion chain.',
        cue: 'Walk the remaining parts, then take the match quiz.',
        run: (c) => {
          c.onPick(`${c.unit}_CoolingFan_01`)
        },
      },
      {
        title: 'Match each job',
        narrative:
          'Before we look at faults, lock in why each part exists. Match the function to the component — click a name to highlight it in the cabinet.',
        ask: 'Can you pair every component with its job?',
        cue: 'Fill each dropdown, then check your matches.',
        run: (c) => {
          c.onDoorMode('open')
          c.onNav('interior')
          c.onPick(c.unit)
        },
      },
    ]
  }

  if (lesson === 'heat') {
    return [
      {
        title: 'What if cooling weakens?',
        narrative:
          'Ask yourself: what happens if the heat sink becomes less effective — for example when the thermal interface degrades?',
        ask: 'Where would heat build up first?',
        cue: 'Load the TIM degradation scenario at a healthy start.',
        run: (c) => {
          c.onScenario('tim')
          c.onProgress(0.05)
          c.onPlaying(false)
          c.onDoorMode('open')
          c.onInspect(c.unit)
          c.onPick(`${c.unit}_IGBT_02`)
          c.onTempOverlay(true)
        },
      },
      {
        title: 'Hotspot appears',
        narrative:
          'As the interface degrades, heat no longer leaves the IGBT efficiently. A local hotspot forms and temperature climbs.',
        cue: 'Advance fault development to ~50%.',
        run: (c) => {
          c.onScenario('tim')
          c.onProgress(0.5)
          c.onPick(`${c.unit}_IGBT_02`)
          c.onTempOverlay(true)
        },
      },
      {
        title: 'How would we detect this?',
        narrative:
          'Before a hard failure, operators need a way to see local heat along a path — not just one sensor reading. That is why Raman DTS fibre is installed.',
        ask: 'How would we detect this before failure?',
        cue: 'Highlight the Raman fibre.',
        run: (c) => {
          c.onProgress(0.55)
          c.onPick(`${c.unit}_RamanFibre`)
          c.onFibreOverlay(true)
        },
      },
    ]
  }

  if (lesson === 'raman') {
    return [
      {
        title: 'Stokes and anti-Stokes',
        narrative:
          'A laser pulse travels down the fibre. Tiny amounts of light scatter back in two colours: Stokes (slightly redder — the light lost a little energy) and anti-Stokes (slightly bluer — the light gained energy from heat in the glass). Hotter glass means more anti-Stokes. Comparing the two tells us temperature.',
        ask: 'Which return grows more when the fibre heats up?',
        cue: 'Watch the orange Stokes and purple anti-Stokes returns on the fibre.',
        run: (c) => {
          c.onDoorMode('open')
          c.onPick(`${c.unit}_RamanFibre`)
          c.onFibreOverlay(true)
          c.onRamanPulse(true)
          c.onNav('interior')
        },
      },
      {
        title: 'Spatial localisation',
        narrative:
          'We also know where each reading came from. Light takes time to go out and come back. A longer delay means a farther point along the fibre. That is spatial localisation: the same fibre becomes a continuous line of temperature sensors, not one spot measurement.',
        ask: 'What does a longer return delay mean?',
        cue: 'Follow the pulse out, then the returns — delay maps to distance.',
        run: (c) => {
          c.onRamanPulse(true)
          c.onPick(`${c.unit}_RamanFibre`)
          c.onFibreOverlay(true)
        },
      },
      {
        title: 'Why this matters',
        narrative:
          'Point sensors only report one place. Raman DTS gives temperature and position along the whole path, so a hot IGBT shows up as a hotspot at a known distance — early warning before a hard failure. Location from delay; temperature from the anti-Stokes / Stokes balance.',
        cue: 'Confirm the hotspot distance and temperature on the fibre and board.',
        run: (c) => {
          c.onRamanPulse(true)
          c.onProgress(0.6)
          c.onPick(`${c.unit}_RamanFibre`)
          c.onFibreOverlay(true)
        },
      },
    ]
  }

  if (lesson === 'twin') {
    return [
      {
        title: 'The dashboard is a visualisation',
        narrative:
          'The digital twin dashboard is not measuring anything directly. It visualises processed information coming from external analytics (for example MATLAB) and Raman DTS.',
        cue: 'Stay on the active inverter overview.',
        run: (c) => {
          c.onInspect(c.unit)
          c.onDoorMode('open')
          c.onPick(c.unit)
          c.onTempOverlay(true)
          c.onFibreOverlay(true)
        },
      },
      {
        title: 'Temperature → Health',
        narrative:
          'Temperature evidence feeds a health score. Health is a simplified condition indicator supplied by the analytics system — not invented in the viewer.',
        cue: 'Watch health while the fault sits mid-progress.',
        run: (c) => {
          c.onProgress(0.55)
          c.onPick(c.unit)
        },
      },
      {
        title: 'Health → Prediction → Maintenance',
        narrative:
          'From health and trends, prediction and maintenance recommendations appear. You are seeing an operator workflow: observe, interpret, decide.',
        cue: 'Prepare for the prediction lesson.',
        run: (c) => {
          c.onProgress(0.7)
          c.onPick(`${c.unit}_IGBT_02`)
        },
      },
    ]
  }

  // predict
  return [
    {
      title: 'Forecast the fault',
      narrative:
        'Move through the prediction horizon. The hotspot grows, health decreases, and ML confidence rises — using externally supplied forecast frames, labelled as predicted, not measured.',
      cue: 'Start prediction playback.',
      run: (c) => {
        c.onScenario('tim')
        c.onModePrediction()
        c.onProgress(0.2)
        c.onPlaying(true)
        c.onInspect(c.unit)
        c.onNav('interior')
        c.onDoorMode('open')
        c.onPick(`${c.unit}_IGBT_02`)
        c.onTempOverlay(true)
      },
    },
    {
      title: 'Would you keep operating?',
      narrative:
        'Look at remaining useful life and the recommended action. As an engineer on shift, would you continue operating this inverter?',
      ask: 'Would you continue operating this inverter?',
      cue: 'Advance toward a severe forecast.',
      run: (c) => {
        c.onPlaying(false)
        c.onProgress(0.85)
        c.onInspect(c.unit)
        c.onNav('interior')
        c.onPick(`${c.unit}_IGBT_02`)
      },
    },
    {
      title: 'Investigation complete',
      narrative:
        'You traced power from the array, into switching heat, through fibre sensing, into twin visualisation and a maintenance decision. That chain is the point of the digital twin.',
      cue: 'Review the recommendation, then skip to Expert Mode if you need full SCADA controls.',
      run: (c) => {
        c.onProgress(1)
        c.onPlaying(false)
        c.onInspect(c.unit)
        c.onNav('front')
        c.onPick(c.unit)
      },
    },
  ]
}

export default function LearningDashboard(props: Props) {
  const {
    active,
    scenario,
    scenarioId,
    onScenario,
    progress,
    onProgress,
    playing,
    onPlaying,
    activeUnit,
    onPick,
    onInspect,
    onOverview,
    onNav,
    onDoorMode,
    onExplode,
    onResetInverter,
    onRamanPulse,
    ramanPulse,
    onModePrediction,
    fibreOverlay,
    onFibreOverlay,
    tempOverlay,
    onTempOverlay,
    onSkipTutorial,
  } = props

  const [lessonIndex, setLessonIndex] = useState(0)
  const [beatIndex, setBeatIndex] = useState(0)
  const [maxUnlocked, setMaxUnlocked] = useState(0)
  const [decision, setDecision] = useState<'run' | 'stop' | null>(null)
  const [insideQuizPassed, setInsideQuizPassed] = useState(false)
  const [investigationComplete, setInvestigationComplete] = useState(false)
  const [trophyCeremony, setTrophyCeremony] = useState(false)
  const [trophyPinned, setTrophyPinned] = useState(false)

  const lessonId = LESSON_META[lessonIndex].id
  const beats = beatsFor(lessonId)
  const beat = beats[Math.min(beatIndex, beats.length - 1)]
  const unit = active ? sceneUnitId(active.inverter_id) : activeUnit
  const healthBand = active ? maintenanceBand(active.health) : null
  const scenarioLesson = SCENARIO_LESSONS[scenarioId] ?? SCENARIO_LESSONS.tim
  const onInsideQuiz = lessonId === 'inside' && beatIndex === beats.length - 1
  const quizBlocksContinue = onInsideQuiz && !insideQuizPassed

  const ctx: LessonCtx = {
    unit,
    onPick,
    onInspect,
    onOverview,
    onNav,
    onDoorMode,
    onExplode,
    onResetInverter,
    onScenario,
    onProgress,
    onPlaying,
    onRamanPulse,
    onFibreOverlay,
    onTempOverlay,
    onModePrediction,
  }

  // Apply beat scene cues when lesson/beat changes
  useEffect(() => {
    beat.run(ctx)
    if (!(lessonId === 'inside' && beatIndex === beats.length - 1)) {
      setInsideQuizPassed(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonIndex, beatIndex])

  const restart = () => {
    setLessonIndex(0)
    setBeatIndex(0)
    setMaxUnlocked(0)
    setDecision(null)
    setInsideQuizPassed(false)
    setInvestigationComplete(false)
    setTrophyCeremony(false)
    setTrophyPinned(false)
    onProgress(0)
    onPlaying(false)
    onRamanPulse(false)
    onOverview()
  }

  const nextBeat = () => {
    if (quizBlocksContinue) return
    if (beatIndex < beats.length - 1) {
      setBeatIndex((b) => b + 1)
      return
    }
    // complete lesson → unlock next
    const nextLesson = Math.min(lessonIndex + 1, LESSON_META.length - 1)
    setMaxUnlocked((m) => Math.max(m, nextLesson))
    if (lessonIndex < LESSON_META.length - 1) {
      setLessonIndex(nextLesson)
      setBeatIndex(0)
      return
    }
    // Final lesson finished
    setMaxUnlocked(LESSON_META.length)
    setInvestigationComplete(true)
    setTrophyCeremony(true)
    onPlaying(false)
    onRamanPulse(false)
  }

  const prevBeat = () => {
    if (beatIndex > 0) {
      setBeatIndex((b) => b - 1)
      return
    }
    if (lessonIndex > 0) {
      const prev = lessonIndex - 1
      setLessonIndex(prev)
      setBeatIndex(beatsFor(LESSON_META[prev].id).length - 1)
    }
  }

  const goLesson = (i: number) => {
    if (i > maxUnlocked) return
    setLessonIndex(i)
    setBeatIndex(0)
  }

  return (
    <>
    <TrophyCeremony
      open={trophyCeremony}
      onNext={() => {
        setTrophyCeremony(false)
        setTrophyPinned(true)
      }}
    />
    <InvestigationAward visible={trophyPinned} />
    {lessonId === 'raman' && !investigationComplete && (
      <RamanFibreDetailPopup
        beatIndex={beatIndex}
        ramanPulse={ramanPulse}
        hotspotDistanceM={active?.hotspot_position ?? null}
        maxTempC={active?.max_temperature ?? null}
      />
    )}
    <aside className="side-panel scada-panel learning-panel lesson-flow investigation">
      <div className="scada-header lesson-header">
        <div className="learn-top-row">
          <div>
            <h2>Investigation</h2>
            <p className="hint tight">Virtual laboratory — find the fault</p>
          </div>
          <button type="button" className="tool-btn skip-btn" onClick={onSkipTutorial}>
            Skip Tutorial
          </button>
        </div>

        <nav className="lesson-checklist" aria-label="Lesson progress">
          {LESSON_META.map((L, i) => {
            const done =
              investigationComplete ||
              i < lessonIndex ||
              (i === lessonIndex && beatIndex >= beats.length - 1 && i < maxUnlocked)
            const current = !investigationComplete && i === lessonIndex
            const locked = !investigationComplete && i > maxUnlocked
            return (
              <button
                key={L.id}
                type="button"
                className={`checklist-item${current ? ' current' : ''}${done ? ' done' : ''}${locked ? ' locked' : ''}`}
                disabled={locked}
                onClick={() => goLesson(i)}
              >
                <span className="check-mark" aria-hidden>
                  {done && !current ? '✓' : current ? '►' : '□'}
                </span>
                <span className="check-text">
                  <strong>{L.label}</strong>
                  <em>{L.short}</em>
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="lesson-scroll">
        <div className="lesson-body">
          {investigationComplete ? (
            <InvestigationComplete onRestart={restart} onExpert={onSkipTutorial} />
          ) : (
            <>
          <p className="mission-tag">
            Beat {beatIndex + 1} / {beats.length} · Lesson {lessonIndex + 1} / {LESSON_META.length}
          </p>
          <h3 className="learn-title">{beat.title}</h3>
          <div className="lesson-focus-card tall narrative-card">
            <p className="narrative">{beat.narrative}</p>
            {beat.ask && <p className="ask">{beat.ask}</p>}
            <p className="cue">
              <strong>Do now:</strong> {beat.cue}
            </p>
          </div>

          {lessonId === 'inside' && beat.title.startsWith('MPPT') && (
            <figure className="learn-figure">
              <img
                src="/images/mppt-iv-curve.png"
                alt="Solar panel I–V curve showing Isc, Voc, and the Maximum Power Point (Vmp, Imp)"
              />
              <figcaption>
                Sample I–V curve: the load should sit near Imp / Vmp so power is maximised.
                <a
                  href="https://www.spiritenergy.co.uk/kb-solar-mppt"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Source: Spirit Energy — What is MPPT?
                </a>
              </figcaption>
            </figure>
          )}

          {lessonId === 'heat' && (
            <div className="investigation-tools">
              <label className="slider-label">
                Fault Development · {faultDevelopmentLabel(progress)}
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(progress * 100)}
                onChange={(e) => {
                  onPlaying(false)
                  onProgress(Number(e.target.value) / 100)
                  onScenario('tim')
                }}
                className="fault-slider"
              />
              <p className="learn-dynamic">{faultDevelopmentExplain(progress, 'tim')}</p>
              <p className="hint tight">{scenarioLesson.what_watch}</p>
            </div>
          )}

          {lessonId === 'raman' && (
            <div className="investigation-tools raman-lesson-tools">
              <RamanArchitectureBoard
                beatIndex={beatIndex}
                hotspotDistanceM={active?.hotspot_position ?? null}
                maxTempC={active?.max_temperature ?? null}
              />
              <div className="btn-row wrap">
                <button
                  type="button"
                  className={`tool-btn${ramanPulse ? ' active' : ''}`}
                  onClick={() => onRamanPulse(!ramanPulse)}
                >
                  {ramanPulse ? 'Pause Pulse' : 'Play Laser Pulse'}
                </button>
                <button
                  type="button"
                  className={`tool-btn${fibreOverlay ? ' active' : ''}`}
                  onClick={() => onFibreOverlay(!fibreOverlay)}
                >
                  Fibre Overlay
                </button>
              </div>
              {active && <FibreGraph state={active} kind="dts" />}
            </div>
          )}

          {lessonId === 'twin' && active && (
            <div className="investigation-tools twin-chain">
              <div className="chain-step">
                <span>Temperature</span>
                <strong>{active.temperature.toFixed(1)} °C</strong>
              </div>
              <div className="chain-arrow">↓</div>
              <div className="chain-step">
                <span>Health</span>
                <strong className={`status ${healthTone(active.health)}`}>
                  {active.health}% · {healthBand?.label}
                </strong>
              </div>
              <div className="chain-arrow">↓</div>
              <div className="chain-step">
                <span>Prediction</span>
                <strong>{active.ml_fault_class}</strong>
              </div>
              <div className="chain-arrow">↓</div>
              <div className="chain-step">
                <span>Maintenance</span>
                <strong>{active.maintenance_priority}</strong>
              </div>
              <div className="btn-row wrap" style={{ marginTop: '0.45rem' }}>
                <button
                  type="button"
                  className={`tool-btn${tempOverlay ? ' active' : ''}`}
                  onClick={() => onTempOverlay(!tempOverlay)}
                >
                  Thermal Overlay
                </button>
                <button
                  type="button"
                  className={`tool-btn${fibreOverlay ? ' active' : ''}`}
                  onClick={() => onFibreOverlay(!fibreOverlay)}
                >
                  Fibre Overlay
                </button>
              </div>
            </div>
          )}

          {lessonId === 'predict' && active && (
            <div className="investigation-tools">
              <p className="pred">Predicted, not measured</p>
              <div className="compact-block">
                <div className="kv-row">
                  <span>Horizon</span>
                  <strong>{active.prediction_horizon}</strong>
                </div>
                <div className="kv-row">
                  <span>Health</span>
                  <strong className={`status ${healthTone(active.health)}`}>{active.health}%</strong>
                </div>
                <div className="kv-row">
                  <span>ML confidence</span>
                  <strong>{Math.round(active.ml_confidence * 100)}%</strong>
                </div>
                <div className="kv-row">
                  <span>RUL</span>
                  <strong>{formatRul(active.remaining_useful_life)}</strong>
                </div>
                <div className="kv-row">
                  <span>Recommendation</span>
                  <strong>{active.recommended_action}</strong>
                </div>
              </div>
              <label className="slider-label">Forecast scrub · {Math.round(progress * 100)}%</label>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(progress * 100)}
                onChange={(e) => {
                  onPlaying(false)
                  onModePrediction()
                  onProgress(Number(e.target.value) / 100)
                }}
                className="fault-slider"
              />
              <div className="btn-row wrap">
                <button
                  type="button"
                  className={`tool-btn${playing ? ' active' : ''}`}
                  onClick={() => {
                    onModePrediction()
                    onPlaying(!playing)
                  }}
                >
                  {playing ? 'Pause Forecast' : 'Play Forecast'}
                </button>
              </div>
              {beat.ask && (
                <div className="decision-row">
                  <p className="ask">{beat.ask}</p>
                  <button
                    type="button"
                    className={`tool-btn${decision === 'run' ? ' active' : ''}`}
                    onClick={() => setDecision('run')}
                  >
                    Continue operating
                  </button>
                  <button
                    type="button"
                    className={`tool-btn${decision === 'stop' ? ' active' : ''}`}
                    onClick={() => setDecision('stop')}
                  >
                    Stop / maintain
                  </button>
                  {decision === 'run' && (
                    <p className="hint">Risky — RUL and confidence suggest planning maintenance soon.</p>
                  )}
                  {decision === 'stop' && (
                    <p className="hint">Sound engineering judgment for a severe TIM forecast.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {onInsideQuiz && (
            <ComponentMatchQuiz
              unit={unit}
              onPick={onPick}
              passed={insideQuizPassed}
              onPassed={setInsideQuizPassed}
            />
          )}

          <p className="hint tight">
            Active: {active?.inverter_id ?? unit} · {scenario?.fault_type ?? '—'}
          </p>
            </>
          )}
        </div>
      </div>

      <div className="lesson-footer">
        <button type="button" className="tool-btn" disabled={investigationComplete || (lessonIndex === 0 && beatIndex === 0)} onClick={prevBeat}>
          ← Back
        </button>
        <button type="button" className="tool-btn" onClick={restart}>
          Restart
        </button>
        <button
          type="button"
          className="tool-btn primary learn-primary"
          onClick={nextBeat}
          disabled={investigationComplete || quizBlocksContinue}
          title={quizBlocksContinue ? 'Match all components correctly first' : undefined}
        >
          {quizBlocksContinue
            ? 'Complete quiz to continue'
            : beatIndex < beats.length - 1
              ? 'Continue →'
              : lessonIndex < LESSON_META.length - 1
                ? 'Complete lesson →'
                : 'Finish investigation'}
        </button>
      </div>
    </aside>
    </>
  )
}
