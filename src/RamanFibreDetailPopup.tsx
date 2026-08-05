import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

import { LocationFormula, TemperatureFormula } from './ramanFormulas'

const FIBRE_URL = '/models/inverter_parts/glb/optic_fiber.glb'

/** Half-length of the normalised fibre along +X. */
const FIBRE_HALF = 1.15
const FIBRE_LEN = FIBRE_HALF * 2
const HOTSPOT_T = 0.62
const CORE_R = 0.028
const CLAD_R = 0.072

const BEAT_NOTES = [
  'Stokes (orange) lost energy; anti-Stokes (purple) gained energy from heat. More heat → stronger anti-Stokes.',
  'Return delay tells you where along the fibre the light came from — that is spatial localisation.',
  'Together: temperature from the two returns, position from timing. One fibre covers the whole path.',
]

type Props = {
  beatIndex: number
  ramanPulse: boolean
  hotspotDistanceM?: number | null
  maxTempC?: number | null
}

function axisPos(t: number, y = 0, z = 0) {
  return new THREE.Vector3(-FIBRE_HALF + t * FIBRE_LEN, y, z)
}

function FibreInterior({ heat }: { heat: number }) {
  const cladColor = useMemo(() => {
    const c = new THREE.Color()
    c.lerpColors(new THREE.Color('#9eb6cc'), new THREE.Color('#e8a070'), heat)
    return c
  }, [heat])
  const coreColor = useMemo(() => {
    const c = new THREE.Color()
    c.lerpColors(new THREE.Color('#5a9ab8'), new THREE.Color('#d4925a'), heat)
    return c
  }, [heat])

  return (
    <group>
      {/* Cladding — translucent shell so pulses are seen inside */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[CLAD_R, CLAD_R, FIBRE_LEN * 0.98, 28, 1, true]} />
        <meshPhysicalMaterial
          color={cladColor}
          transparent
          opacity={0.22}
          roughness={0.15}
          metalness={0.05}
          transmission={0.55}
          thickness={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Core guideline — centred in cladding, low opacity */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[CORE_R, CORE_R, FIBRE_LEN * 0.98, 20]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={0.12 + heat * 0.2}
          transparent
          opacity={0.28}
          roughness={0.35}
          metalness={0.04}
          depthWrite={false}
        />
      </mesh>
      {/* End caps: cladding ring with core dead-centre */}
      {([-FIBRE_HALF + 0.02, FIBRE_HALF - 0.02] as const).map((x) => (
        <group key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh>
            <ringGeometry args={[CORE_R * 1.08, CLAD_R, 32]} />
            <meshStandardMaterial
              color={cladColor}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <mesh>
            <circleGeometry args={[CORE_R, 24]} />
            <meshStandardMaterial
              color={coreColor}
              emissive={coreColor}
              emissiveIntensity={0.25}
              transparent
              opacity={0.32}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function FibreCadModel({ pulse, beatIndex }: { pulse: boolean; beatIndex: number }) {
  const gltf = useGLTF(FIBRE_URL)
  const pumpRef = useRef<THREE.Mesh>(null)
  const stokesRef = useRef<THREE.Mesh>(null)
  const antiRef = useRef<THREE.Mesh>(null)
  const phase = useRef(0)

  const heat = beatIndex >= 2 ? 0.95 : beatIndex >= 1 ? 0.55 : 0.3

  const { model, hotMat } = useMemo(() => {
    const scene = gltf.scene.clone(true)
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    scene.position.sub(center)
    scene.rotation.y = Math.PI / 2
    scene.updateMatrixWorld(true)

    const box2 = new THREE.Box3().setFromObject(scene)
    box2.getSize(size)
    box2.getCenter(center)
    const sx = (FIBRE_HALF * 2) / (size.x || 1)
    scene.position.x -= center.x * sx
    scene.position.y -= center.y * sx
    scene.position.z -= center.z * sx
    scene.scale.setScalar(sx)

    let hot: THREE.MeshStandardMaterial | null = null
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const mat of mats) {
        const m = mat as THREE.MeshStandardMaterial
        if (!m?.isMeshStandardMaterial) continue
        m.metalness = 0.12
        m.roughness = 0.4
        m.transparent = true
        m.opacity = 0.38
        m.depthWrite = false
        m.color.set('#6a9cc8')
        m.emissive.set('#1a3048')
        m.emissiveIntensity = 0.12
        m.needsUpdate = true
        hot = m
      }
    })

    return { model: scene, hotMat: hot as THREE.MeshStandardMaterial | null }
  }, [gltf.scene])

  useFrame((_, dt) => {
    if (hotMat) {
      hotMat.color.lerpColors(new THREE.Color('#5b8fb8'), new THREE.Color('#e07a3a'), heat)
      hotMat.emissive.lerpColors(new THREE.Color('#152436'), new THREE.Color('#c44a28'), heat)
      hotMat.emissiveIntensity = 0.15 + heat * 0.7
      hotMat.opacity = 0.32 + heat * 0.12
    }

    const pump = pumpRef.current
    const stokes = stokesRef.current
    const anti = antiRef.current
    if (!pump || !stokes || !anti) return

    if (!pulse) {
      pump.visible = stokes.visible = anti.visible = false
      phase.current = 0
      return
    }

    // 0–0.38 pump in core → 0.38–0.48 scatter into cladding → 0.48–1.0 returns in core
    phase.current = (phase.current + dt * 0.26) % 1
    const p = phase.current

    if (p < 0.38) {
      const t = p / 0.38
      pump.visible = true
      stokes.visible = false
      anti.visible = false
      pump.position.copy(axisPos(t))
      pump.scale.setScalar(1)
      const pm = pump.material as THREE.MeshStandardMaterial
      pm.emissiveIntensity = 1.7 + Math.sin(t * Math.PI) * 0.5
    } else if (p < 0.48) {
      // Pulse expands from core into cladding at the hotspot (scatter)
      const u = (p - 0.38) / 0.1
      const radial = CORE_R + u * (CLAD_R - CORE_R) * 0.85
      pump.visible = true
      stokes.visible = u > 0.35
      anti.visible = u > 0.35
      pump.position.copy(axisPos(HOTSPOT_T))
      pump.scale.setScalar(1 + u * 0.8)
      stokes.position.copy(axisPos(HOTSPOT_T, radial * 0.55, 0))
      anti.position.copy(axisPos(HOTSPOT_T, -radial * 0.55, 0))
      stokes.scale.setScalar(0.7 + u * 0.4)
      anti.scale.setScalar(0.7 + u * 0.4)
    } else {
      // Stokes + anti-Stokes re-enter the core and travel back inside the cladding
      const u = (p - 0.48) / 0.52
      const t = HOTSPOT_T * (1 - u)
      // Brief radial settle from cladding → core, then stay on axis
      const settle = Math.max(0, 1 - u * 4)
      const r = settle * CLAD_R * 0.35
      pump.visible = false
      stokes.visible = true
      anti.visible = true
      stokes.position.copy(axisPos(t, r, 0.01))
      anti.position.copy(axisPos(t, -r, -0.01))
      stokes.scale.setScalar(1)
      anti.scale.setScalar(1)
      const sm = stokes.material as THREE.MeshStandardMaterial
      const am = anti.material as THREE.MeshStandardMaterial
      sm.emissiveIntensity = 1.6 + u * 0.7
      am.emissiveIntensity = 1.8 + u * 0.8
    }
  })

  return (
    <group>
      <primitive object={model} />
      <FibreInterior heat={heat} />

      <mesh ref={pumpRef} visible={false}>
        <sphereGeometry args={[0.042, 16, 12]} />
        <meshStandardMaterial
          color="#7ec8ff"
          emissive="#3aa0ff"
          emissiveIntensity={2}
          transparent
          opacity={0.95}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={stokesRef} visible={false}>
        <sphereGeometry args={[0.036, 16, 12]} />
        <meshStandardMaterial
          color="#ff8a4a"
          emissive="#e25a20"
          emissiveIntensity={2}
          transparent
          opacity={0.95}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={antiRef} visible={false}>
        <sphereGeometry args={[0.036, 16, 12]} />
        <meshStandardMaterial
          color="#c56bff"
          emissive="#9b2dff"
          emissiveIntensity={2}
          transparent
          opacity={0.95}
          depthWrite={false}
        />
      </mesh>

      <mesh position={axisPos(HOTSPOT_T).toArray()} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[CLAD_R * 1.15, 0.012, 10, 28]} />
        <meshBasicMaterial color="#e2a34a" transparent opacity={0.65} />
      </mesh>
    </group>
  )
}

function PulseLegend() {
  return (
    <div className="fibre-pulse-legend" aria-hidden>
      <span>
        <i className="swatch pump" /> Pump in core
      </span>
      <span>
        <i className="swatch stokes" /> Stokes return
      </span>
      <span>
        <i className="swatch antistokes" /> Anti-Stokes return
      </span>
    </div>
  )
}

function LayerCallouts() {
  return (
    <div className="fibre-detail-layers" aria-hidden>
      <div className="fibre-layer">
        <span className="fibre-swatch core" />
        <div>
          <strong>Core</strong>
          <em>Guided light path</em>
        </div>
      </div>
      <div className="fibre-layer">
        <span className="fibre-swatch cladding" />
        <div>
          <strong>Cladding</strong>
          <em>Confines the mode</em>
        </div>
      </div>
      <div className="fibre-layer">
        <span className="fibre-swatch jacket" />
        <div>
          <strong>Jacket / braid</strong>
          <em>Protection & routing</em>
        </div>
      </div>
    </div>
  )
}

export default function RamanFibreDetailPopup({
  beatIndex,
  ramanPulse,
  hotspotDistanceM,
  maxTempC,
}: Props) {
  const note = BEAT_NOTES[Math.min(beatIndex, BEAT_NOTES.length - 1)]

  return (
    <div className="fibre-detail-popup" role="dialog" aria-label="Raman fibre detail view">
      <header className="fibre-detail-head">
        <div>
          <p className="fibre-detail-kicker">Expanded detail</p>
          <h3>Raman sensing fibre</h3>
        </div>
        <span className="fibre-detail-badge">{ramanPulse ? 'Pulse live' : 'Static view'}</span>
      </header>

      <div className="fibre-detail-stage">
        <Canvas
          camera={{ position: [0.15, 0.85, 2.35], fov: 36, near: 0.01, far: 40 }}
          gl={{ antialias: true, alpha: true }}
        >
          <color attach="background" args={['#0a1018']} />
          <ambientLight intensity={0.55} />
          <directionalLight position={[3, 4, 2]} intensity={1.7} color="#fff4e8" />
          <directionalLight position={[-2, 1, -2]} intensity={0.4} color="#6a9ad4" />
          <Suspense fallback={null}>
            <FibreCadModel pulse={ramanPulse} beatIndex={beatIndex} />
            <ContactShadows position={[0, -0.45, 0]} opacity={0.35} scale={6} blur={2.5} far={4} />
          </Suspense>
          <OrbitControls
            enablePan={false}
            enableDamping
            autoRotate={false}
            minDistance={1.4}
            maxDistance={4.5}
            target={[0, 0, 0]}
          />
        </Canvas>
      </div>

      <PulseLegend />
      <LayerCallouts />

      <p className="fibre-detail-note">{note}</p>
      <div className="fibre-detail-formulas">
        <LocationFormula compact />
        <TemperatureFormula compact />
      </div>

      {(hotspotDistanceM != null || maxTempC != null) && (
        <div className="fibre-detail-stats">
          {hotspotDistanceM != null && (
            <div>
              <span>Hotspot distance</span>
              <strong>{hotspotDistanceM.toFixed(2)} m</strong>
            </div>
          )}
          {maxTempC != null && (
            <div>
              <span>Max fibre</span>
              <strong>{maxTempC.toFixed(1)} °C</strong>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

useGLTF.preload(FIBRE_URL)
