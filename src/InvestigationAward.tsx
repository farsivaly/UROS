import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { TROPHY_CREDIT, TrophyModel } from './TrophyModel'

type Props = {
  visible: boolean
}

/** Persistent small trophy — top-left after dismissing the ceremony. */
export default function InvestigationAward({ visible }: Props) {
  if (!visible) return null

  return (
    <div className="invest-award" title="Investigation complete">
      <div className="invest-award-stage" aria-hidden>
        <Canvas
          camera={{ position: [0, 1.2, 3.4], fov: 34, near: 0.05, far: 20 }}
          gl={{ antialias: true, alpha: true, toneMappingExposure: 1.5 }}
        >
          <color attach="background" args={['#f5d45c']} />
          <ambientLight intensity={1.3} color="#fff6d6" />
          <directionalLight position={[2, 4, 2]} intensity={2.8} color="#ffffff" />
          <directionalLight position={[-2, 1, -1]} intensity={1.1} color="#ffe08a" />
          <Suspense fallback={null}>
            <TrophyModel height={1.35} spin={0.55} />
          </Suspense>
        </Canvas>
      </div>
      <div className="invest-award-copy">
        <strong>Investigator</strong>
        <span>
          <a href={TROPHY_CREDIT.url} target="_blank" rel="noopener noreferrer">
            {TROPHY_CREDIT.title}
          </a>{' '}
          · {TROPHY_CREDIT.author}
        </span>
      </div>
    </div>
  )
}
