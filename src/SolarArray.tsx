import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { createMetalTexture, createSolarCellTexture } from './textures'

type SolarArrayProps = {
  selectedName: string | null
  onSelect: (name: string | null) => void
}

/**
 * Ground-mount array layout (aligned with CableTrench_Row_* Z bands from solar_farm.glb,
 * then extended north/south with extra rows).
 */
export const ROW_COUNT = 8
export const PANELS_PER_ROW = 10
export const ROW_SPACING = 5.5
/** World Z of each row centre — includes the four site trenches plus extra rows */
export const ROW_ZS: readonly number[] = Array.from(
  { length: ROW_COUNT },
  (_, i) => 18 - i * ROW_SPACING,
)
export const TRENCH_X0 = -10
export const TRENCH_X1 = 6

const TILT = THREE.MathUtils.degToRad(28)

/** Commercial-scale modules — wider along the row, taller up the tilt */
export const PANEL_W = 1.55
export const PANEL_D = 2.45
const PANEL_T = 0.045
const FRAME = 0.04
export const PANEL_GAP = 0.18

export const PANEL_PITCH = PANEL_W + PANEL_GAP
export const ROW_LENGTH = PANELS_PER_ROW * PANEL_PITCH
/** First (left / west) panel centre */
export const PANEL_ORIGIN_X = -10.2

/** How many leftmost rows get a string inverter */
export const INVERTER_ROW_COUNT = 4

const RACK_Y = 1.35
const POST_H = 1.55
const RAIL_Z = PANEL_D * 0.28

function glow(root: THREE.Object3D, on: boolean) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const mat = mesh.material as THREE.MeshStandardMaterial
    if (!mat?.isMeshStandardMaterial) return
    if (on) {
      mat.emissive.set('#3db8a0')
      mat.emissiveIntensity = 0.25
    } else {
      mat.emissive.set('#000000')
      mat.emissiveIntensity = 0
    }
  })
}

function box(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  position: [number, number, number],
  name?: string,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat.clone())
  mesh.position.set(...position)
  mesh.castShadow = true
  mesh.receiveShadow = true
  if (name) mesh.name = name
  return mesh
}

function makeModule(
  cellMat: THREE.Material,
  frameMat: THREE.Material,
  name: string,
) {
  const g = new THREE.Group()
  g.name = name

  g.add(box(PANEL_W, PANEL_T, PANEL_D, frameMat, [0, 0, 0], `${name}_Body`))

  const lipY = PANEL_T * 0.4
  const lipH = PANEL_T * 0.7
  g.add(box(PANEL_W, lipH, FRAME, frameMat, [0, lipY, (PANEL_D - FRAME) / 2]))
  g.add(box(PANEL_W, lipH, FRAME, frameMat, [0, lipY, -(PANEL_D - FRAME) / 2]))
  g.add(box(FRAME, lipH, PANEL_D - FRAME * 2, frameMat, [(PANEL_W - FRAME) / 2, lipY, 0]))
  g.add(box(FRAME, lipH, PANEL_D - FRAME * 2, frameMat, [-(PANEL_W - FRAME) / 2, lipY, 0]))

  g.add(
    box(
      PANEL_W - FRAME * 2.4,
      0.008,
      PANEL_D - FRAME * 2.4,
      cellMat,
      [0, PANEL_T * 0.55, 0],
      `${name}_Cell`,
    ),
  )

  return g
}

function makeRow(
  rowIndex: number,
  steelMat: THREE.Material,
  cellMat: THREE.Material,
  frameMat: THREE.Material,
) {
  const id = `SolarRow_${String(rowIndex + 1).padStart(2, '0')}`
  const root = new THREE.Group()
  root.name = id

  const z = ROW_ZS[rowIndex]
  const midX = PANEL_ORIGIN_X + (ROW_LENGTH - PANEL_PITCH) / 2

  // Ground posts along the row
  const postCount = Math.ceil(PANELS_PER_ROW / 2) + 1
  for (let i = 0; i < postCount; i++) {
    const x =
      PANEL_ORIGIN_X +
      (i / (postCount - 1)) * (ROW_LENGTH - PANEL_PITCH)
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.07, POST_H, 10),
      steelMat.clone(),
    )
    post.position.set(x, POST_H / 2, z)
    post.castShadow = true
    post.name = `${id}_Post_${i}`
    root.add(post)
    root.add(box(0.34, 0.07, 0.34, steelMat, [x, 0.035, z]))
  }

  // Tilted rack — panels face roughly −Z (sunward)
  const rack = new THREE.Group()
  rack.name = `${id}_Rack`
  rack.position.set(midX, RACK_Y, z)
  rack.rotation.x = -TILT

  rack.add(box(ROW_LENGTH + 0.25, 0.06, 0.07, steelMat, [0, -0.05, RAIL_Z], `${id}_RailF`))
  rack.add(box(ROW_LENGTH + 0.25, 0.06, 0.07, steelMat, [0, -0.05, -RAIL_Z], `${id}_RailB`))
  rack.add(box(ROW_LENGTH + 0.2, 0.05, 0.06, steelMat, [0, -0.09, 0], `${id}_RailC`))

  const startX = -ROW_LENGTH / 2 + PANEL_W / 2
  for (let i = 0; i < PANELS_PER_ROW; i++) {
    const panelId = `SolarPanel_${String(rowIndex + 1).padStart(2, '0')}_${String(i + 1).padStart(2, '0')}`
    const mod = makeModule(cellMat, frameMat, panelId)
    mod.position.set(startX + i * PANEL_PITCH, 0.03, 0)
    rack.add(mod)
  }

  root.add(rack)
  return root
}

export default function SolarArray({ selectedName, onSelect }: SolarArrayProps) {
  const materials = useMemo(() => {
    const cellMap = createSolarCellTexture()
    cellMap.wrapS = cellMap.wrapT = THREE.ClampToEdgeWrapping
    cellMap.anisotropy = 8
    cellMap.center.set(0.5, 0.5)
    cellMap.rotation = 0

    return {
      cell: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        map: cellMap,
        metalness: 0.12,
        roughness: 0.34,
        envMapIntensity: 0.5,
      }),
      frame: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        map: createMetalTexture('#8a9098', { weathered: false }),
        metalness: 0.62,
        roughness: 0.4,
        envMapIntensity: 0.45,
      }),
      steel: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        map: createMetalTexture('#9aa3ac', { weathered: true }),
        metalness: 0.28,
        roughness: 0.55,
        envMapIntensity: 0.4,
      }),
    }
  }, [])

  const rows = useMemo(
    () =>
      Array.from({ length: ROW_COUNT }, (_, i) =>
        makeRow(i, materials.steel, materials.cell, materials.frame),
      ),
    [materials],
  )

  useEffect(() => {
    rows.forEach((row, i) => {
      const rowId = `SolarRow_${String(i + 1).padStart(2, '0')}`
      const on =
        selectedName === 'SolarPanels' ||
        selectedName === 'SolarPanelsCAD' ||
        selectedName === rowId ||
        (!!selectedName && selectedName.startsWith('SolarPanel_'))
      glow(row, on)
    })
  }, [rows, selectedName])

  return (
    <group name="SolarPanelsCAD">
      {rows.map((row, i) => (
        <primitive
          key={row.name}
          object={row}
          onClick={(e: { stopPropagation: () => void }) => {
            e.stopPropagation()
            onSelect(`SolarPanel_${String(i + 1).padStart(2, '0')}_01`)
          }}
        />
      ))}
    </group>
  )
}

/** Leftmost panel centre for a row (world XZ). */
export function getLeftPanelPosition(rowIndex: number): { x: number; z: number } {
  return { x: PANEL_ORIGIN_X, z: ROW_ZS[rowIndex] }
}

/**
 * World positions for string inverters on the left end of the first rows.
 * Door faces −X (outward from the array).
 */
export function getStringInverterPositions(): [number, number, number][] {
  return ROW_ZS.slice(0, INVERTER_ROW_COUNT).map((z) => {
    const x = PANEL_ORIGIN_X - PANEL_W * 0.55 - 0.55
    return [x, 0, z] as [number, number, number]
  })
}
