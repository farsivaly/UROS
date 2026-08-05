import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

type Props = {
  visible?: boolean
  highlightDemand?: boolean
}

/**
 * Sketchfab Earth — "Earth" by Akshat (CC BY 4.0)
 * https://skfb.ly/6TwGG
 */
export default function EarthGlobe({ visible = true, highlightDemand = false }: Props) {
  const gltf = useGLTF('/models/earth/earth.glb?v=akshat')
  const spin = useRef<THREE.Group>(null)

  const prepared = useMemo(() => {
    const scene = gltf.scene.clone(true)

    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = false
      mesh.receiveShadow = false
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const mat of mats) {
        const m = mat as THREE.MeshStandardMaterial
        if (!m) continue
        m.metalness = 0
        m.roughness = 0.55
        m.needsUpdate = true
      }
    })

    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    scene.position.set(-center.x * (10 / maxDim), -center.y * (10 / maxDim), -center.z * (10 / maxDim))
    scene.scale.setScalar(10 / maxDim)

    return scene
  }, [gltf.scene])

  useFrame((_, dt) => {
    if (!spin.current || !visible) return
    spin.current.rotation.y += dt * 0.07
  })

  if (!visible) return null

  return (
    <group>
      <group ref={spin} rotation={[0.15, 0.9, 0]}>
        <primitive object={prepared} />
      </group>
      <ambientLight intensity={0.45} />
      <directionalLight position={[8, 4, 6]} intensity={2.6} color="#fff4e0" />
      <directionalLight position={[-6, -2, -4]} intensity={0.45} color="#6a9ad4" />
      {highlightDemand && (
        <pointLight position={[4, 2, 5]} intensity={3.2} color="#ffb070" distance={18} />
      )}
    </group>
  )
}

useGLTF.preload('/models/earth/earth.glb?v=akshat')
