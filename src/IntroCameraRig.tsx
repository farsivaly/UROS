import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import type { IntroSceneCue } from './introContent'

type Props = {
  cue: IntroSceneCue
  /** Lift framing so the globe sits in the clear area above the intro card. */
  phoneFrame?: boolean
}

/** Positions the camera for each intro beat. */
export default function IntroCameraRig({ cue, phoneFrame = false }: Props) {
  const { camera, controls } = useThree()

  useEffect(() => {
    const ctrl = controls as unknown as {
      target: { set: (x: number, y: number, z: number) => void }
      update?: () => void
    } | null

    if (cue === 'space' || cue === 'space-demand') {
      if (phoneFrame) {
        // Compose for portrait: subject in the upper ~55% above the card
        camera.position.set(0.35, 1.85, 8.2)
        ctrl?.target.set(0, 1.35, 0)
      } else {
        // Desktop / laptop: pull back so the full globe reads clearly
        camera.position.set(0.55, 0.5, 11.6)
        ctrl?.target.set(0, 0, 0)
      }
      camera.near = 0.1
      camera.far = 500
      camera.updateProjectionMatrix()
      ctrl?.update?.()
      return
    }

    if (cue === 'farm-overview') {
      if (phoneFrame) {
        camera.position.set(38, 42, 48)
        ctrl?.target.set(0, 4, 0)
      } else {
        camera.position.set(45, 38, 55)
        ctrl?.target.set(0, 1, 0)
      }
      ctrl?.update?.()
      return
    }

    // Later cues are driven by App focusTarget / cameraPreset on the farm scene
  }, [camera, controls, cue, phoneFrame])

  return null
}
