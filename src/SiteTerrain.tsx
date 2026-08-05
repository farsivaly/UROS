import { useMemo } from 'react'
import * as THREE from 'three'

type Props = {
  map: THREE.Texture
  roughnessMap: THREE.Texture
  normalMap: THREE.Texture
}

/** Soft field undulation (~0.15–0.45 m) over large wavelengths */
function displacePlane(geo: THREE.PlaneGeometry) {
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const h =
      Math.sin(x * 0.055) * Math.cos(y * 0.042) * 0.28 +
      Math.sin(x * 0.11 + 1.4) * Math.cos(y * 0.09) * 0.16 +
      Math.sin(x * 0.025 + y * 0.032) * 0.12 +
      Math.sin(x * 0.2 + y * 0.16) * 0.055
    pos.setZ(i, h)
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
}

/**
 * Replaces the flat GLB ground with an uneven sparse-grass field.
 */
export default function SiteTerrain({ map, roughnessMap, normalMap }: Props) {
  const { geo, mat } = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(130, 110, 112, 88)
    displacePlane(geometry)
    const material = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      map,
      roughnessMap,
      normalMap,
      roughness: 1,
      metalness: 0,
      envMapIntensity: 0.1,
      normalScale: new THREE.Vector2(0.9, 0.9),
    })
    return { geo: geometry, mat: material }
  }, [map, roughnessMap, normalMap])

  return (
    <mesh
      name="Ground"
      geometry={geo}
      material={mat}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.02, 0]}
      receiveShadow
    />
  )
}
