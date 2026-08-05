import { useEffect, useMemo } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import { ThreeEvent, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import {
  buildTextureKit,
  CABLE_BOX_PBR_URLS,
  CABLE_PBR_URLS,
  ROCK_PBR_URLS,
  SITE_PBR_URLS,
  type TextureKit,
} from './textures'
import SolarArray from './SolarArray'
import TransformerStation from './TransformerStation'
import StringInverter from './StringInverter'
import SiteTerrain from './SiteTerrain'
import RockScatter from './RockScatter'
import SiteCables from './SiteCables'
import InverterLabels from './InverterLabels'
import ComponentLabels, { type LabelMode } from './ComponentLabels'
import type { TwinSnapshot } from './digitalTwin'

type FarmSceneProps = {
  selectedName: string | null
  onSelect: (name: string | null) => void
  focusTarget: string | null
  viewMode: 'overview' | 'inverter'
  cameraPreset: CameraPreset
  activeUnitId: string
  doorMode: 'auto' | 'open' | 'closed'
  exploded: boolean
  xray: boolean
  twin: TwinSnapshot | null
  tempOverlay: boolean
  fibreOverlay: boolean
  showLabels: boolean
  componentLabels: boolean
  labelMode: LabelMode
  ramanPulse?: boolean
  focusInverterId?: string | null
}

export type CameraPreset =
  | 'focus'
  | 'overview'
  | 'row'
  | 'front'
  | 'interior'
  | 'top'

const SELECTABLE_PREFIXES = [
  'SolarPanel_',
  'SolarPanels',
  'SolarPanelsCAD',
  'SolarRow_',
  'CableTrench',
  'StringInverter',
  'ACCombiner',
  'InverterStation',
  'InverterCabinet',
  'Transformer',
  'ControlRoom',
]

type MatStyle = {
  color: string
  map?: keyof TextureKit
  roughnessMap?: keyof TextureKit
  normalMap?: keyof TextureKit
  metalness: number
  roughness: number
  envMapIntensity?: number
  normalScale?: number
}

const STYLES: Record<string, MatStyle> = {
  PaintedSteel: {
    color: '#ffffff',
    map: 'steel',
    roughnessMap: 'steelRough',
    metalness: 0.22,
    roughness: 0.58,
    envMapIntensity: 0.4,
  },
  Aluminium: {
    color: '#ffffff',
    map: 'aluminium',
    metalness: 0.55,
    roughness: 0.38,
    envMapIntensity: 0.55,
  },
  Copper: {
    color: '#ffffff',
    map: 'copper',
    metalness: 0.85,
    roughness: 0.35,
    envMapIntensity: 0.55,
  },
  Plastic: { color: '#1c1c22', metalness: 0.05, roughness: 0.62, envMapIntensity: 0.15 },
  Glass: { color: '#8eb4c8', metalness: 0.05, roughness: 0.12, envMapIntensity: 0.7 },
  FibreOptic: { color: '#d44535', metalness: 0.05, roughness: 0.4, envMapIntensity: 0.2 },
  Concrete: {
    color: '#ffffff',
    map: 'concrete',
    roughnessMap: 'concreteRough',
    metalness: 0.02,
    roughness: 0.88,
    envMapIntensity: 0.12,
  },
  Ground: {
    color: '#ffffff',
    map: 'ground',
    roughnessMap: 'groundRough',
    normalMap: 'groundNormal',
    metalness: 0,
    roughness: 1,
    envMapIntensity: 0.1,
    normalScale: 0.85,
  },
  SolarCell: {
    color: '#ffffff',
    map: 'solar',
    metalness: 0.12,
    roughness: 0.32,
    envMapIntensity: 0.55,
  },
  Gravel: {
    color: '#ffffff',
    map: 'gravel',
    roughnessMap: 'gravelRough',
    normalMap: 'gravelNormal',
    metalness: 0.02,
    roughness: 1,
    envMapIntensity: 0.1,
    normalScale: 1.1,
  },
  BuildingPaint: {
    color: '#ffffff',
    map: 'paint',
    roughnessMap: 'steelRough',
    metalness: 0.12,
    roughness: 0.55,
    envMapIntensity: 0.35,
  },
}

function resolveStyle(mesh: THREE.Mesh): MatStyle {
  const matName = Array.isArray(mesh.material)
    ? mesh.material[0]?.name
    : mesh.material?.name
  if (matName && STYLES[matName]) return STYLES[matName]

  const n = mesh.name
  if (n.startsWith('SolarPanel_') && !n.includes('Frame') && !n.includes('Post')) return STYLES.SolarCell
  if (n.includes('Roof') || n.includes('Shell') || (n.startsWith('ControlRoom') && !n.includes('Window') && !n.includes('Floor'))) {
    return STYLES.BuildingPaint
  }
  if (n.includes('Frame') || n.includes('Post') || n.includes('Radiator') || n.includes('HeatSink') || n.includes('AirDuct') || n.includes('Blade') || n.includes('Bushing')) {
    return STYLES.Aluminium
  }
  if (n.includes('Busbar') || n.includes('Terminal')) return STYLES.Copper
  if (n.includes('RamanFibre') && !n.includes('Gland')) return STYLES.FibreOptic
  if (n.includes('Ground')) return STYLES.Ground
  if (n.includes('AccessRoad')) return STYLES.Gravel
  if (n.includes('Trench') || n.includes('Pad') || n.includes('Floor')) return STYLES.Concrete
  if (n.includes('Window')) return STYLES.Glass
  if (n.includes('IGBT') || n.includes('Capacitor') || n.includes('CoolingFan') || n.includes('Gland')) return STYLES.Plastic
  return STYLES.PaintedSteel
}

function isSelectable(name: string) {
  return SELECTABLE_PREFIXES.some((p) => name === p || name.startsWith(p))
}

function findSelectableAncestor(obj: THREE.Object3D): THREE.Object3D | null {
  let current: THREE.Object3D | null = obj
  while (current) {
    if (current.name && isSelectable(current.name)) return current
    current = current.parent
  }
  return null
}

function shouldHidePlaceholder(name: string) {
  return (
    name.startsWith('SolarPanel_') ||
    name.startsWith('InverterStation') ||
    name.startsWith('InverterCabinet') ||
    name.startsWith('Transformer') ||
    name === 'Door' ||
    name.startsWith('Door_') ||
    name.startsWith('IGBT_') ||
    name.startsWith('HeatSink') ||
    name.startsWith('Capacitor') ||
    name.startsWith('Busbar_') ||
    name.startsWith('CoolingFan') ||
    name.startsWith('AirDuct_') ||
    name.startsWith('RamanFibre')
  )
}

function frameObject(
  object: THREE.Object3D,
  camera: THREE.Camera,
  controls: { target: THREE.Vector3; update?: () => void } | null,
  viewMode: 'overview' | 'inverter',
  preset: CameraPreset = 'focus',
) {
  // Always frame the cabinet box when an internal part is selected —
  // CAD modules are small and framing them alone misses the enclosure.
  let frameRoot = object
  let unit: THREE.Object3D | null = object
  while (
    unit &&
    !/^StringInverter_\d{2}$/.test(unit.name) &&
    unit.name !== 'ACCombiner' &&
    unit.name !== 'StringInverterRow'
  ) {
    unit = unit.parent
  }
  if (
    unit &&
    (/^StringInverter_\d{2}$/.test(unit.name) || unit.name === 'ACCombiner') &&
    object !== unit
  ) {
    frameRoot = unit
  }

  frameRoot.updateWorldMatrix(true, true)
  const box = new THREE.Box3().setFromObject(frameRoot)
  if (box.isEmpty()) return

  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const radius = Math.max(size.x, size.y, size.z, 0.15)

  if (camera instanceof THREE.PerspectiveCamera) {
    camera.near = 0.05
    camera.far = 500
    camera.updateProjectionMatrix()
  }

  if (preset === 'overview' || (preset === 'top' && object.name === 'Ground')) {
    if (preset === 'top') {
      camera.position.set(center.x, Math.max(radius * 2.2, 55), center.z + 0.01)
      if (controls?.target) {
        controls.target.copy(center)
        controls.update?.()
      }
      return
    }
    camera.position.set(center.x + 45, 38, center.z + 55)
    if (controls?.target) {
      controls.target.set(0, 1, 0)
      controls.update?.()
    }
    return
  }

  const isInv =
    unit &&
    (/^StringInverter_\d{2}$/.test(unit.name) ||
      unit.name === 'ACCombiner' ||
      unit.name === 'StringInverterRow')

  if (isInv && unit) {
    unit.updateWorldMatrix(true, false)
    const front = new THREE.Vector3(0, 0, -1)
      .transformDirection(unit.matrixWorld)
      .normalize()
    const right = new THREE.Vector3(1, 0, 0)
      .transformDirection(unit.matrixWorld)
      .normalize()
    const up = new THREE.Vector3(0, 1, 0)

    // Prefer a cabinet-facing shot for focus/interior so the enclosure stays in frame
    const viewPreset =
      preset === 'focus' && frameRoot === unit ? 'front' : preset

    let dist = Math.max(radius * 3.2, 1.35)
    let height = Math.max(radius * 0.45, 0.2)
    let lateral = radius * 0.15

    if (viewPreset === 'row') {
      dist = Math.max(radius * 1.8, 8)
      height = 4
      lateral = 0
      camera.position
        .copy(center)
        .addScaledVector(front, dist)
        .addScaledVector(up, height)
    } else if (viewPreset === 'front') {
      dist = Math.max(radius * 2.4, 2.4)
      height = Math.max(radius * 0.2, 0.45)
      camera.position
        .copy(center)
        .addScaledVector(front, dist)
        .addScaledVector(right, lateral * 0.5)
        .addScaledVector(up, height)
    } else if (viewPreset === 'interior') {
      dist = Math.max(radius * 1.85, 1.8)
      height = Math.max(radius * 0.15, 0.35)
      camera.position
        .copy(center)
        .addScaledVector(front, dist)
        .addScaledVector(right, -radius * 0.05)
        .addScaledVector(up, height)
    } else if (viewPreset === 'top') {
      camera.position.copy(center).addScaledVector(up, Math.max(radius * 3.5, 4))
      camera.position.addScaledVector(front, radius * 0.3)
    } else {
      camera.position
        .copy(center)
        .addScaledVector(front, dist)
        .addScaledVector(right, lateral)
        .add(new THREE.Vector3(0, height, 0))
    }

    if (controls?.target) {
      controls.target.copy(center)
      controls.update?.()
    }
    return
  }

  const offset =
    viewMode === 'inverter'
      ? new THREE.Vector3(radius * 2.2, radius * 1.4, radius * 2.6)
      : new THREE.Vector3(radius * 0.9, radius * 0.75, radius * 1.1)

  camera.position.copy(center).add(offset)
  if (controls?.target) {
    controls.target.copy(center)
    controls.update?.()
  }
}

function LocalEnvironment() {
  const { gl, scene } = useThree()

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    pmrem.compileEquirectangularShader()
    const room = new RoomEnvironment()
    const env = pmrem.fromScene(room, 0.04)
    scene.environment = env.texture
    scene.environmentIntensity = 0.62

    return () => {
      scene.environment = null
      env.dispose()
      pmrem.dispose()
      room.dispose?.()
    }
  }, [gl, scene])

  return null
}

/** Widen the site pad and relocate the control building off the transformer corner */
function applySiteLayout(root: THREE.Object3D) {
  // Flat GLB ground replaced by displaced SiteTerrain
  const ground = root.getObjectByName('Ground')
  if (ground) ground.visible = false

  const road = root.getObjectByName('AccessRoad')
  if (road) {
    road.scale.set(1.15, 1, 1.75)
    road.position.x = -28
  }

  const control = root.getObjectByName('ControlRoom')
  if (control) {
    control.position.set(-30, 0, 12)
  }
}

export default function FarmScene({
  selectedName,
  onSelect,
  focusTarget,
  viewMode,
  cameraPreset,
  activeUnitId,
  doorMode,
  exploded,
  xray,
  twin,
  tempOverlay,
  fibreOverlay,
  showLabels,
  componentLabels,
  labelMode,
  ramanPulse = false,
  focusInverterId = null,
}: FarmSceneProps) {
  const gltf = useGLTF('/solar_farm.glb')
  const { camera, controls, scene } = useThree()
  const siteMaps = useTexture({ ...SITE_PBR_URLS })
  const rockMaps = useTexture({ ...ROCK_PBR_URLS })
  const cableMaps = useTexture({ ...CABLE_PBR_URLS })
  const cableBoxMaps = useTexture({ ...CABLE_BOX_PBR_URLS })
  const textures = useMemo(() => buildTextureKit(siteMaps), [siteMaps])

  const root = useMemo(() => {
    const cloned = gltf.scene.clone(true)

    const removeList: THREE.Object3D[] = []
    cloned.traverse((obj) => {
      if ((obj as THREE.Light).isLight || (obj as THREE.Camera).isCamera) {
        removeList.push(obj)
      }
    })
    removeList.forEach((obj) => obj.parent?.remove(obj))

    applySiteLayout(cloned)

    cloned.traverse((obj) => {
      if (shouldHidePlaceholder(obj.name)) {
        obj.visible = false
        return
      }

      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return

      mesh.castShadow = true
      mesh.receiveShadow = true

      const style = resolveStyle(mesh)
      const mat = new THREE.MeshStandardMaterial({
        color: style.color,
        map: style.map ? textures[style.map] : null,
        roughnessMap: style.roughnessMap ? textures[style.roughnessMap] : null,
        normalMap: style.normalMap ? textures[style.normalMap] : null,
        metalness: style.metalness,
        roughness: style.roughness,
        envMapIntensity: style.envMapIntensity ?? 0.4,
      })
      if (style.normalMap && style.normalScale != null) {
        mat.normalScale.set(style.normalScale, style.normalScale)
      }

      // Maps already encode colour — keep white tint
      if (
        style.map === 'solar' ||
        style.map === 'ground' ||
        style.map === 'gravel' ||
        style.map === 'concrete' ||
        style.map === 'steel' ||
        style.map === 'paint' ||
        style.map === 'aluminium' ||
        style.map === 'copper'
      ) {
        mat.color.set('#ffffff')
      }

      mesh.material = mat
      mesh.userData.baseEmissive = {
        color: mat.emissive.clone(),
        intensity: mat.emissiveIntensity,
      }
    })

    return cloned
  }, [gltf.scene, textures])

  useEffect(() => {
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh || !mesh.visible) return
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (!mat?.isMeshStandardMaterial) return

      const selected =
        !!selectedName &&
        (mesh.name === selectedName ||
          mesh.name.startsWith(`${selectedName}_`) ||
          findSelectableAncestor(mesh)?.name === selectedName)

      const base = mesh.userData.baseEmissive
      if (selected) {
        mat.emissive.set('#2f9f8a')
        mat.emissiveIntensity = 0.4
      } else if (base) {
        mat.emissive.copy(base.color)
        mat.emissiveIntensity = base.intensity
      }
    })
  }, [root, selectedName])

  useEffect(() => {
    let prefer =
      focusTarget ??
      (viewMode === 'inverter' ? activeUnitId : 'Ground')

    if (cameraPreset === 'overview') prefer = 'Ground'
    if (cameraPreset === 'row') prefer = 'StringInverterRow'

    const target =
      scene.getObjectByName(prefer) ??
      root.getObjectByName(prefer) ??
      root.getObjectByName('Ground') ??
      root

    frameObject(
      target,
      camera,
      controls as unknown as { target: THREE.Vector3; update?: () => void } | null,
      viewMode,
      cameraPreset,
    )
  }, [
    camera,
    controls,
    focusTarget,
    root,
    scene,
    viewMode,
    cameraPreset,
    activeUnitId,
  ])

  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    let current: THREE.Object3D | null = event.object
    let best: THREE.Object3D | null = null
    while (current) {
      if (current.name && isSelectable(current.name)) best = current
      current = current.parent
    }
    onSelect(best?.name ?? null)
  }

  return (
    <>
      <LocalEnvironment />
      <primitive object={root} onPointerDown={onPointerDown} />
      <SolarArray selectedName={selectedName} onSelect={onSelect} />
      <StringInverter
        selectedName={selectedName}
        onSelect={onSelect}
        activeUnitId={activeUnitId}
        doorMode={doorMode}
        exploded={exploded}
        xray={xray}
        twin={twin}
        tempOverlay={tempOverlay}
        fibreOverlay={fibreOverlay}
        ramanPulse={ramanPulse}
        focusInverterId={focusInverterId}
      />
      <InverterLabels snapshot={twin} visible={showLabels} />
      <ComponentLabels
        unitId={activeUnitId}
        twin={twin}
        visible={componentLabels && viewMode === 'inverter'}
        mode={labelMode}
      />
      <TransformerStation
        position={[16, 0, 14]}
        selectedName={selectedName}
        onSelect={onSelect}
      />
      <SiteTerrain
        map={textures.ground}
        roughnessMap={textures.groundRough}
        normalMap={textures.groundNormal}
      />
      <RockScatter
        map={rockMaps.map}
        roughnessMap={rockMaps.roughnessMap}
        normalMap={rockMaps.normalMap}
      />
      <SiteCables cable={cableMaps} box={cableBoxMaps} />
    </>
  )
}

useGLTF.preload('/solar_farm.glb')
