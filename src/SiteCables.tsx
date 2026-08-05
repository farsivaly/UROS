import { useMemo } from 'react'
import * as THREE from 'three'
import { configureMap } from './textures'
import {
  getStringInverterPositions,
  INVERTER_ROW_COUNT,
  ROW_ZS,
  TRENCH_X1,
} from './SolarArray'

type CableMaps = {
  map: THREE.Texture
  roughnessMap: THREE.Texture
  normalMap: THREE.Texture
  metalnessMap: THREE.Texture
}

type BoxMaps = {
  map: THREE.Texture
  roughnessMap: THREE.Texture
  normalMap: THREE.Texture
}

type Props = {
  cable: CableMaps
  box: BoxMaps
}

function tube(
  points: THREE.Vector3[],
  radius: number,
  mat: THREE.Material,
  name: string,
  tubular = 48,
) {
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      tubular,
      radius,
      8,
      false,
    ),
    mat,
  )
  mesh.name = name
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/**
 * Site cabling using Poly Haven modular electric cables:
 * row feeders → collector along trench → AC export toward transformer pad,
 * plus junction boxes at row / combiner nodes.
 */
export default function SiteCables({ cable, box }: Props) {
  const root = useMemo(() => {
    configureMap(cable.map, 4, 1, true)
    configureMap(cable.roughnessMap, 4, 1, false)
    configureMap(cable.normalMap, 4, 1, false)
    configureMap(cable.metalnessMap, 4, 1, false)
    configureMap(box.map, 1, 1, true)
    configureMap(box.roughnessMap, 1, 1, false)
    configureMap(box.normalMap, 1, 1, false)

    const cableMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      map: cable.map,
      roughnessMap: cable.roughnessMap,
      normalMap: cable.normalMap,
      metalnessMap: cable.metalnessMap,
      roughness: 1,
      metalness: 0.35,
      envMapIntensity: 0.2,
      normalScale: new THREE.Vector2(0.85, 0.85),
    })

    const boxMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      map: box.map,
      roughnessMap: box.roughnessMap,
      normalMap: box.normalMap,
      roughness: 1,
      metalness: 0.12,
      envMapIntensity: 0.25,
      normalScale: new THREE.Vector2(1, 1),
    })

    const group = new THREE.Group()
    group.name = 'SiteCables'

    const invPos = getStringInverterPositions()
    const midZ = (ROW_ZS[0] + ROW_ZS[INVERTER_ROW_COUNT - 1]) / 2
    const y = 0.055
    const collectorX = TRENCH_X1 - 0.15

    // Row feeders: inverter pad → trench collector
    invPos.forEach((pos, i) => {
      const [ix, , iz] = pos
      const id = String(i + 1).padStart(2, '0')
      group.add(
        tube(
          [
            new THREE.Vector3(ix + 0.55, 0.12, iz + 0.18),
            new THREE.Vector3(ix + 0.9, y + 0.04, iz + 0.22),
            new THREE.Vector3((ix + collectorX) * 0.5, y, iz + 0.08),
            new THREE.Vector3(collectorX, y, iz),
          ],
          0.032,
          cableMat,
          `CableTrench_Feeder_${id}`,
          32,
        ),
      )

      // Junction box at trench node
      const jb = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.28), boxMat)
      jb.position.set(collectorX, 0.1, iz)
      jb.castShadow = true
      jb.receiveShadow = true
      jb.name = `CableTrench_JB_${id}`
      group.add(jb)
    })

    // Collector spine along trench (links row feeders)
    const spinePts = ROW_ZS.slice(0, INVERTER_ROW_COUNT).map(
      (z) => new THREE.Vector3(collectorX, y, z),
    )
    group.add(
      tube(spinePts, 0.045, cableMat, 'CableTrench_Collector', 64),
    )

    // Drop into AC combiner
    group.add(
      tube(
        [
          new THREE.Vector3(collectorX, y, midZ),
          new THREE.Vector3(collectorX - 0.15, 0.2, midZ),
          new THREE.Vector3(collectorX - 0.28, 0.55, midZ),
          new THREE.Vector3(collectorX - 0.32, 0.85, midZ),
        ],
        0.038,
        cableMat,
        'CableTrench_ACDrop',
        24,
      ),
    )

    // AC export toward transformer pad (east)
    group.add(
      tube(
        [
          new THREE.Vector3(collectorX - 0.2, y, midZ + 0.35),
          new THREE.Vector3(8, y, midZ + 1.2),
          new THREE.Vector3(12, y, 12),
          new THREE.Vector3(14.5, y + 0.02, 13.5),
          new THREE.Vector3(15.4, 0.25, 14),
        ],
        0.05,
        cableMat,
        'CableTrench_ACExport',
        72,
      ),
    )

    // Combiner / export junction boxes
    ;[
      [collectorX - 0.05, midZ + 0.4] as const,
      [12.2, 12.1] as const,
      [15.1, 13.8] as const,
    ].forEach(([x, z], i) => {
      const jb = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.32), boxMat)
      jb.position.set(x, 0.11, z)
      jb.castShadow = true
      jb.receiveShadow = true
      jb.name = `CableTrench_JB_Main_${i + 1}`
      group.add(jb)
    })

    // Small cable marker posts along export run
    ;[9, 11.5, 13.8].forEach((x, i) => {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.035, 0.55, 8),
        boxMat,
      )
      post.position.set(x, 0.28, midZ + 0.6 + i * 0.8)
      post.castShadow = true
      post.name = `CableTrench_Marker_${i + 1}`
      group.add(post)
    })

    return group
  }, [cable, box])

  return <primitive object={root} />
}
