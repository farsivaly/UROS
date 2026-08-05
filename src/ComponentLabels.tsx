import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { findInverter, type TwinSnapshot } from './digitalTwin'

export type LabelMode = 'none' | 'names' | 'temp' | 'health'

type LabelDef = {
  suffix: string
  title: string
  twinKey: string
  angleDeg: number
  radius: number
}

const LABEL_DEFS: LabelDef[] = [
  { suffix: 'HeatSink', title: 'Heat Sink', twinKey: 'HeatSink', angleDeg: 70, radius: 1.65 },
  { suffix: 'IGBT_02', title: 'IGBT Module', twinKey: 'IGBT_02', angleDeg: 150, radius: 1.6 },
  { suffix: 'TIM_IGBT_02', title: 'TIM', twinKey: 'IGBT_02', angleDeg: -150, radius: 1.5 },
  { suffix: 'CoolingFan_01', title: 'Cooling Fan', twinKey: 'CoolingFan_01', angleDeg: 115, radius: 1.55 },
  { suffix: 'Capacitor_01', title: 'DC-Link Capacitor', twinKey: 'Capacitor_01', angleDeg: -90, radius: 1.55 },
  { suffix: 'RamanFibre', title: 'Raman DTS Fibre', twinKey: 'RamanFibre', angleDeg: 25, radius: 1.7 },
  { suffix: 'ControlPCB', title: 'Control PCB', twinKey: 'ControlPCB', angleDeg: -20, radius: 1.55 },
]

const Y_UP = new THREE.Vector3(0, 1, 0)

type Props = {
  unitId: string
  twin: TwinSnapshot | null
  visible: boolean
  mode: LabelMode
}

function PartLabel({
  unitId,
  objectName,
  title,
  lines,
  angleDeg,
  radius,
}: {
  unitId: string
  objectName: string
  title: string
  lines: string[]
  angleDeg: number
  radius: number
}) {
  const { scene, size } = useThree()
  const labelGroup = useRef<THREE.Group>(null)
  const tmpRight = useRef(new THREE.Vector3())
  const tmpUp = useRef(new THREE.Vector3())
  const tmpFront = useRef(new THREE.Vector3())
  const hub = useRef(new THREE.Vector3())
  const anchor = useRef(new THREE.Vector3())
  const tip = useRef(new THREE.Vector3())
  const dir = useRef(new THREE.Vector3())
  const positions = useRef(new Float32Array(6))

  const { lineObj, arrowObj } = useMemo(() => {
    const geom = new LineGeometry()
    geom.setPositions([0, 0, 0, 0, 0.2, 0])
    const mat = new LineMaterial({
      color: '#0a0a0a',
      linewidth: 3.5,
      transparent: true,
      opacity: 1,
      depthTest: false,
      worldUnits: false,
    })
    mat.resolution.set(size.width, size.height)
    const line = new Line2(geom, mat)
    line.renderOrder = 20
    line.frustumCulled = false

    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.04, 0.1, 12),
      new THREE.MeshBasicMaterial({
        color: '#0a0a0a',
        depthTest: false,
      }),
    )
    arrow.renderOrder = 21
    arrow.frustumCulled = false

    return { lineObj: line, arrowObj: arrow }
  }, [size.height, size.width])

  useFrame(() => {
    const unit = scene.getObjectByName(unitId)
    const obj = scene.getObjectByName(objectName)
    if (!unit || !obj || !labelGroup.current) {
      if (labelGroup.current) labelGroup.current.visible = false
      lineObj.visible = false
      arrowObj.visible = false
      return
    }

    labelGroup.current.visible = true
    lineObj.visible = true
    arrowObj.visible = true
    ;(lineObj.material as LineMaterial).resolution.set(size.width, size.height)

    unit.updateWorldMatrix(true, false)
    tmpRight.current.set(1, 0, 0).transformDirection(unit.matrixWorld).normalize()
    tmpUp.current.set(0, 1, 0).transformDirection(unit.matrixWorld).normalize()
    tmpFront.current.set(0, 0, -1).transformDirection(unit.matrixWorld).normalize()

    const box = new THREE.Box3().setFromObject(unit)
    box.getCenter(hub.current)
    hub.current.addScaledVector(tmpFront.current, 0.22)

    obj.getWorldPosition(anchor.current)

    const theta = (angleDeg * Math.PI) / 180
    tip.current
      .copy(hub.current)
      .addScaledVector(tmpRight.current, Math.cos(theta) * radius)
      .addScaledVector(tmpUp.current, Math.sin(theta) * radius)
      .addScaledVector(tmpFront.current, 0.55 + Math.abs(Math.sin(theta)) * 0.15)

    // Straight leader: label → component
    const p = positions.current
    p[0] = tip.current.x
    p[1] = tip.current.y
    p[2] = tip.current.z
    p[3] = anchor.current.x
    p[4] = anchor.current.y
    p[5] = anchor.current.z
    ;(lineObj.geometry as LineGeometry).setPositions(p as unknown as number[])
    lineObj.computeLineDistances()

    labelGroup.current.position.copy(tip.current)

    dir.current.subVectors(anchor.current, tip.current).normalize()
    arrowObj.position.copy(anchor.current).addScaledVector(dir.current, -0.05)
    arrowObj.quaternion.setFromUnitVectors(Y_UP, dir.current)
  })

  const side = Math.cos((angleDeg * Math.PI) / 180) >= 0 ? 'branch-right' : 'branch-left'

  return (
    <group>
      <primitive object={lineObj} />
      <primitive object={arrowObj} />
      <group ref={labelGroup}>
        <Html center distanceFactor={9} style={{ pointerEvents: 'none' }} zIndexRange={[50, 0]}>
          <div className={`comp-label mindmap ${side}`}>
            <div className="comp-label-title">{title}</div>
            {lines.map((line) => (
              <div key={line} className="comp-label-meta">
                {line}
              </div>
            ))}
          </div>
        </Html>
      </group>
    </group>
  )
}

export default function ComponentLabels({ unitId, twin, visible, mode }: Props) {
  if (!visible || mode === 'none') return null

  const inv = findInverter(twin, unitId)

  return (
    <group name="ComponentLabels">
      {LABEL_DEFS.map((def) => {
        const name = `${unitId}_${def.suffix}`
        const comp = inv?.components?.[def.twinKey]
        const lines: string[] = []
        if (mode === 'temp' || mode === 'health') {
          const t = comp?.temperature ?? comp?.average_temperature ?? comp?.T_fibre
          if (typeof t === 'number') lines.push(`${t.toFixed(1)} °C`)
        }
        if (mode === 'health') {
          const h = comp?.health ?? (def.twinKey === 'RamanFibre' ? inv?.health : undefined)
          if (typeof h === 'number') lines.push(`Health: ${h}%`)
        }
        return (
          <PartLabel
            key={def.suffix}
            unitId={unitId}
            objectName={name}
            title={def.title}
            lines={lines}
            angleDeg={def.angleDeg}
            radius={def.radius}
          />
        )
      })}
    </group>
  )
}
