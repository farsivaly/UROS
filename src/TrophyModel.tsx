import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export const TROPHY_URL = '/models/world_cup_trophy/world_cup_trophy.glb'

export const TROPHY_CREDIT = {
  title: 'World cup trophy',
  url: 'https://skfb.ly/oD99x',
  author: 'Pixel Swan',
  license: 'Creative Commons Attribution',
  licenseUrl: 'http://creativecommons.org/licenses/by/4.0/',
}

type TrophyModelProps = {
  /** Target height in world units after normalization. */
  height?: number
  spin?: number
}

/** Normalized, optionally spinning World Cup trophy mesh. */
export function TrophyModel({ height = 2.4, spin = 0.35 }: TrophyModelProps) {
  const gltf = useGLTF(TROPHY_URL)
  const root = useRef<THREE.Group>(null)

  const prepared = useMemo(() => {
    const scene = gltf.scene.clone(true)
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const s = height / (size.y || 1)
    scene.position.set(-center.x * s, -box.min.y * s, -center.z * s)
    scene.scale.setScalar(s)
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const mat of mats) {
        const m = mat as THREE.MeshStandardMaterial
        if (!m || typeof m !== 'object') continue
        if ('color' in m && m.color) m.color.offsetHSL(0.02, 0.08, 0.12)
        if ('metalness' in m && typeof m.metalness === 'number') m.metalness = Math.min(0.85, m.metalness)
        if ('roughness' in m && typeof m.roughness === 'number') m.roughness = Math.max(0.28, m.roughness * 0.85)
        if ('emissive' in m && m.emissive) {
          m.emissive.set('#6a4a10')
          m.emissiveIntensity = 0.22
        }
        m.needsUpdate = true
      }
    })
    return scene
  }, [gltf.scene, height])

  useFrame((_, dt) => {
    if (root.current && spin) root.current.rotation.y += dt * spin
  })

  return (
    <group ref={root}>
      <primitive object={prepared} />
    </group>
  )
}

useGLTF.preload(TROPHY_URL)
