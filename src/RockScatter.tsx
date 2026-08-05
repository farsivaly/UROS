import { useMemo } from 'react'
import * as THREE from 'three'
import { configureMap } from './textures'
import { PANEL_ORIGIN_X, ROW_LENGTH, ROW_ZS } from './SolarArray'

type Props = {
  map: THREE.Texture
  roughnessMap: THREE.Texture
  normalMap: THREE.Texture
}

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

type RockSpec = {
  position: [number, number, number]
  scale: [number, number, number]
  rotation: [number, number, number]
}

/**
 * Sparse dark rocks on the field — kept clear of panel racks and main pads.
 */
export default function RockScatter({ map, roughnessMap, normalMap }: Props) {
  const { mat, rocks } = useMemo(() => {
    configureMap(map, 1, 1, true)
    configureMap(roughnessMap, 1, 1, false)
    configureMap(normalMap, 1, 1, false)

    const material = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      map,
      roughnessMap,
      normalMap,
      roughness: 1,
      metalness: 0.05,
      envMapIntensity: 0.15,
      normalScale: new THREE.Vector2(1.2, 1.2),
    })

    const rnd = seeded(44)
    const arrayMinX = PANEL_ORIGIN_X - 1.5
    const arrayMaxX = PANEL_ORIGIN_X + ROW_LENGTH + 1.5
    const arrayMinZ = ROW_ZS[ROW_ZS.length - 1] - 2
    const arrayMaxZ = ROW_ZS[0] + 2

    const inArray = (x: number, z: number) =>
      x > arrayMinX && x < arrayMaxX && z > arrayMinZ && z < arrayMaxZ

    const inCompound = (x: number, z: number) =>
      x > -32 && x < -18 && Math.abs(z - (ROW_ZS[0] + ROW_ZS[ROW_ZS.length - 1]) / 2) < 8

    const list: RockSpec[] = []
    let attempts = 0
    while (list.length < 55 && attempts < 400) {
      attempts++
      const x = (rnd() - 0.5) * 85
      const z = (rnd() - 0.5) * 70
      if (inArray(x, z) || inCompound(x, z)) continue
      // Prefer clusters near field edges / roads
      const s = 0.18 + rnd() * 0.55
      list.push({
        position: [x, 0.02 + rnd() * 0.04, z],
        scale: [s, s * (0.45 + rnd() * 0.35), s * (0.7 + rnd() * 0.4)],
        rotation: [rnd() * 0.8, rnd() * Math.PI * 2, rnd() * 0.6],
      })
    }

    // A few larger landmark rocks
    for (let i = 0; i < 6; i++) {
      const x = (rnd() - 0.5) * 70
      const z = (rnd() - 0.5) * 55
      if (inArray(x, z) || inCompound(x, z)) continue
      const s = 0.55 + rnd() * 0.45
      list.push({
        position: [x, 0.05, z],
        scale: [s, s * 0.5, s * 0.85],
        rotation: [rnd() * 0.5, rnd() * Math.PI, rnd() * 0.4],
      })
    }

    return { mat: material, rocks: list }
  }, [map, roughnessMap, normalMap])

  return (
    <group name="RockScatter">
      {rocks.map((r, i) => (
        <mesh
          key={i}
          position={r.position}
          scale={r.scale}
          rotation={r.rotation}
          castShadow
          receiveShadow
          material={mat}
        >
          <dodecahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
    </group>
  )
}
