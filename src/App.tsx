import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Component,
  type ReactNode,
} from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls, Sky } from '@react-three/drei'
import { ACESFilmicToneMapping } from 'three'
import FarmScene, { type CameraPreset } from './FarmScene'
import ScadaDashboard from './ScadaDashboard'
import LearningDashboard from './LearningDashboard'
import StatusBar from './StatusBar'
import { activeInverterId } from './digitalTwinData'
import IntroOverlay from './IntroOverlay'
import EarthGlobe from './EarthGlobe'
import IntroCameraRig from './IntroCameraRig'
import ControlRoomOverlay from './ControlRoomOverlay'
import BurnCursor from './BurnCursor'
import TrophyCeremony from './TrophyCeremony'
import RamanFibreDetailPopup from './RamanFibreDetailPopup'
import { INTRO_STEPS, type IntroSceneCue } from './introContent'
import ViewportHud from './ViewportHud'
import usePhoneProfile from './usePhoneProfile'
import type { LabelMode } from './ComponentLabels'
import {
  DEFAULT_TWIN_URL,
  SCENARIO_CATALOG,
  activeStateToSnapshot,
  alarmsFromFrame,
  buildActiveState,
  createFileTransport,
  createUrlTransport,
  loadScenario,
  resolveFrame,
  sceneUnitId,
  type ConnectionStatus,
  type GraphKind,
  type TwinAlarm,
  type TwinMode,
  type TwinScenario,
  type TwinSnapshot,
  type TwinTransport,
} from './digitalTwin'

const CLICK_DRAG_PX = 5

type ViewMode = 'overview' | 'inverter'
type DoorMode = 'auto' | 'open' | 'closed'
type ExperienceMode = 'learning' | 'expert'

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
  state = { error: null as string | null }

  static getDerivedStateFromError(error: Error) {
    return { error: error.message }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="loading">
          Failed to load scene: {this.state.error}
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [focusTarget, setFocusTarget] = useState<string | null>('Ground')
  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('overview')
  const [doorMode, setDoorMode] = useState<DoorMode>('auto')
  const [exploded, setExploded] = useState(false)
  const [xray, setXray] = useState(false)
  const pointerDown = useRef({ x: 0, y: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [baseTwin, setBaseTwin] = useState<TwinSnapshot | null>(null)
  const [connection, setConnection] = useState<ConnectionStatus>('disconnected')
  const [transport, setTransport] = useState<TwinTransport>(() =>
    createUrlTransport(DEFAULT_TWIN_URL),
  )
  const [lastError, setLastError] = useState<string | null>(null)
  const [tempOverlay, setTempOverlay] = useState(true)
  const [fibreOverlay, setFibreOverlay] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [componentLabels, setComponentLabels] = useState(false)
  const [labelMode, setLabelMode] = useState<LabelMode>('temp')
  const [thermalFixed, setThermalFixed] = useState(true)

  const [mode, setMode] = useState<TwinMode>('fault')
  const [scenarioId, setScenarioId] = useState('tim')
  const [scenario, setScenario] = useState<TwinScenario | null>(null)
  const [progress, setProgress] = useState(0.5)
  const [playing, setPlaying] = useState(false)
  const [playSpeed, setPlaySpeed] = useState(1)
  const [graphKind, setGraphKind] = useState<GraphKind>('dts')
  const [alarms, setAlarms] = useState<TwinAlarm[]>([])
  const [ramanPulse, setRamanPulse] = useState(false)
  const [packets, setPackets] = useState({ received: 0, rejected: 0 })
  const [panelOpen, setPanelOpen] = useState(true)
  const [experience, setExperience] = useState<ExperienceMode>('learning')
  const [showIntro, setShowIntro] = useState(true)
  const [introStep, setIntroStep] = useState(0)
  const [cursorOnFire, setCursorOnFire] = useState(false)
  const [previewTrophy, setPreviewTrophy] = useState(false)
  const phone = usePhoneProfile()

  const activeUnit = activeInverterId(selectedName)
  const introCue: IntroSceneCue = INTRO_STEPS[Math.min(introStep, INTRO_STEPS.length - 1)].scene
  const introSpace = showIntro && (introCue === 'space' || introCue === 'space-demand')
  const showFarm = !introSpace
  const controlRoomOpen =
    !showIntro &&
    !!selectedName &&
    (selectedName === 'ControlRoom' || selectedName.startsWith('ControlRoom'))

  useEffect(() => {
    if (!cursorOnFire) return
    const t = window.setTimeout(() => setCursorOnFire(false), 5_000)
    return () => window.clearTimeout(t)
  }, [cursorOnFire])

  const finishIntro = (mode: ExperienceMode) => {
    setShowIntro(false)
    setExperience(mode)
    setPanelOpen(true)
    setComponentLabels(false)
    if (mode === 'learning') {
      setLabelMode('temp')
    } else {
      setLabelMode('names')
    }
  }

  const { frame, isPredicted } = useMemo(() => {
    if (!scenario) return { frame: null, isPredicted: false }
    return resolveFrame(scenario, progress, mode)
  }, [scenario, progress, mode])

  const active = useMemo(() => {
    if (!scenario || !frame) return null
    return buildActiveState({
      scenario,
      frame,
      mode,
      connectionStatus: connLabel(connection),
      isPredicted,
    })
  }, [scenario, frame, mode, connection, isPredicted])

  const twin = useMemo(() => {
    if (!active || !scenario) return baseTwin
    return activeStateToSnapshot(baseTwin, active, scenario.fibre_length_m ?? 12.4)
  }, [baseTwin, active, scenario])

  useEffect(() => {
    if (!scenario || !frame) return
    const next = alarmsFromFrame(scenario, frame)
    setAlarms((prev) => {
      const acked = new Set(prev.filter((a) => a.acknowledged).map((a) => a.alarm_id))
      return next.map((a) => ({ ...a, acknowledged: acked.has(a.alarm_id) }))
    })
  }, [scenario, frame])

  const refreshBase = useCallback(async (t: TwinTransport = transport) => {
    setConnection('loading')
    setLastError(null)
    try {
      const snap = await t.load()
      setBaseTwin(snap)
      setTransport(t)
      setConnection('connected')
      setPackets((p) => ({ ...p, received: p.received + 1 }))
    } catch (err) {
      setConnection('error')
      setPackets((p) => ({ ...p, rejected: p.rejected + 1 }))
      setLastError(err instanceof Error ? err.message : String(err))
    }
  }, [transport])

  const applyScenario = useCallback(async (id: string) => {
    const entry = SCENARIO_CATALOG.find((s) => s.id === id) ?? SCENARIO_CATALOG[1]
    setScenarioId(entry.id)
    setConnection('loading')
    try {
      const sc = await loadScenario(entry.url)
      setScenario(sc)
      setProgress(mode === 'prediction' ? 0 : 0.35)
      setPlaying(false)
      setConnection('connected')
      setPackets((p) => ({ ...p, received: p.received + 1 }))
      const unit = sceneUnitId(sc.inverter_id)
      setSelectedName(unit)
    } catch (err) {
      setConnection('error')
      setPackets((p) => ({ ...p, rejected: p.rejected + 1 }))
      setLastError(err instanceof Error ? err.message : String(err))
    }
  }, [mode])

  useEffect(() => {
    void refreshBase(createUrlTransport(DEFAULT_TWIN_URL))
    void applyScenario('tim')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Timeline playback
  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setProgress((p) => {
        const next = p + dt * 0.08 * playSpeed
        if (next >= 1) {
          if (mode === 'replay' || mode === 'fault' || mode === 'prediction') {
            return 0
          }
          setPlaying(false)
          return 1
        }
        return next
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, playSpeed, mode])

  // Simulated live tick when mode === live
  useEffect(() => {
    if (mode !== 'live') return
    const id = window.setInterval(() => {
      setProgress((p) => (p >= 1 ? 0 : p + 0.02))
      setPackets((pk) => ({ ...pk, received: pk.received + 1 }))
    }, 1000)
    return () => clearInterval(id)
  }, [mode])

  useEffect(() => {
    if (mode === 'raman') setRamanPulse(true)
    else setRamanPulse(false)
  }, [mode])

  useEffect(() => {
    if (mode === 'prediction') setProgress(0)
  }, [mode])

  // Intro guided scene cues
  useEffect(() => {
    if (!showIntro) return
    const cue = INTRO_STEPS[Math.min(introStep, INTRO_STEPS.length - 1)].scene
    const unit = scenario ? sceneUnitId(scenario.inverter_id) : 'StringInverter_01'

    if (cue === 'space' || cue === 'space-demand') {
      setViewMode('overview')
      setFocusTarget(null)
      setDoorMode('closed')
      setExploded(false)
      setTempOverlay(false)
      setFibreOverlay(false)
      setComponentLabels(false)
      setShowLabels(false)
      setRamanPulse(false)
      return
    }

    if (cue === 'farm-overview') {
      goOverview()
      setShowLabels(true)
      return
    }

    if (cue === 'inverter-highlight') {
      setSelectedName(unit)
      setFocusTarget(unit)
      setViewMode('inverter')
      setCameraPreset('front')
      setDoorMode('closed')
      setComponentLabels(false)
      return
    }

    if (cue === 'inverter-interior' || cue === 'tim-hotspot' || cue === 'point-sensors') {
      setSelectedName(`${unit}_IGBT_02`)
      setFocusTarget(unit)
      setViewMode('inverter')
      setCameraPreset('interior')
      setDoorMode('open')
      setTempOverlay(true)
      setFibreOverlay(false)
      setRamanPulse(false)
      setComponentLabels(cue === 'tim-hotspot' || cue === 'point-sensors')
      setLabelMode('temp')
      setProgress(cue === 'point-sensors' ? 0.7 : 0.55)
      return
    }

    if (cue === 'raman-fibre') {
      setSelectedName(`${unit}_RamanFibre`)
      setFocusTarget(unit)
      setViewMode('inverter')
      setCameraPreset('interior')
      setDoorMode('open')
      setFibreOverlay(true)
      setTempOverlay(true)
      setRamanPulse(true)
      setComponentLabels(true)
      return
    }

    if (cue === 'twin-ready') {
      setSelectedName(unit)
      setFocusTarget(unit)
      setViewMode('inverter')
      setCameraPreset('front')
      setDoorMode('open')
      setTempOverlay(true)
      setFibreOverlay(true)
      setComponentLabels(true)
      setLabelMode('temp')
      setRamanPulse(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showIntro, introStep, scenario])

  const unitFromSelection = (name: string | null) => {
    if (!name) return null
    const m = name.match(/^(StringInverter_\d{2})/)
    return m ? m[1] : null
  }

  const clearSelectionIfClick = (e: { clientX?: number; clientY?: number }) => {
    const x = e.clientX ?? 0
    const y = e.clientY ?? 0
    const dx = x - pointerDown.current.x
    const dy = y - pointerDown.current.y
    if (dx * dx + dy * dy <= CLICK_DRAG_PX * CLICK_DRAG_PX) {
      setSelectedName(null)
    }
  }

  const pick = (name: string) => {
    setSelectedName(name)
    const unit = unitFromSelection(name)
    if (unit) {
      setViewMode('inverter')
      // Frame the cabinet enclosure; keep selection on the clicked part
      setFocusTarget(unit)
      const isUnitRoot = /^StringInverter_\d{2}$/.test(name)
      setCameraPreset(isUnitRoot ? 'front' : 'interior')
      if (!isUnitRoot) setDoorMode('open')
    } else if (name.startsWith('Inverter') || name.startsWith('ACCombiner')) {
      setFocusTarget(name)
      setCameraPreset('focus')
      setViewMode('inverter')
    } else {
      setFocusTarget(name)
      setCameraPreset('focus')
      setViewMode('overview')
    }
  }

  const goOverview = useCallback(() => {
    setViewMode('overview')
    setFocusTarget('Ground')
    setCameraPreset('overview')
    setDoorMode('auto')
    setExploded(false)
    setXray(false)
    setShowLabels(true)
  }, [])

  const closeControlRoom = useCallback(() => {
    setSelectedName(null)
    goOverview()
  }, [goOverview])

  const kickFromControlRoom = useCallback(() => {
    setSelectedName(null)
    goOverview()
    setCursorOnFire(true)
  }, [goOverview])

  const inspectInverter = (unitId = activeUnit) => {    setSelectedName(unitId)
    setFocusTarget(unitId)
    setViewMode('inverter')
    setCameraPreset('front')
    setDoorMode('open')
  }

  const frameSimInverter = (unitId?: string) => {
    const unit = unitId ?? (scenario ? sceneUnitId(scenario.inverter_id) : activeUnit)
    setSelectedName(unit)
    setFocusTarget(unit)
    setViewMode('inverter')
    setCameraPreset('interior')
    setDoorMode('open')
    setTempOverlay(true)
  }

  const nav = (preset: CameraPreset) => {
    if (preset === 'overview') {
      goOverview()
      return
    }
    if (preset === 'row') {
      setViewMode('inverter')
      setFocusTarget('StringInverterRow')
      setCameraPreset('row')
      return
    }
    setSelectedName(activeUnit)
    setFocusTarget(activeUnit)
    setViewMode('inverter')
    setCameraPreset(preset)
    if (preset === 'interior' || preset === 'front') setDoorMode('open')
  }

  const resetInverter = () => {
    setExploded(false)
    setXray(false)
    setDoorMode('closed')
  }

  const hasInverterContext =
    !!selectedName?.startsWith('StringInverter') || viewMode === 'inverter'

  const onMode = (m: TwinMode) => {
    setMode(m)
    setPlaying(false)
    if (m === 'maintenance') {
      setTempOverlay(true)
      setFibreOverlay(true)
    }
    if (m === 'prediction' || m === 'fault' || m === 'replay') {
      frameSimInverter()
    }
  }

  return (
    <div className={`app${panelOpen && !showIntro ? '' : ' panel-collapsed'}${showIntro ? '' : ' has-status-bar'} experience-${experience}${mode === 'replay' ? ' replay-open' : ''}${showIntro ? ' intro-active' : ''}${introSpace ? ' intro-space' : ''}${phone ? ' phone' : ''}`}>
      {!showIntro && (
      <div className="topbar">
        <div className="brand">
          <strong>UROS</strong>
          <span>Solar Farm Digital Twin — Phase 4</span>
        </div>
        <div className="view-toggles">
          <button type="button" onClick={() => { window.location.hash = '#/' }}>
            Research
          </button>
          <button
            type="button"
            className="active"
            title={experience === 'learning' ? 'Switch to Expert' : 'Switch to Learning'}
            onClick={() => {
              if (experience === 'learning') {
                setExperience('expert')
                setLabelMode('names')
              } else {
                setExperience('learning')
                setLabelMode('temp')
              }
            }}
          >
            {experience === 'learning' ? 'Learning' : 'Expert'}
          </button>
          <button
            className={viewMode === 'overview' ? 'active' : ''}
            onClick={goOverview}
          >
            Overview
          </button>
          <button
            className={viewMode === 'inverter' ? 'active' : ''}
            onClick={() => inspectInverter(scenario ? sceneUnitId(scenario.inverter_id) : 'StringInverter_01')}
          >
            Inverter
          </button>
          <button
            className={panelOpen ? 'active' : ''}
            onClick={() => setPanelOpen((v) => !v)}
            title="Toggle SCADA panel"
          >
            Dashboard
          </button>
          {/* TEMP: remove after trophy QA */}
          <button type="button" onClick={() => setPreviewTrophy(true)} title="Preview trophy screen">
            Trophy
          </button>
        </div>
      </div>
      )}

      <div className="viewport">
        {!showIntro && (
        <ViewportHud
          viewMode={viewMode}
          tempOverlay={tempOverlay}
          onTempOverlay={setTempOverlay}
          fibreOverlay={fibreOverlay}
          onFibreOverlay={setFibreOverlay}
          showLabels={showLabels}
          onShowLabels={setShowLabels}
          componentLabels={componentLabels}
          onComponentLabels={setComponentLabels}
          labelMode={labelMode}
          onLabelMode={setLabelMode}
          doorMode={doorMode}
          onDoorMode={setDoorMode}
          exploded={exploded}
          onExplode={() => {
            setExploded(true)
            setDoorMode('open')
            setCameraPreset('front')
            setFocusTarget(activeUnit)
          }}
          xray={xray}
          onXray={setXray}
          onResetInverter={resetInverter}
        />
        )}
        {showIntro && (
          <IntroOverlay
            stepIndex={introStep}
            onStepIndex={setIntroStep}
            onStartLearning={() => finishIntro('learning')}
            onSkipExpert={() => finishIntro('expert')}
          />
        )}
        {showIntro && introCue === 'raman-fibre' && (
          <RamanFibreDetailPopup
            beatIndex={0}
            ramanPulse={!phone}
            lite={phone}
            className="intro-raman-popup"
          />
        )}
        <ControlRoomOverlay
          open={controlRoomOpen}
          onClose={closeControlRoom}
          onKickOut={kickFromControlRoom}
        />
        <BurnCursor active={cursorOnFire} />
        <TrophyCeremony open={previewTrophy} onNext={() => setPreviewTrophy(false)} />
        <ErrorBoundary>
          <Canvas
            shadows={!phone}
            dpr={phone ? 1 : [1, 1.5]}
            camera={{ position: introSpace ? (phone ? [0.35, 1.85, 8.2] : [0.55, 0.55, 14.2]) : [45, 32, 55], fov: phone && introSpace ? 36 : 40, near: 0.1, far: 500 }}
            gl={{
              antialias: !phone,
              powerPreference: phone ? 'low-power' : 'high-performance',
              toneMapping: ACESFilmicToneMapping,
              toneMappingExposure: introSpace ? 1.15 : 1.12,
            }}
            performance={{ min: phone ? 0.4 : 0.5 }}
            onPointerDown={(e) => {
              pointerDown.current = { x: e.clientX, y: e.clientY }
            }}
            onPointerMissed={showIntro ? undefined : clearSelectionIfClick}
          >
            {introSpace ? (
              <color attach="background" args={['#02060e']} />
            ) : (
              <fog attach="fog" args={['#b9d3e8', phone ? 90 : 110, phone ? 200 : 240]} />
            )}
            {showFarm && !phone && (
              <Sky
                sunPosition={[70, 48, -25]}
                turbidity={3.2}
                rayleigh={0.75}
                mieCoefficient={0.0035}
                mieDirectionalG={0.8}
              />
            )}
            {showFarm && phone && <color attach="background" args={['#b9d3e8']} />}
            {showFarm && (
              <>
                <ambientLight intensity={phone ? 0.45 : 0.32} />
                <hemisphereLight args={['#d4e6ff', '#6a7558', phone ? 0.65 : 0.5]} />
                <directionalLight
                  castShadow={!phone}
                  position={[55, 55, -20]}
                  intensity={phone ? 1.15 : 1.45}
                  color="#fff4e6"
                  shadow-mapSize={phone ? [512, 512] : [2048, 2048]}
                  shadow-bias={-0.0002}
                  shadow-camera-far={160}
                  shadow-camera-left={-70}
                  shadow-camera-right={70}
                  shadow-camera-top={70}
                  shadow-camera-bottom={-70}
                />
                {!phone && (
                  <directionalLight position={[-40, 22, 28]} intensity={0.22} color="#a8c4e0" />
                )}
              </>
            )}
            <Suspense fallback={null}>
              {showIntro && (
                <>
                  <IntroCameraRig cue={introCue} phoneFrame={phone} />
                  <EarthGlobe
                    visible={introSpace}
                    highlightDemand={introCue === 'space-demand'}
                    phoneLite={phone}
                  />
                </>
              )}
              {showFarm && (
                <group>
                  <FarmScene
                    selectedName={selectedName}
                    onSelect={(name) => {
                      if (showIntro) return
                      if (name) pick(name)
                      else setSelectedName(null)
                    }}
                    focusTarget={focusTarget}
                    viewMode={viewMode}
                    cameraPreset={cameraPreset}
                    activeUnitId={activeUnit}
                    doorMode={doorMode}
                    exploded={exploded}
                    xray={xray}
                    twin={twin}
                    tempOverlay={tempOverlay}
                    fibreOverlay={fibreOverlay}
                    showLabels={showLabels && viewMode === 'overview' && !showIntro}
                    componentLabels={componentLabels && !showIntro}
                    labelMode={labelMode}
                    ramanPulse={ramanPulse}
                    focusInverterId={scenario ? sceneUnitId(scenario.inverter_id) : null}
                  />
                  {!phone && (
                    <ContactShadows
                      position={[0, -0.02, 0]}
                      opacity={0.4}
                      scale={120}
                      blur={2.8}
                      far={30}
                    />
                  )}
                </group>
              )}
            </Suspense>
            <OrbitControls
              makeDefault
              enableDamping={!phone}
              maxPolarAngle={introSpace ? Math.PI : Math.PI * 0.49}
              minDistance={introSpace ? (phone ? 6.5 : 11) : 2}
              maxDistance={introSpace ? 40 : 180}
              target={introSpace ? (phone ? [0, 1.35, 0] : [0, 0, 0]) : [0, 1, 0]}
              enabled={!showIntro || introSpace}
            />
          </Canvas>
        </ErrorBoundary>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void refreshBase(createFileTransport(file))
          e.target.value = ''
        }}
      />

      {panelOpen && !showIntro && experience === 'learning' && (
        <LearningDashboard
          active={active}
          scenario={scenario}
          scenarioId={scenarioId}
          onScenario={(id) => void applyScenario(id)}
          progress={progress}
          onProgress={setProgress}
          playing={playing}
          onPlaying={setPlaying}
          selectedName={selectedName}
          activeUnit={activeUnit}
          onPick={pick}
          onInspect={inspectInverter}
          onOverview={goOverview}
          onNav={nav}
          doorMode={doorMode}
          onDoorMode={setDoorMode}
          onExplode={() => {
            setExploded(true)
            setDoorMode('open')
            setCameraPreset('front')
            setFocusTarget(activeUnit)
          }}
          onResetInverter={resetInverter}
          ramanPulse={ramanPulse}
          onRamanPulse={(v) => {
            setMode('raman')
            setRamanPulse(v)
          }}
          onModePrediction={() => {
            setMode('prediction')
            setPlaying(true)
            frameSimInverter()
          }}
          fibreOverlay={fibreOverlay}
          onFibreOverlay={setFibreOverlay}
          tempOverlay={tempOverlay}
          onTempOverlay={setTempOverlay}
          onSkipTutorial={() => {
            setExperience('expert')
            setComponentLabels(false)
            setLabelMode('names')
          }}
        />
      )}

      {panelOpen && !showIntro && experience === 'expert' && (
        <ScadaDashboard
          twin={twin}
          active={active}
          scenario={scenario}
          mode={mode}
          onMode={onMode}
          connection={connection}
          dataLabel={scenario?.simulation_id ?? transport.label}
          lastError={lastError}
          tempOverlay={tempOverlay}
          fibreOverlay={fibreOverlay}
          showLabels={showLabels}
          thermalFixed={thermalFixed}
          onTempOverlay={setTempOverlay}
          onFibreOverlay={setFibreOverlay}
          onShowLabels={setShowLabels}
          onThermalFixed={setThermalFixed}
          graphKind={graphKind}
          onGraphKind={setGraphKind}
          alarms={alarms}
          onAckAlarm={(id) =>
            setAlarms((list) =>
              list.map((a) => (a.alarm_id === id ? { ...a, acknowledged: true } : a)),
            )
          }
          selectedName={selectedName}
          onPick={pick}
          activeUnit={activeUnit}
          hasInverterContext={hasInverterContext}
          doorMode={doorMode}
          exploded={exploded}
          xray={xray}
          onDoorMode={setDoorMode}
          onExplode={() => {
            setExploded(true)
            setDoorMode('open')
            setCameraPreset('front')
            setFocusTarget(activeUnit)
          }}
          onResetInverter={resetInverter}
          onXray={setXray}
          onNav={nav}
          onInspect={inspectInverter}
          onOverview={goOverview}
          onLoadJson={() => fileInputRef.current?.click()}
          onRefresh={() => {
            void refreshBase()
            void applyScenario(scenarioId)
          }}
          onResetView={() => {
            goOverview()
            setSelectedName(null)
            setProgress(0)
            setPlaying(false)
          }}
          progress={progress}
          onProgress={setProgress}
          playing={playing}
          onPlaying={setPlaying}
          playSpeed={playSpeed}
          onPlaySpeed={setPlaySpeed}
          ramanPulse={ramanPulse}
          onRamanPulse={setRamanPulse}
          packets={packets}
          scenarioId={scenarioId}
          onScenario={(id) => void applyScenario(id)}
        />
      )}

      {!showIntro && (
        <StatusBar
          active={active}
          scenario={scenario}
          scenarioId={scenarioId}
          mode={mode}
          connection={connection}
          progress={progress}
          onProgress={setProgress}
          playing={playing}
          onPlaying={setPlaying}
          playSpeed={playSpeed}
          onPlaySpeed={setPlaySpeed}
          selectedName={selectedName}
          packets={packets}
          ramanPulse={ramanPulse}
          experience={experience}
        />
      )}
    </div>
  )
}

function connLabel(s: ConnectionStatus) {
  if (s === 'connected') return 'Connected'
  if (s === 'loading') return 'Loading'
  if (s === 'error') return 'Error'
  return 'Disconnected'
}
