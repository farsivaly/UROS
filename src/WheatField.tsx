import { useMemo } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'

type Props = {
  farmRadius?: number
}

/**
 * Small upright wheat patches scattered across the grass around the farm.
 * GLB is pre-oriented Y-up with ~1m plant height from Blender export.
 */
export default function WheatField({ farmRadius = 36 }: Props) {
  const gltf = useGLTF('/models/wheat.glb?v=2')
  const diffuse = useTexture('/models/wheat_diffuse.jpg')

  const patch = useMemo(() => {
    const root = gltf.scene.clone(true)

    diffuse.colorSpace = THREE.SRGBColorSpace
    diffuse.anisotropy = 8
    diffuse.needsUpdate = true

    const box = new THREE.Box3().setFromObject(root)
    root.position.y -= box.min.y

    // Model is already ~1.15m tall — keep patches modest on the grass
    root.scale.setScalar(0.55)

    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.material = new THREE.MeshStandardMaterial({
        map: diffuse,
        color: '#f2e6b8',
        roughness: 0.9,
        metalness: 0,
        alphaTest: 0.3,
        side: THREE.DoubleSide,
        envMapIntensity: 0.12,
      })
    })

    return root
  }, [diffuse, gltf.scene])

  const instances = useMemo(() => {
    const placements: {
      position: [number, number, number]
      rotation: number
      scale: number
    }[] = []

    const rings = [
      { count: 12, radius: farmRadius * 0.7 },
      { count: 16, radius: farmRadius * 0.92 },
      { count: 18, radius: farmRadius * 1.15 },
      { count: 14, radius: farmRadius * 1.35 },
    ]

    rings.forEach((ring, ri) => {
      for (let i = 0; i < ring.count; i++) {
        const a = (i / ring.count) * Math.PI * 2 + ri * 0.22
        const jitter = (Math.random() - 0.5) * 2.2
        const x = Math.cos(a) * (ring.radius + jitter)
        const z = Math.sin(a) * (ring.radius + jitter)

        if (x > 5 && z > 2 && z < 24) continue
        if (x > -14 && x < 8 && z > -14 && z < 8) continue

        placements.push({
          position: [x, 0, z],
          rotation: Math.random() * Math.PI * 2,
          scale: 0.75 + Math.random() * 0.45,
        })
      }
    })

    return placements
  }, [farmRadius])

  return (
    <group name="WheatFields">
      {instances.map((p, i) => (
        <primitive
          key={i}
          object={patch.clone(true)}
          position={p.position}
          rotation={[0, p.rotation, 0]}
          scale={p.scale}
        />
      ))}
    </group>
  )
}

useGLTF.preload('/models/wheat.glb?v=2')
