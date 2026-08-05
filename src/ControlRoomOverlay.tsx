import { Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_URL = '/models/this_is_fine/this_is_fine.glb'

export const THIS_IS_FINE_CREDIT = {
  title: 'This is fine',
  url: 'https://skfb.ly/oxuOB',
  author: 'miguiASV',
  license: 'Creative Commons Attribution',
  licenseUrl: 'http://creativecommons.org/licenses/by/4.0/',
}

const DIALOGUE = [
  {
    id: 'ok',
    prompt: 'Is everything ok?',
    reply: 'This is fine.',
  },
  {
    id: 'what',
    prompt: 'What happened to the control room?',
    reply: 'Solar farm big fire. Big burn. Big money lost.',
  },
] as const

type DialogueId = (typeof DIALOGUE)[number]['id']

type Props = {
  open: boolean
  onClose: () => void
  /** Fired when the room ejects you for staying too long (~10s). */
  onKickOut?: () => void
}

function FineScene() {
  const gltf = useGLTF(MODEL_URL)

  const prepared = useMemo(() => {
    const scene = gltf.scene.clone(true)
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    const s = 4.2 / maxDim
    scene.position.set(-center.x * s, -box.min.y * s, -center.z * s)
    scene.scale.setScalar(s)
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
    })
    return scene
  }, [gltf.scene])

  return <primitive object={prepared} />
}

function RoomLights() {
  return (
    <>
      <ambientLight intensity={0.35} color="#ffc9a0" />
      <directionalLight position={[2.5, 4.5, 1.5]} intensity={1.35} color="#fff0d8" castShadow />
      <pointLight position={[-0.8, 2.2, 0.4]} intensity={2.4} color="#ff6a2a" distance={8} decay={1.4} />
      <pointLight position={[1.4, 1.6, -1.2]} intensity={0.7} color="#ffb070" distance={7} />
      <hemisphereLight args={['#ffd8b0', '#3a1808', 0.45]} />
    </>
  )
}

export default function ControlRoomOverlay({ open, onClose, onKickOut }: Props) {
  const [entered, setEntered] = useState(false)
  const [activeId, setActiveId] = useState<DialogueId | null>(null)

  useEffect(() => {
    if (!open) {
      setEntered(false)
      setActiveId(null)
      return
    }
    setEntered(false)
    setActiveId(null)
    const t = window.setTimeout(() => setEntered(true), 900)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const kick = window.setTimeout(() => {
      onKickOut?.()
    }, 10_000)
    return () => window.clearTimeout(kick)
  }, [open, onKickOut])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const active = DIALOGUE.find((d) => d.id === activeId) ?? null

  if (!open) return null

  return (
    <div className="control-room-overlay" role="dialog" aria-label="Entering control room">
      <div className="control-room-viewport">
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [0.15, 1.35, 2.85], fov: 68, near: 0.05, far: 60 }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={['#1a0c08']} />
          <fog attach="fog" args={['#1a0c08', 4.5, 14]} />
          <RoomLights />
          <Suspense fallback={null}>
            <FineScene />
          </Suspense>
          <OrbitControls
            enablePan={false}
            enableDamping
            dampingFactor={0.06}
            rotateSpeed={0.55}
            minDistance={1.1}
            maxDistance={4.2}
            minPolarAngle={0.55}
            maxPolarAngle={1.45}
            target={[0, 0.85, 0]}
          />
        </Canvas>
      </div>

      <div className="control-room-vignette" aria-hidden />

      <div className={`control-room-enter ${entered ? 'is-faded' : ''}`}>
        <p>Entering control room…</p>
      </div>

      <button type="button" className="control-room-exit" onClick={onClose}>
        Exit
      </button>

      {entered && (
        <div className="control-room-dialogue" aria-live="polite">
          <div className="control-room-speech">
            <span className="control-room-speaker">Dog</span>
            <p key={active?.id ?? 'idle'}>
              {active ? active.reply : '…'}
            </p>
          </div>

          <div className="control-room-choices" role="group" aria-label="Dialogue options">
            {DIALOGUE.map((line, i) => (
              <button
                key={line.id}
                type="button"
                className={`control-room-choice ${activeId === line.id ? 'is-active' : ''}`}
                onClick={() => setActiveId(line.id)}
              >
                <span className="control-room-choice-n">{i + 1}</span>
                {line.prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <footer className="control-room-credit">
        <a href={THIS_IS_FINE_CREDIT.url} target="_blank" rel="noopener noreferrer">
          {THIS_IS_FINE_CREDIT.title}
        </a>{' '}
        by {THIS_IS_FINE_CREDIT.author} ·{' '}
        <a href={THIS_IS_FINE_CREDIT.licenseUrl} target="_blank" rel="noopener noreferrer">
          {THIS_IS_FINE_CREDIT.license}
        </a>
      </footer>
    </div>
  )
}

useGLTF.preload(MODEL_URL)
