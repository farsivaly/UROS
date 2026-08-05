import { useEffect, useMemo, useRef } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  CABLE_PBR_URLS,
  configureMap,
  createCopperTexture,
  createMetalTexture,
} from './textures'
import {
  getStringInverterPositions,
  INVERTER_ROW_COUNT,
  ROW_ZS,
  TRENCH_X1,
} from './SolarArray'
import {
  applyComponentTemperature,
  applyFibreTemperature,
  applyHotspot,
  findInverter,
  type TwinSnapshot,
} from './digitalTwin'
import {
  INVERTER_PART_URLS,
  cloneNamedPart,
  type InverterPartTemplates,
} from './inverterParts'

type Props = {
  selectedName: string | null
  onSelect: (name: string | null) => void
  /** Active inverter for door / explode / x-ray tools */
  activeUnitId: string
  doorMode: 'auto' | 'open' | 'closed'
  exploded: boolean
  xray: boolean
  twin: TwinSnapshot | null
  tempOverlay: boolean
  fibreOverlay: boolean
  ramanPulse?: boolean
  focusInverterId?: string | null
}

const UNIT_COUNT = INVERTER_ROW_COUNT

/** Door faces local −Z; rotate so open face looks west (−X) away from panels */
const UNIT_YAW = Math.PI / 2

const DOOR_HINGE = { x: -0.39, y: 0.7, z: -0.155 }
const DOOR_CLOSED_Y = 0
const DOOR_OPEN_Y = 1.35

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

function cyl(
  r: number,
  h: number,
  mat: THREE.Material,
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
  name?: string,
) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), mat.clone())
  mesh.position.set(...position)
  mesh.rotation.set(...rotation)
  mesh.castShadow = true
  if (name) mesh.name = name
  return mesh
}

function makeHmiTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 320
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#3a3f46'
  ctx.fillRect(0, 0, 256, 320)
  const leds = [
    { label: 'Power', color: '#e23b3b', x: 48 },
    { label: 'Operation', color: '#3bbb4a', x: 128 },
    { label: 'Alarm', color: '#555', x: 208 },
  ]
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  leds.forEach((led) => {
    ctx.fillStyle = led.color
    ctx.beginPath()
    ctx.arc(led.x, 36, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#c8cdd3'
    ctx.fillText(led.label, led.x, 58)
  })
  ctx.fillStyle = '#1a2220'
  ctx.fillRect(28, 80, 200, 70)
  ctx.fillStyle = '#6fd67a'
  ctx.font = 'bold 18px monospace'
  ctx.textAlign = 'left'
  ctx.fillText('SMA · OK', 44, 110)
  ctx.font = '14px monospace'
  ctx.fillText('P: 42.6 kW', 44, 136)
  ;['ESC', '▲', '▼', 'ENT'].forEach((label, i) => {
    const x = 48 + i * 52
    ctx.fillStyle = '#c5cad0'
    ctx.beginPath()
    ctx.arc(x, 210, 14, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#222'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(label, x, 246)
  })
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

type Mats = Record<string, THREE.Material>

function unitIdFromSelection(selectedName: string | null): string | null {
  if (!selectedName) return null
  if (selectedName === 'StringInverter' || selectedName === 'StringInverterRow') {
    return 'StringInverter_01'
  }
  const m = selectedName.match(/^StringInverter_(\d{2})/)
  return m ? `StringInverter_${m[1]}` : null
}

function shouldOpenDoor(selectedName: string | null, unitId: string) {
  const openUnit = unitIdFromSelection(selectedName)
  if (!openUnit) return false
  if (openUnit !== unitId) return false
  // Open for unit itself, door, or any internal component
  return true
}

function makePulseSphere(name: string, color: string, emissive: string, radius: number) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 14, 12),
    new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    }),
  )
  mesh.name = name
  mesh.visible = false
  mesh.renderOrder = 10
  return mesh
}

/**
 * CAD optic-fibre braid as the jacket, with cladding + core coaxial inside it.
 */
function buildRamanFibreAssembly(unitId: string, opticTemplate: THREE.Object3D, mats: Mats) {
  const fibrePts = [
    new THREE.Vector3(-0.34, 0.3, -0.04),
    new THREE.Vector3(-0.34, 0.46, -0.02),
    new THREE.Vector3(-0.34, 0.7, 0.0),
    new THREE.Vector3(-0.18, 0.7, 0.025),
    new THREE.Vector3(-0.05, 0.7, 0.032),
    new THREE.Vector3(0.08, 0.7, 0.025),
    new THREE.Vector3(0.2, 0.62, 0.01),
    new THREE.Vector3(0.28, 0.48, -0.01),
    new THREE.Vector3(0.32, 0.36, -0.03),
    new THREE.Vector3(0.32, 0.28, -0.04),
  ]
  const curve = new THREE.CatmullRomCurve3(fibrePts)
  curve.curveType = 'catmullrom'
  curve.tension = 0.35

  const root = new THREE.Group()
  root.name = `${unitId}_RamanFibre`
  root.userData.fibreCurve = curve
  root.userData.hotspotT = 0.55

  // Measure CAD braid so cladding/core sit on its axis and inside its lumen.
  const templateBox = new THREE.Box3().setFromObject(opticTemplate)
  const templateCenter = new THREE.Vector3()
  const templateSize = new THREE.Vector3()
  templateBox.getCenter(templateCenter)
  templateBox.getSize(templateSize)
  const segScale = 3.8
  const braidRadius = (Math.min(templateSize.x, templateSize.y) * 0.5 * segScale) || 0.01
  const cladRadius = braidRadius * 0.42
  const coreRadius = braidRadius * 0.16

  const pathLen = curve.getLength()
  const segCount = Math.max(14, Math.ceil(pathLen / 0.042))
  const up = new THREE.Vector3(0, 1, 0)
  const zAxis = new THREE.Vector3(0, 0, 1)

  for (let i = 0; i < segCount; i++) {
    const t = segCount === 1 ? 0 : i / (segCount - 1)
    const pos = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t).normalize()
    const seg = cloneNamedPart(opticTemplate, `${unitId}_RamanFibre_Seg_${i}`, {
      scale: segScale,
    })
    // Centre braid geometry on the curve (CAD origin ≠ geometric centre).
    seg.children.forEach((child) => {
      child.position.x -= templateCenter.x
      child.position.y -= templateCenter.y
      child.position.z -= templateCenter.z
    })
    // Align CAD long axis (+Z) to the fibre tangent; keep braid upright.
    const side = new THREE.Vector3().crossVectors(up, tangent)
    if (side.lengthSq() < 1e-8) {
      seg.quaternion.setFromUnitVectors(zAxis, tangent)
    } else {
      side.normalize()
      const correctedUp = new THREE.Vector3().crossVectors(tangent, side).normalize()
      // Local X = side, Y = up, Z = tangent (optic fibre length axis)
      const m = new THREE.Matrix4().makeBasis(side, correctedUp, tangent)
      seg.quaternion.setFromRotationMatrix(m)
    }
    seg.position.copy(pos)
    seg.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.name = `${unitId}_RamanFibre`
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (mat?.isMeshStandardMaterial) {
        mat.transparent = true
        mat.opacity = 0.78
        mat.metalness = Math.min(mat.metalness ?? 0.2, 0.25)
        mat.roughness = Math.max(mat.roughness ?? 0.4, 0.35)
        mat.needsUpdate = true
      }
    })
    root.add(seg)
  }

  // Cladding + core coaxial with the optic braid (same curve, inside the lumen).
  const cladMat = mats.fibre.clone() as THREE.MeshStandardMaterial
  cladMat.transparent = true
  cladMat.opacity = 0.32
  cladMat.depthWrite = false
  cladMat.color.set('#8eb4d0')
  cladMat.emissive.set('#1a3048')
  cladMat.emissiveIntensity = 0.15

  const cladding = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 128, cladRadius, 12, false),
    cladMat,
  )
  cladding.name = `${unitId}_RamanFibre_Cladding`
  cladding.renderOrder = 1
  root.add(cladding)
  root.userData.senseMesh = cladding

  const coreMat = new THREE.MeshStandardMaterial({
    color: '#6aa8c8',
    emissive: '#2a6080',
    emissiveIntensity: 0.14,
    transparent: true,
    opacity: 0.26,
    roughness: 0.35,
    metalness: 0.04,
    depthWrite: false,
  })
  const core = new THREE.Mesh(new THREE.TubeGeometry(curve, 128, coreRadius, 8, false), coreMat)
  core.name = `${unitId}_RamanFibre_Core`
  core.renderOrder = 2
  root.add(core)

  root.add(makePulseSphere('_RamanPump', '#7ec8ff', '#3aa0ff', Math.max(0.008, coreRadius * 1.6)))
  root.add(makePulseSphere('_RamanStokes', '#ff8a4a', '#e25a20', Math.max(0.007, coreRadius * 1.35)))
  root.add(makePulseSphere('_RamanAntiStokes', '#c56bff', '#9b2dff', Math.max(0.007, coreRadius * 1.35)))

  return root
}

/** Hollow SMA-style cabinet on a compact end-of-row post mount */
function buildUnit(index: number, mats: Mats, parts: InverterPartTemplates) {
  const id = `StringInverter_${String(index + 1).padStart(2, '0')}`
  const g = new THREE.Group()
  g.name = id

  // Single post behind cabinet — mounts at left end of a panel row
  g.add(box(0.1, 2.05, 0.1, mats.steel, [0, 1.02, 0.18], `${id}_Post`))
  g.add(box(0.36, 0.05, 0.36, mats.steel, [0, 0.03, 0.18], `${id}_Foot`))
  g.add(box(0.55, 0.05, 0.05, mats.steel, [0, 1.55, 0.05], `${id}_RailTop`))
  g.add(box(0.55, 0.05, 0.05, mats.steel, [0, 0.88, 0.05], `${id}_RailBot`))
  for (let i = 0; i < 5; i++) {
    g.add(box(0.04, 0.012, 0.04, mats.body, [0, 0.4 + i * 0.22, 0.24]))
  }

  const cab = new THREE.Group()
  cab.name = `${id}_Cabinet`
  cab.position.set(0, 0.55, -0.02)

  const W = 0.82
  const D = 0.3
  const H = 1.18
  const wall = 0.025

  // Hollow shell (no solid front face)
  cab.add(box(W, H - 0.02, wall, mats.body, [0, H / 2, D / 2 - wall / 2], `${id}_Cabinet_Back`))
  cab.add(box(wall, H - 0.02, D, mats.body, [-W / 2 + wall / 2, H / 2, 0], `${id}_Cabinet_Left`))
  cab.add(box(wall, H - 0.02, D, mats.body, [W / 2 - wall / 2, H / 2, 0], `${id}_Cabinet_Right`))
  cab.add(box(W, wall, D, mats.body, [0, H - wall / 2, 0], `${id}_Cabinet_Top`))
  cab.add(box(W, 0.26, D, mats.dark, [0, 0.13, 0], `${id}_Cabinet_Base`))
  cab.add(box(W + 0.01, 0.045, 0.02, mats.orange, [0, 0.28, -D / 2 - 0.005], `${id}_Cabinet_Stripe`))
  cab.add(box(0.02, 0.5, 0.12, mats.dark, [W / 2 + 0.005, 0.75, 0.02], `${id}_Vent`))

  const hinge = new THREE.Group()
  hinge.name = `${id}_DoorHinge`
  hinge.position.set(DOOR_HINGE.x, DOOR_HINGE.y, DOOR_HINGE.z)
  hinge.userData.closedY = DOOR_CLOSED_Y
  hinge.userData.openY = DOOR_OPEN_Y

  const doorW = W * 0.96
  const door = box(doorW, 0.78, 0.018, mats.body, [doorW / 2, 0, 0], `${id}_Door`)
  hinge.add(door)

  const hmi = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.26), mats.hmi)
  hmi.position.set(doorW * 0.72, 0.12, -0.012)
  hmi.name = `${id}_HMI`
  door.add(hmi)
  cab.add(hinge)

  for (let i = 0; i < 5; i++) {
    cab.add(cyl(0.011, 0.18, mats.dark, [-0.3 + i * 0.04, 0.22, 0.02]))
  }
  cab.add(cyl(0.028, 0.08, mats.dark, [0.28, 0.22, 0.02], [0, 0, 0], `${id}_ACGland`))

  // ── Backplate + industrial structure ──
  const zBack = 0.115
  const zFront = -0.085
  cab.add(box(0.72, 0.84, 0.006, mats.dark, [0, 0.66, zBack], `${id}_Backplate`))
  cab.add(box(0.7, 0.014, 0.022, mats.steel, [0, 1.04, zBack - 0.018], `${id}_Rail_Top`))
  cab.add(box(0.7, 0.014, 0.022, mats.steel, [0, 0.74, zBack - 0.018], `${id}_Rail_Mid`))
  cab.add(box(0.7, 0.014, 0.022, mats.steel, [0, 0.48, zBack - 0.018], `${id}_Rail_Low`))
  cab.add(box(0.032, 0.72, 0.045, mats.plastic, [-0.345, 0.66, zFront + 0.02], `${id}_CableDuct`))
  cab.add(box(0.008, 0.12, 0.002, mats.copper, [-0.36, 0.78, -0.14], `${id}_GroundStrap`))
  cab.add(box(0.1, 0.04, 0.002, mats.steel, [0.32, 1.08, zFront], `${id}_Nameplate`))
  cab.add(box(0.06, 0.06, 0.002, mats.orange, [-0.32, 1.08, zFront], `${id}_WarningLabel`))

  // TOP LEFT — Cooling: Grille → Fan → Duct → Sink
  cab.add(box(0.34, 0.02, 0.1, mats.steel, [-0.16, 1.1, 0.0], `${id}_FanGrille`))
  for (let i = 0; i < 5; i++) {
    cab.add(box(0.3, 0.004, 0.012, mats.dark, [-0.16, 1.1, -0.04 + i * 0.018]))
  }
  cab.add(
    cloneNamedPart(parts.coolingFan, `${id}_CoolingFan_01`, {
      position: [-0.24, 1.02, 0.02],
      rotation: [0, 0, 0],
      scale: 0.52,
    }),
  )
  cab.add(
    cloneNamedPart(parts.coolingFan, `${id}_CoolingFan_02`, {
      position: [-0.08, 1.02, 0.02],
      rotation: [0, 0, 0],
      scale: 0.52,
    }),
  )
  cab.add(box(0.3, 0.05, 0.09, mats.alu, [-0.16, 0.93, 0.05], `${id}_AirDuct`))
  cab.add(box(0.05, 0.18, 0.08, mats.alu, [-0.16, 0.84, 0.06]))
  cab.add(box(0.04, 0.2, 0.05, mats.alu, [-0.34, 0.8, 0.06], `${id}_ExhaustPath`))

  // TOP RIGHT — Control PCB (populated)
  const pcb = new THREE.Group()
  pcb.name = `${id}_ControlPCB`
  pcb.position.set(0.26, 1.0, zFront)
  pcb.add(box(0.17, 0.22, 0.01, mats.pcb, [0, 0, 0]))
  ;[
    [-0.07, -0.09],
    [0.07, -0.09],
    [-0.07, 0.09],
    [0.07, 0.09],
  ].forEach(([x, y]) => {
    pcb.add(cyl(0.004, 0.012, mats.steel, [x, y, 0.01]))
  })
  pcb.add(box(0.04, 0.05, 0.006, mats.plastic, [-0.03, 0.04, 0.01]))
  pcb.add(box(0.03, 0.025, 0.005, mats.plastic, [0.04, 0.05, 0.01]))
  pcb.add(box(0.05, 0.02, 0.004, mats.plastic, [0.0, -0.04, 0.01]))
  pcb.add(box(0.06, 0.012, 0.01, mats.dark, [0.0, 0.09, 0.012]))
  pcb.add(box(0.02, 0.04, 0.012, mats.dark, [0.07, -0.02, 0.012]))
  ;[-0.05, -0.02, 0.01].forEach((x, i) => {
    pcb.add(cyl(0.004, 0.003, i === 1 ? mats.fibre : mats.orange, [x, -0.08, 0.012], [Math.PI / 2, 0, 0]))
  })
  pcb.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.name = `${id}_ControlPCB`
  })
  cab.add(pcb)
  cab.add(box(0.09, 0.05, 0.02, mats.plastic, [0.28, 0.86, zFront], `${id}_CommModule`))
  cab.add(box(0.12, 0.04, 0.01, mats.pcb, [0.16, 0.86, zFront], `${id}_GateDriver`))

  // CENTRE — Hero power stage: Sink ← TIM ← IGBT
  const igbtXs = [-0.11, 0.0, 0.11] as const
  const powerY = 0.7
  const sinkZ = 0.07
  const timZ = 0.028
  const igbtZ = -0.02

  cab.add(
    cloneNamedPart(parts.heatsink, `${id}_HeatSink`, {
      position: [0, powerY, sinkZ],
      rotation: [Math.PI / 2, 0, 0],
      scale: 0.62,
    }),
  )
  cab.add(box(0.4, 0.02, 0.06, mats.alu, [0, powerY - 0.12, sinkZ], `${id}_SinkBracket`))
  for (const x of [-0.16, 0.16] as const) {
    cab.add(cyl(0.006, 0.01, mats.steel, [x, powerY - 0.12, sinkZ - 0.02], [Math.PI / 2, 0, 0]))
  }

  for (let i = 0; i < 3; i++) {
    const n = String(i + 1).padStart(2, '0')
    const x = igbtXs[i]
    cab.add(
      cloneNamedPart(parts.igbt, `${id}_IGBT_${n}`, {
        position: [x, powerY, igbtZ],
        rotation: [Math.PI / 2, 0, 0],
        scale: 0.5,
      }),
    )
    cab.add(box(0.065, 0.0022, 0.05, mats.tim, [x, powerY, timZ], `${id}_TIM_IGBT_${n}`))
    cab.add(cyl(0.004, 0.008, mats.steel, [x - 0.025, powerY + 0.03, igbtZ - 0.01], [Math.PI / 2, 0, 0]))
    cab.add(cyl(0.004, 0.008, mats.steel, [x + 0.025, powerY + 0.03, igbtZ - 0.01], [Math.PI / 2, 0, 0]))
  }

  // LOWER CENTRE — Capacitor bank + thick busbars
  const capY = 0.46
  cab.add(box(0.32, 0.018, 0.09, mats.steel, [-0.05, capY - 0.09, 0.02], `${id}_CapBracket`))
  cab.add(
    cloneNamedPart(parts.capacitor, `${id}_Capacitor_01`, {
      position: [-0.15, capY, 0.0],
      rotation: [0, 0, 0],
      scale: 0.52,
    }),
  )
  cab.add(
    cloneNamedPart(parts.capacitor, `${id}_Capacitor_02`, {
      position: [0.02, capY, 0.0],
      rotation: [0, 0, 0],
      scale: 0.52,
    }),
  )
  cab.add(cyl(0.008, 0.02, mats.copper, [-0.15, capY + 0.07, 0.0]))
  cab.add(cyl(0.008, 0.02, mats.copper, [0.02, capY + 0.07, 0.0]))

  const busPos = new THREE.Group()
  busPos.name = `${id}_Busbar_Positive`
  busPos.position.set(-0.04, 0.56, -0.05)
  busPos.add(box(0.34, 0.012, 0.028, mats.copper, [0, 0, 0]))
  busPos.add(box(0.012, 0.12, 0.028, mats.copper, [0.14, 0.06, 0]))
  busPos.add(cyl(0.006, 0.014, mats.steel, [-0.12, 0.01, 0], [Math.PI / 2, 0, 0]))
  busPos.add(cyl(0.006, 0.014, mats.steel, [0.12, 0.01, 0], [Math.PI / 2, 0, 0]))
  busPos.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.name = `${id}_Busbar_Positive`
  })
  cab.add(busPos)

  const busNeg = new THREE.Group()
  busNeg.name = `${id}_Busbar_Negative`
  busNeg.position.set(-0.04, 0.54, 0.0)
  busNeg.add(box(0.34, 0.012, 0.028, mats.copper, [0, 0, 0]))
  busNeg.add(box(0.012, 0.1, 0.028, mats.copper, [0.16, -0.08, 0.02]))
  busNeg.add(cyl(0.006, 0.014, mats.steel, [-0.12, 0.01, 0], [Math.PI / 2, 0, 0]))
  busNeg.add(cyl(0.006, 0.014, mats.steel, [0.1, 0.01, 0], [Math.PI / 2, 0, 0]))
  busNeg.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.name = `${id}_Busbar_Negative`
  })
  cab.add(busNeg)

  cab.add(cyl(0.01, 0.035, mats.plastic, [-0.16, 0.53, -0.02]))
  cab.add(cyl(0.01, 0.035, mats.plastic, [0.08, 0.53, -0.02]))
  cab.add(box(0.08, 0.01, 0.02, mats.copper, [0.2, 0.42, -0.04]))

  // BOTTOM — DC / AC connections
  cab.add(box(0.13, 0.09, 0.065, mats.dark, [-0.26, 0.32, 0.0], `${id}_DCDisconnect`))
  cab.add(box(0.045, 0.028, 0.028, mats.orange, [-0.26, 0.37, -0.045]))
  cab.add(box(0.11, 0.07, 0.045, mats.plastic, [-0.1, 0.32, 0.0], `${id}_MPPTSection`))
  cab.add(box(0.15, 0.09, 0.065, mats.dark, [0.24, 0.32, 0.0], `${id}_ACOutputSection`))
  ;[-0.04, 0.02, 0.08].forEach((x) => {
    cab.add(box(0.026, 0.02, 0.02, mats.steel, [0.16 + x, 0.37, -0.045]))
  })
  cab.add(box(0.22, 0.012, 0.018, mats.steel, [0.08, 0.28, 0.04], `${id}_GroundBar`))
  cab.add(box(0.12, 0.04, 0.04, mats.dark, [0.0, 0.28, -0.02], `${id}_TerminalStrip`))

  // Raman fibre — CAD braid jacket + core/cladding optical path
  cab.add(buildRamanFibreAssembly(id, parts.opticFiber, mats))
  ;[
    [-0.34, 0.38, 0.0],
    [-0.34, 0.58, 0.01],
    [-0.16, 0.7, 0.04],
    [0.0, 0.7, 0.045],
    [0.16, 0.66, 0.03],
    [0.3, 0.4, -0.01],
  ].forEach((p, i) => {
    cab.add(box(0.014, 0.01, 0.01, mats.plastic, p as [number, number, number], `${id}_FibreClip_${i + 1}`))
  })
  cab.add(cyl(0.01, 0.022, mats.dark, [-0.36, 0.3, -0.04], [0, 0, Math.PI / 2], `${id}_FibreEntry`))
  cab.add(cyl(0.01, 0.022, mats.dark, [0.34, 0.28, -0.04], [0, 0, Math.PI / 2], `${id}_FibreExit`))

  g.add(cab)

  // DC string conduit from cabinet into the row trench (local +X → toward panels after yaw)
  const conduit = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.05, 0.48, -0.05),
        new THREE.Vector3(0.35, 0.35, 0.05),
        new THREE.Vector3(0.55, 0.2, 0.12),
        new THREE.Vector3(0.7, 0.08, 0.18),
      ]),
      16,
      0.028,
      8,
      false,
    ),
    mats.cable.clone(),
  )
  conduit.name = `${id}_Conduit`
  g.add(conduit)

  return g
}

function buildAcCombiner(mats: Mats) {
  const ac = new THREE.Group()
  ac.name = 'ACCombiner'
  // Near CableTrench_Main (x≈6), mid of the panel field
  const midZ = (ROW_ZS[0] + ROW_ZS[ROW_ZS.length - 1]) / 2
  ac.position.set(TRENCH_X1 - 0.35, 0, midZ)
  ac.rotation.y = -Math.PI / 2

  ac.add(box(0.1, 2.05, 0.1, mats.steel, [0.35, 1.02, 0.16], 'ACCombiner_Post'))
  ac.add(box(0.55, 0.06, 0.06, mats.steel, [0.05, 1.45, 0.12]))
  ac.add(box(0.55, 0.06, 0.06, mats.steel, [0.05, 0.95, 0.12]))
  ac.add(box(0.4, 0.58, 0.24, mats.body, [0, 1.2, 0], 'ACCombiner_Body'))

  const acHinge = new THREE.Group()
  acHinge.name = 'ACCombiner_DoorHinge'
  acHinge.position.set(-0.17, 1.2, 0.13)
  acHinge.userData.closedY = 0
  acHinge.userData.openY = 1.2
  const door = box(0.34, 0.5, 0.02, mats.glass, [0.17, 0, 0], 'ACCombiner_Door')
  acHinge.add(door)
  ac.add(acHinge)

  ac.add(box(0.28, 0.08, 0.08, mats.orange, [0, 1.32, 0.02]))
  ac.add(box(0.1, 0.12, 0.08, mats.dark, [-0.08, 1.15, 0.02]))
  ac.add(box(0.1, 0.12, 0.08, mats.body, [0.08, 1.15, 0.02]))
  ac.add(box(0.03, 0.03, 0.03, mats.steel, [0.16, 1.35, 0.14]))
  ac.add(box(0.03, 0.03, 0.03, mats.steel, [0.16, 1.08, 0.14]))

  ac.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.88, 0),
          new THREE.Vector3(0.05, 0.55, 0.08),
          new THREE.Vector3(0.25, 0.45, 0.12),
          new THREE.Vector3(0.35, 0.2, 0.16),
        ]),
        16,
        0.03,
        8,
        false,
      ),
      mats.cable.clone(),
    ),
  )

  return ac
}

function setDoorState(hinge: THREE.Object3D, open: boolean) {
  const y = open ? hinge.userData.openY : hinge.userData.closedY
  if (typeof y !== 'number') return
  hinge.rotation.y = y
}

/** Local-space explode offsets for internal parts (cabinet frame stays put) */
const EXPLODE_OFFSETS: Record<string, [number, number, number]> = {
  Door: [0, 0, -0.35],
  CoolingFan_01: [-0.12, 0.2, 0.08],
  CoolingFan_02: [-0.04, 0.2, 0.08],
  AirDuct: [-0.08, 0.16, 0.1],
  ExhaustPath: [-0.16, 0.06, 0.12],
  ControlPCB: [0.14, 0.08, -0.28],
  CommModule: [0.16, 0.04, -0.24],
  GateDriver: [0.1, 0.02, -0.26],
  IGBT_01: [-0.12, 0, -0.28],
  IGBT_02: [0, 0, -0.32],
  IGBT_03: [0.12, 0, -0.28],
  TIM_IGBT_01: [-0.12, 0.02, -0.16],
  TIM_IGBT_02: [0, 0.02, -0.18],
  TIM_IGBT_03: [0.12, 0.02, -0.16],
  HeatSink: [0, 0.04, 0.28],
  Capacitor_01: [-0.16, -0.1, -0.12],
  Capacitor_02: [0.02, -0.1, -0.12],
  Busbar_Positive: [0, -0.02, -0.22],
  Busbar_Negative: [0, -0.04, -0.2],
  DCDisconnect: [-0.12, -0.18, -0.14],
  MPPTSection: [-0.04, -0.16, -0.12],
  ACOutputSection: [0.12, -0.18, -0.12],
  RamanFibre: [0, 0, -0.14],
}

function partKey(fullName: string, unitId: string) {
  if (!fullName.startsWith(`${unitId}_`)) return null
  return fullName.slice(unitId.length + 1)
}

function ensureHome(obj: THREE.Object3D) {
  if (!obj.userData.homePos) {
    obj.userData.homePos = obj.position.clone()
  }
}

function applyExplode(unit: THREE.Object3D, unitId: string, exploded: boolean) {
  unit.traverse((obj) => {
    if (!obj.name.startsWith(unitId)) return
    const key = partKey(obj.name, unitId)
    if (!key) return
    // Match IGBT_01, HeatSink_Fin_1 → HeatSink, etc.
    let offset: [number, number, number] | undefined = EXPLODE_OFFSETS[key]
    if (!offset && key.startsWith('HeatSink')) offset = EXPLODE_OFFSETS.HeatSink
    if (!offset && key.startsWith('TIM_IGBT')) {
      const m = key.match(/^TIM_IGBT_\d{2}/)
      offset = m ? EXPLODE_OFFSETS[m[0]] : undefined
    }
    if (!offset && key.startsWith('IGBT')) {
      const m = key.match(/^IGBT_\d{2}/)
      offset = m ? EXPLODE_OFFSETS[m[0]] : undefined
    }
    if (!offset) return
    ensureHome(obj)
    const home = obj.userData.homePos as THREE.Vector3
    if (exploded) {
      obj.position.set(home.x + offset[0], home.y + offset[1], home.z + offset[2])
    } else {
      obj.position.copy(home)
    }
  })
}

function applyXray(unit: THREE.Object3D, unitId: string, on: boolean) {
  const shell = new Set([
    `${unitId}_Cabinet_Back`,
    `${unitId}_Cabinet_Left`,
    `${unitId}_Cabinet_Right`,
    `${unitId}_Cabinet_Top`,
    `${unitId}_Cabinet_Base`,
    `${unitId}_Cabinet_Stripe`,
    `${unitId}_Door`,
    `${unitId}_Vent`,
  ])
  unit.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh || !shell.has(mesh.name)) return
    const mat = mesh.material as THREE.MeshStandardMaterial
    if (!mat?.isMeshStandardMaterial) return
    if (on) {
      if (mat.userData._xraySaved == null) {
        mat.userData._xraySaved = {
          transparent: mat.transparent,
          opacity: mat.opacity,
          depthWrite: mat.depthWrite,
        }
      }
      mat.transparent = true
      mat.opacity = 0.18
      mat.depthWrite = false
      mat.needsUpdate = true
    } else if (mat.userData._xraySaved) {
      const s = mat.userData._xraySaved
      mat.transparent = s.transparent
      mat.opacity = s.opacity
      mat.depthWrite = s.depthWrite
      mat.needsUpdate = true
    }
  })
}

export default function StringInverter({
  selectedName,
  onSelect,
  activeUnitId,
  doorMode,
  exploded,
  xray,
  twin,
  tempOverlay,
  fibreOverlay,
  ramanPulse = false,
  focusInverterId = null,
}: Props) {
  const igbtGltf = useGLTF(INVERTER_PART_URLS.igbt)
  const heatsinkGltf = useGLTF(INVERTER_PART_URLS.heatsink)
  const capacitorGltf = useGLTF(INVERTER_PART_URLS.capacitor)
  const fanGltf = useGLTF(INVERTER_PART_URLS.coolingFan)
  const busbarGltf = useGLTF(INVERTER_PART_URLS.busbar)
  const opticFiberGltf = useGLTF(INVERTER_PART_URLS.opticFiber)

  const partTemplates = useMemo<InverterPartTemplates>(
    () => ({
      igbt: igbtGltf.scene,
      heatsink: heatsinkGltf.scene,
      capacitor: capacitorGltf.scene,
      coolingFan: fanGltf.scene,
      busbar: busbarGltf.scene,
      opticFiber: opticFiberGltf.scene,
    }),
    [
      igbtGltf.scene,
      heatsinkGltf.scene,
      capacitorGltf.scene,
      fanGltf.scene,
      busbarGltf.scene,
      opticFiberGltf.scene,
    ],
  )

  const cableMaps = useTexture({ ...CABLE_PBR_URLS })
  const mats = useMemo(() => {
    configureMap(cableMaps.map, 3, 1, true)
    configureMap(cableMaps.roughnessMap, 3, 1, false)
    configureMap(cableMaps.normalMap, 3, 1, false)
    configureMap(cableMaps.metalnessMap, 3, 1, false)
    const hmiMap = makeHmiTexture()
    return {
      steel: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        map: createMetalTexture('#8b939c', { weathered: true }),
        metalness: 0.28,
        roughness: 0.55,
        envMapIntensity: 0.4,
      }),
      body: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        map: createMetalTexture('#d8dce1', { weathered: true }),
        roughness: 0.58,
        metalness: 0.14,
        envMapIntensity: 0.35,
      }),
      dark: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        map: createMetalTexture('#2a2e34', { weathered: true }),
        roughness: 0.55,
        metalness: 0.18,
        envMapIntensity: 0.3,
      }),
      cable: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        map: cableMaps.map,
        roughnessMap: cableMaps.roughnessMap,
        normalMap: cableMaps.normalMap,
        metalnessMap: cableMaps.metalnessMap,
        roughness: 1,
        metalness: 0.3,
        envMapIntensity: 0.2,
        normalScale: new THREE.Vector2(0.8, 0.8),
      }),
      orange: new THREE.MeshStandardMaterial({
        color: '#e85d04',
        roughness: 0.5,
        metalness: 0.08,
        envMapIntensity: 0.25,
      }),
      plastic: new THREE.MeshStandardMaterial({
        color: '#18181c',
        roughness: 0.55,
        metalness: 0.05,
        envMapIntensity: 0.15,
      }),
      alu: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        map: createMetalTexture('#b0b6bc', { weathered: false }),
        metalness: 0.72,
        roughness: 0.42,
        envMapIntensity: 0.55,
      }),
      copper: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        map: createCopperTexture(),
        metalness: 0.88,
        roughness: 0.38,
        envMapIntensity: 0.45,
      }),
      pcb: new THREE.MeshStandardMaterial({
        color: '#0a4a28',
        roughness: 0.62,
        metalness: 0.04,
      }),
      fibre: new THREE.MeshStandardMaterial({
        color: '#2aa8c0',
        roughness: 0.48,
        metalness: 0.04,
      }),
      tim: new THREE.MeshStandardMaterial({
        color: '#5a616a',
        roughness: 0.78,
        metalness: 0.06,
        envMapIntensity: 0.15,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: '#5c6570',
        transparent: true,
        opacity: 0.35,
        roughness: 0.12,
        metalness: 0.1,
        envMapIntensity: 0.7,
      }),
      hmi: new THREE.MeshStandardMaterial({
        map: hmiMap,
        roughness: 0.5,
        metalness: 0.05,
      }),
    }
    // Depend on texture maps, not the wrapper object (new each render → door flicker).
  }, [cableMaps.map, cableMaps.roughnessMap, cableMaps.normalMap, cableMaps.metalnessMap])

  const row = useMemo(() => {
    const root = new THREE.Group()
    root.name = 'StringInverterRow'
    const positions = getStringInverterPositions()
    for (let i = 0; i < UNIT_COUNT; i++) {
      const unit = buildUnit(i, mats, partTemplates)
      const [x, y, z] = positions[i]
      unit.position.set(x, y, z)
      unit.rotation.y = UNIT_YAW
      root.add(unit)
    }
    root.add(buildAcCombiner(mats))
    return root
  }, [mats, partTemplates])

  // Open / close doors based on tools + selection
  useEffect(() => {
    for (let i = 0; i < UNIT_COUNT; i++) {
      const id = `StringInverter_${String(i + 1).padStart(2, '0')}`
      const hinge = row.getObjectByName(`${id}_DoorHinge`)
      if (!hinge) continue
      let open = false
      if (id === activeUnitId) {
        if (doorMode === 'open') open = true
        else if (doorMode === 'closed') open = false
        else open = shouldOpenDoor(selectedName, id) || exploded || xray
      } else {
        open = shouldOpenDoor(selectedName, id)
      }
      setDoorState(hinge, open)
    }

    const acHinge = row.getObjectByName('ACCombiner_DoorHinge')
    if (acHinge) {
      setDoorState(
        acHinge,
        selectedName === 'ACCombiner' || selectedName?.startsWith('ACCombiner_') === true,
      )
    }
  }, [row, selectedName, activeUnitId, doorMode, exploded, xray])

  // Exploded view — active inverter only
  useEffect(() => {
    for (let i = 0; i < UNIT_COUNT; i++) {
      const id = `StringInverter_${String(i + 1).padStart(2, '0')}`
      const unit = row.getObjectByName(id)
      if (unit) applyExplode(unit, id, exploded && id === activeUnitId)
    }
  }, [row, exploded, activeUnitId])

  // X-ray — active inverter only
  useEffect(() => {
    for (let i = 0; i < UNIT_COUNT; i++) {
      const id = `StringInverter_${String(i + 1).padStart(2, '0')}`
      const unit = row.getObjectByName(id)
      if (unit) applyXray(unit, id, xray && id === activeUnitId)
    }
  }, [row, xray, activeUnitId])

  // Highlight selected part
  useEffect(() => {
    row.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      if (mesh.name === '_TwinHotspot') return
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (!mat?.isMeshStandardMaterial) return

      let hit = false
      if (selectedName) {
        if (selectedName === 'StringInverter' || selectedName === 'StringInverterRow') {
          hit = obj.name.startsWith('StringInverter_')
        } else if (selectedName === 'ACCombiner' || selectedName.startsWith('ACCombiner_')) {
          hit = obj.name === 'ACCombiner' || obj.name.startsWith('ACCombiner_')
        } else if (selectedName.startsWith('StringInverter_')) {
          hit =
            obj.name === selectedName ||
            obj.name.startsWith(`${selectedName}_`)
          if (!hit && /^StringInverter_\d{2}$/.test(selectedName)) {
            let p: THREE.Object3D | null = obj
            while (p) {
              if (p.name === selectedName) {
                hit = true
                break
              }
              p = p.parent
            }
          }
        }
      }

      if (hit && !tempOverlay) {
        mat.emissive.set('#3db8a0')
        mat.emissiveIntensity = 0.25
      } else if (!tempOverlay && !mat.userData._twinSaved) {
        mat.emissive.set('#000000')
        mat.emissiveIntensity = 0
      }
    })
  }, [row, selectedName, tempOverlay])

  // Phase 3 — apply external twin telemetry (temp / hotspot / fibre)
  useEffect(() => {
    for (let i = 0; i < UNIT_COUNT; i++) {
      const id = `StringInverter_${String(i + 1).padStart(2, '0')}`
      const unit = row.getObjectByName(id)
      if (!unit) continue
      const inv = findInverter(twin, id)
      const comps = inv?.components

      const keys = [
        'IGBT_01',
        'IGBT_02',
        'IGBT_03',
        'TIM_IGBT_01',
        'TIM_IGBT_02',
        'TIM_IGBT_03',
        'HeatSink',
        'Capacitor_01',
        'Capacitor_02',
        'CoolingFan_01',
        'CoolingFan_02',
        'Busbar_Positive',
        'Busbar_Negative',
      ]
      for (const key of keys) {
        const parentKey = key.startsWith('TIM_IGBT_') ? key.replace('TIM_', '') : key
        const temp = comps?.[key]?.temperature ?? comps?.[parentKey]?.temperature ?? null
        applyComponentTemperature(unit, key, temp, tempOverlay && temp != null)

        const host = unit.getObjectByName(`${id}_${key}`)
        if (host) {
          const c = comps?.[key] ?? comps?.[parentKey]
          const showHot =
            tempOverlay &&
            c != null &&
            (c.hotspot_radius != null ||
              (c.temperature != null && c.temperature >= 65))
          applyHotspot(host, {
            enabled: !!showHot,
            radius: c?.hotspot_radius,
            position: c?.hotspot_position,
            temperature: c?.temperature,
          })
        }
      }

      const fibreRoot = unit.getObjectByName(`${id}_RamanFibre`)
      const fibreSense =
        (fibreRoot?.userData.senseMesh as THREE.Mesh | undefined) ??
        (fibreRoot?.getObjectByName(`${id}_RamanFibre_Cladding`) as THREE.Mesh | null)
      if (fibreSense?.isMesh) {
        applyFibreTemperature(fibreSense, comps?.RamanFibre, fibreOverlay)
      }
      if (fibreRoot) {
        const raman = comps?.RamanFibre
        applyHotspot(fibreRoot, {
          enabled:
            fibreOverlay &&
            raman != null &&
            (raman.hotspot_position != null ||
              (raman.max_temperature != null && raman.max_temperature >= 60)),
          radius: raman?.hotspot_radius ?? 0.07,
          position: raman?.hotspot_position,
          temperature: raman?.max_temperature,
        })
      }
    }
  }, [row, twin, tempOverlay, fibreOverlay])

  // Phase 4 — Raman pump + Stokes / anti-Stokes along the real fibre curve
  const pulsePhase = useRef(0)

  useFrame((_, dt) => {
    const unitId = focusInverterId ?? activeUnitId ?? 'StringInverter_01'
    const fibre = row.getObjectByName(`${unitId}_RamanFibre`)
    if (!fibre) return

    const curve = fibre.userData.fibreCurve as THREE.CatmullRomCurve3 | undefined
    const hotspotT = (fibre.userData.hotspotT as number | undefined) ?? 0.55
    const pump = fibre.getObjectByName('_RamanPump') as THREE.Mesh | null
    const stokes = fibre.getObjectByName('_RamanStokes') as THREE.Mesh | null
    const anti = fibre.getObjectByName('_RamanAntiStokes') as THREE.Mesh | null
    if (!curve || !pump || !stokes || !anti) return

    if (!ramanPulse) {
      pump.visible = stokes.visible = anti.visible = false
      pulsePhase.current = 0
      return
    }

    pulsePhase.current = (pulsePhase.current + dt * 0.28) % 1
    const p = pulsePhase.current
    const at = (t: number, offset = new THREE.Vector3()) => {
      const pt = curve.getPointAt(THREE.MathUtils.clamp(t, 0, 1))
      return pt.add(offset)
    }
    const radial = (t: number, amount: number) => {
      const tangent = curve.getTangentAt(THREE.MathUtils.clamp(t, 0, 1)).normalize()
      const side = new THREE.Vector3(0, 1, 0).cross(tangent)
      if (side.lengthSq() < 1e-8) side.set(1, 0, 0)
      side.normalize().multiplyScalar(amount)
      return side
    }

    if (p < 0.4) {
      // Pump travels in the core toward the far end
      const t = (p / 0.4) * Math.min(1, hotspotT + 0.25)
      pump.visible = true
      stokes.visible = false
      anti.visible = false
      pump.position.copy(at(t))
      pump.scale.setScalar(1)
      ;(pump.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.8
    } else if (p < 0.5) {
      // Scatter: expand from core into cladding at hotspot
      const u = (p - 0.4) / 0.1
      const r = 0.002 + u * 0.007
      pump.visible = true
      stokes.visible = u > 0.25
      anti.visible = u > 0.25
      pump.position.copy(at(hotspotT))
      pump.scale.setScalar(1 + u)
      stokes.position.copy(at(hotspotT, radial(hotspotT, r)))
      anti.position.copy(at(hotspotT, radial(hotspotT, -r)))
    } else {
      // Stokes + anti-Stokes return inside cladding/core to the interrogator end
      const u = (p - 0.5) / 0.5
      const t = hotspotT * (1 - u)
      const settle = Math.max(0, 1 - u * 3.5)
      pump.visible = false
      stokes.visible = true
      anti.visible = true
      stokes.position.copy(at(t, radial(t, settle * 0.004)))
      anti.position.copy(at(t, radial(t, -settle * 0.004)))
      ;(stokes.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.6 + u * 0.7
      ;(anti.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.8 + u * 0.8
    }
  })

  return (
    <primitive
      object={row}
      onClick={(e: { stopPropagation: () => void; object: THREE.Object3D }) => {
        e.stopPropagation()
        let best: string | null = null
        let o: THREE.Object3D | null = e.object
        while (o) {
          if (o.name.startsWith('StringInverter_') || o.name.startsWith('ACCombiner')) {
            best = o.name
          }
          o = o.parent
        }
        if (!best) {
          onSelect('StringInverter')
          return
        }
        if (best.startsWith('ACCombiner')) {
          onSelect('ACCombiner')
          return
        }
        onSelect(best)
      }}
    />
  )
}

useGLTF.preload(INVERTER_PART_URLS.igbt)
useGLTF.preload(INVERTER_PART_URLS.heatsink)
useGLTF.preload(INVERTER_PART_URLS.capacitor)
useGLTF.preload(INVERTER_PART_URLS.coolingFan)
useGLTF.preload(INVERTER_PART_URLS.busbar)
useGLTF.preload(INVERTER_PART_URLS.opticFiber)
