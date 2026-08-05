import { useMemo } from 'react'
import * as THREE from 'three'
import { configureMap } from './textures'
import {
  getStringInverterPositions,
  INVERTER_ROW_COUNT,
  PANEL_EAST_X,
  PANEL_ORIGIN_X,
  ROW_ZS,
  TRANSFORMER_PAD,
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

/** Raised above uneven SiteTerrain displacement so paths stay visible. */
const CABLE_Y = 0.42
const TRENCH_Y = 0.12
const DC_Y = 0.95

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
  mesh.renderOrder = 2
  return mesh
}

function trenchBed(
  length: number,
  width: number,
  mat: THREE.Material,
  position: [number, number, number],
  name: string,
  rotationY = 0,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, 0.08, width), mat)
  mesh.position.set(...position)
  mesh.rotation.y = rotationY
  mesh.receiveShadow = true
  mesh.name = name
  mesh.renderOrder = 1
  return mesh
}

/**
 * Site cabling: DC string along each row → inverter feeders → collector trench →
 * AC export to the transformer pad (east of the array), with raised beds so
 * paths stay visible over uneven ground.
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
      envMapIntensity: 0.35,
      normalScale: new THREE.Vector2(0.85, 0.85),
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })

    const dcMat = cableMat.clone()
    dcMat.color = new THREE.Color('#c45a2a')
    dcMat.map = null

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

    const bedMat = new THREE.MeshStandardMaterial({
      color: '#5a6168',
      roughness: 0.92,
      metalness: 0.05,
    })

    const group = new THREE.Group()
    group.name = 'SiteCables'

    const invPos = getStringInverterPositions()
    const midZ = (ROW_ZS[0] + ROW_ZS[INVERTER_ROW_COUNT - 1]) / 2
    const collectorX = TRENCH_X1 - 0.15
    const [tx, , tz] = TRANSFORMER_PAD
    const rowSpan = Math.abs(ROW_ZS[0] - ROW_ZS[ROW_ZS.length - 1]) + 2.4
    const rowLen = PANEL_EAST_X - PANEL_ORIGIN_X + 1.2

    // Collector trench bed (north–south)
    group.add(
      trenchBed(
        0.85,
        rowSpan,
        bedMat,
        [collectorX, TRENCH_Y, midZ],
        'CableTrench_Bed_Collector',
      ),
    )

    // Export trench bed toward transformer (east)
    const exportMidX = (collectorX + tx) * 0.5
    const exportLen = Math.max(4, Math.abs(tx - collectorX) - 1)
    group.add(
      trenchBed(
        exportLen,
        1.1,
        bedMat,
        [exportMidX, TRENCH_Y, midZ + (tz - midZ) * 0.35],
        'CableTrench_Bed_Export',
      ),
    )

    // Transformer approach pad strip
    group.add(
      trenchBed(3.2, 2.4, bedMat, [tx - 1.2, TRENCH_Y, tz], 'CableTrench_Bed_Pad'),
    )

    invPos.forEach((pos, i) => {
      const [ix, , iz] = pos
      const id = String(i + 1).padStart(2, '0')

      // DC string cable under the panel row (east → west into inverter)
      group.add(
        tube(
          [
            new THREE.Vector3(PANEL_EAST_X, DC_Y, iz - 0.35),
            new THREE.Vector3((PANEL_ORIGIN_X + PANEL_EAST_X) * 0.5, DC_Y + 0.05, iz - 0.38),
            new THREE.Vector3(PANEL_ORIGIN_X + 0.4, DC_Y, iz - 0.22),
            new THREE.Vector3(ix + 0.35, 0.55, iz + 0.05),
            new THREE.Vector3(ix + 0.15, 0.35, iz + 0.12),
          ],
          0.028,
          dcMat,
          `CableTrench_DCString_${id}`,
          56,
        ),
      )

      // Raised bed under DC run
      group.add(
        trenchBed(
          rowLen,
          0.55,
          bedMat,
          [(PANEL_ORIGIN_X + PANEL_EAST_X) * 0.5, TRENCH_Y - 0.02, iz - 0.35],
          `CableTrench_Bed_Row_${id}`,
        ),
      )

      // Feeder: inverter → collector trench
      group.add(
        tube(
          [
            new THREE.Vector3(ix + 0.55, 0.28, iz + 0.18),
            new THREE.Vector3(ix + 1.1, CABLE_Y, iz + 0.22),
            new THREE.Vector3((ix + collectorX) * 0.55, CABLE_Y, iz + 0.1),
            new THREE.Vector3(collectorX, CABLE_Y, iz),
          ],
          0.04,
          cableMat,
          `CableTrench_Feeder_${id}`,
          36,
        ),
      )

      const jb = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.32), boxMat)
      jb.position.set(collectorX, CABLE_Y + 0.02, iz)
      jb.castShadow = true
      jb.receiveShadow = true
      jb.name = `CableTrench_JB_${id}`
      group.add(jb)
    })

    // Collector spine
    const spinePts = ROW_ZS.slice(0, INVERTER_ROW_COUNT).map(
      (z) => new THREE.Vector3(collectorX, CABLE_Y, z),
    )
    group.add(tube(spinePts, 0.055, cableMat, 'CableTrench_Collector', 72))

    // Drop into AC combiner
    group.add(
      tube(
        [
          new THREE.Vector3(collectorX, CABLE_Y, midZ),
          new THREE.Vector3(collectorX - 0.12, CABLE_Y + 0.15, midZ),
          new THREE.Vector3(collectorX - 0.28, 0.7, midZ),
          new THREE.Vector3(collectorX - 0.32, 0.95, midZ),
        ],
        0.045,
        cableMat,
        'CableTrench_ACDrop',
        28,
      ),
    )

    // AC export to transformer (east of panels)
    group.add(
      tube(
        [
          new THREE.Vector3(collectorX - 0.15, CABLE_Y, midZ + 0.4),
          new THREE.Vector3(collectorX + 2.5, CABLE_Y, midZ + 0.9),
          new THREE.Vector3((collectorX + tx) * 0.45, CABLE_Y + 0.04, midZ + (tz - midZ) * 0.25),
          new THREE.Vector3((collectorX + tx) * 0.72, CABLE_Y + 0.06, tz + 0.6),
          new THREE.Vector3(tx - 2.2, CABLE_Y + 0.05, tz + 0.25),
          new THREE.Vector3(tx - 0.85, 0.55, tz),
          new THREE.Vector3(tx - 0.35, 0.75, tz),
        ],
        0.06,
        cableMat,
        'CableTrench_ACExport',
        96,
      ),
    )

    ;[
      [collectorX - 0.05, midZ + 0.45] as const,
      [(collectorX + tx) * 0.55, midZ + (tz - midZ) * 0.3] as const,
      [tx - 1.6, tz + 0.15] as const,
    ].forEach(([x, z], i) => {
      const jb = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.36), boxMat)
      jb.position.set(x, CABLE_Y + 0.04, z)
      jb.castShadow = true
      jb.receiveShadow = true
      jb.name = `CableTrench_JB_Main_${i + 1}`
      group.add(jb)
    })

    // Marker posts along export path
    const markers = 6
    for (let i = 0; i < markers; i++) {
      const t = (i + 1) / (markers + 1)
      const x = collectorX + t * (tx - collectorX - 1.5)
      const z = midZ + t * (tz - midZ) * 0.85
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.04, 0.85, 8),
        boxMat,
      )
      post.position.set(x, 0.45, z)
      post.castShadow = true
      post.name = `CableTrench_Marker_${i + 1}`
      group.add(post)
    }

    return group
  }, [cable, box])

  return <primitive object={root} />
}
