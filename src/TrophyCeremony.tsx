import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { ACESFilmicToneMapping } from 'three'
import { TROPHY_CREDIT, TrophyModel } from './TrophyModel'

type Props = {
  open: boolean
  onNext: () => void
}

export default function TrophyCeremony({ open, onNext }: Props) {
  if (!open) return null

  return (
    <div className="trophy-ceremony" role="dialog" aria-label="Investigation trophy">
      <div className="trophy-ceremony-stage">
        <Canvas
          camera={{ position: [0, 1.85, 6.4], fov: 40, near: 0.05, far: 50 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.55 }}
        >
          <color attach="background" args={['#f5d45c']} />
          <ambientLight intensity={1.35} color="#fff6d6" />
          <hemisphereLight args={['#fff8e8', '#d4a020', 0.85]} />
          <directionalLight position={[3, 6, 2]} intensity={3.2} color="#ffffff" />
          <directionalLight position={[-3.5, 3, -1.5]} intensity={1.6} color="#ffe08a" />
          <directionalLight position={[0, 2, 4]} intensity={1.4} color="#fff4cc" />
          <pointLight position={[0.4, 2.2, 1.2]} intensity={2.2} color="#ffd978" distance={10} />
          <Suspense fallback={null}>
            <TrophyModel height={2.05} spin={0.4} />
            <ContactShadows position={[0, 0.01, 0]} opacity={0.22} scale={10} blur={2.8} far={5} color="#8a6500" />
          </Suspense>
        </Canvas>
      </div>

      <div className="trophy-ceremony-vignette" aria-hidden />

      <div className="trophy-ceremony-copy">
        <p className="trophy-ceremony-kicker">Investigation complete</p>
        <h2>You earned the trophy</h2>
        <p>Traced the fault from array to decision. Claim your award.</p>
        <button type="button" className="tool-btn primary learn-primary" onClick={onNext}>
          Next
        </button>
      </div>

      <footer className="trophy-ceremony-credit">
        <a href={TROPHY_CREDIT.url} target="_blank" rel="noopener noreferrer">
          {TROPHY_CREDIT.title}
        </a>{' '}
        by {TROPHY_CREDIT.author} ·{' '}
        <a href={TROPHY_CREDIT.licenseUrl} target="_blank" rel="noopener noreferrer">
          {TROPHY_CREDIT.license}
        </a>
      </footer>
    </div>
  )
}
