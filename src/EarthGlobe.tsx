import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

type Props = {
  visible?: boolean
  highlightDemand?: boolean
  /** Raise + simplify for phone portrait intro framing. */
  phoneLite?: boolean
}

/**
 * Sketchfab Earth — "Earth" by Akshat (CC BY 4.0)
 * https://skfb.ly/6TwGG
 */
export default function EarthGlobe({
  visible = true,
  highlightDemand = false,
  phoneLite = false,
}: Props) {
  const gltf = useGLTF('/models/earth/earth.glb?v=akshat')
  const spin = useRef<THREE.Group>(null)

  const prepared = useMemo(() => {
    const scene = gltf.scene.clone(true)

    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = false
      mesh.receiveShadow = false
      mesh.frustumCulled = true
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const mat of mats) {
        const m = mat as THREE.MeshStandardMaterial
        if (!m) continue
        m.metalness = 0
        m.roughness = phoneLite ? 0.7 : 0.55
        if (phoneLite) {
          m.envMapIntensity = 0
          m.flatShading = false
        }
        m.needsUpdate = true
      }
    })

    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    const scale = phoneLite ? 8.2 / maxDim : 10 / maxDim
    scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale)
    scene.scale.setScalar(scale)

    return scene
  }, [gltf.scene, phoneLite])

  useFrame((_, dt) => {
    if (!spin.current || !visible) return
    // Slower spin on phone to cut transform churn
    spin.current.rotation.y += dt * (phoneLite ? 0.035 : 0.07)
  })

  if (!visible) return null

  return (
    <group position={phoneLite ? [0, 1.35, 0] : [0, 0, 0]}>
      <group ref={spin} rotation={[0.15, 0.9, 0]}>
        <primitive object={prepared} />
      </group>
      <ambientLight intensity={phoneLite ? 0.55 : 0.45} />
      <directionalLight
        position={[8, 4, 6]}
        intensity={phoneLite ? 2.1 : 2.6}
        color="#fff4e0"
      />
      {!phoneLite && (
        <directionalLight position={[-6, -2, -4]} intensity={0.45} color="#6a9ad4" />
      )}
      {highlightDemand && !phoneLite && (
        <pointLight position={[4, 2, 5]} intensity={3.2} color="#ffb070" distance={18} />
      )}
      {highlightDemand && phoneLite && (
        <directionalLight position={[4, 2, 5]} intensity={1.2} color="#ffb070" />
      )}
    </group>
  )
}

useGLTF.preload('/models/earth/earth.glb?v=akshat')
