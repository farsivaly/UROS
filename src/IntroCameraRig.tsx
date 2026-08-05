import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import type { IntroSceneCue } from './introContent'

/** Positions the camera for each intro beat. */
export default function IntroCameraRig({ cue }: { cue: IntroSceneCue }) {
  const { camera, controls } = useThree()

  useEffect(() => {
    const ctrl = controls as unknown as {
      target: { set: (x: number, y: number, z: number) => void }
      update?: () => void
    } | null

    if (cue === 'space' || cue === 'space-demand') {
      camera.position.set(0.6, 0.35, 7.4)
      camera.near = 0.1
      camera.far = 500
      camera.updateProjectionMatrix()
      ctrl?.target.set(0, 0, 0)
      ctrl?.update?.()
      return
    }

    if (cue === 'farm-overview') {
      camera.position.set(45, 38, 55)
      ctrl?.target.set(0, 1, 0)
      ctrl?.update?.()
      return
    }

    // Later cues are driven by App focusTarget / cameraPreset on the farm scene
  }, [camera, controls, cue])

  return null
}
