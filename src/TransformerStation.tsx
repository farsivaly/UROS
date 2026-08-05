import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { createConcreteTexture, createMetalTexture } from './textures'

type Props = {
  position?: [number, number, number]
  selectedName: string | null
  onSelect: (name: string | null) => void
}

/** Matches string-inverter exterior: light cabinet body + orange safety stripe + dark accents. */
function makeMeshTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#2a2e34'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#3a4048'
  for (let y = 2; y < size; y += 4) {
    for (let x = 2; x < size; x += 4) {
      ctx.fillRect(x, y, 2, 2)
    }
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(6, 10)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function Box({
  args,
  position,
  rotation,
  material,
  name,
}: {
  args: [number, number, number]
  position: [number, number, number]
  rotation?: [number, number, number]
  material: THREE.Material
  name?: string
}) {
  return (
    <mesh
      name={name}
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
      material={material}
    >
      <boxGeometry args={args} />
    </mesh>
  )
}

export default function TransformerStation({
  position = [16, 0, 14],
  selectedName,
  onSelect,
}: Props) {
  const selected =
    selectedName === 'InverterStation' ||
    selectedName === 'Transformer' ||
    selectedName === 'InverterCabinet' ||
    (!!selectedName && selectedName.startsWith('Inverter'))

  const mats = useMemo(() => {
    const concreteMap = createConcreteTexture()
    const bodyMap = createMetalTexture('#d8dce1', { weathered: true })
    const darkMap = createMetalTexture('#2a2e34', { weathered: true })
    const steelMap = createMetalTexture('#8b939c', { weathered: true })
    return {
      pad: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        map: concreteMap,
        roughness: 0.9,
        metalness: 0.02,
        envMapIntensity: 0.12,
      }),
      body: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        map: bodyMap,
        roughness: 0.58,
        metalness: 0.14,
        envMapIntensity: 0.35,
      }),
      dark: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        map: darkMap,
        roughness: 0.55,
        metalness: 0.18,
        envMapIntensity: 0.3,
      }),
      steel: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        map: steelMap,
        roughness: 0.55,
        metalness: 0.28,
        envMapIntensity: 0.4,
      }),
      orange: new THREE.MeshStandardMaterial({
        color: '#e85d04',
        roughness: 0.5,
        metalness: 0.08,
        envMapIntensity: 0.25,
      }),
      mesh: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        map: makeMeshTexture(),
        roughness: 0.72,
        metalness: 0.18,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: '#1c2430',
        roughness: 0.18,
        metalness: 0.15,
        envMapIntensity: 0.55,
      }),
    }
  }, [])

  useEffect(() => {
    Object.values(mats).forEach((mat) => {
      if (selected) {
        mat.emissive = new THREE.Color('#2f9f8a')
        mat.emissiveIntensity = 0.18
      } else {
        mat.emissive = new THREE.Color('#000000')
        mat.emissiveIntensity = 0
      }
    })
  }, [mats, selected])

  const switchgear = (x: number, mirror: boolean) => (
    <group position={[x, 0, 0]} scale={[mirror ? -1 : 1, 1, 1]}>
      <Box args={[2.4, 2.15, 2.1]} position={[0, 1.25, 0]} material={mats.body} name="InverterCabinet" />
      {/* orange safety stripe — matches string inverter exterior */}
      <Box args={[2.42, 0.06, 2.12]} position={[0, 0.55, 0]} material={mats.orange} />
      <Box args={[2.35, 0.12, 0.06]} position={[0, 2.25, 1.06]} material={mats.mesh} />
      <Box args={[0.02, 1.7, 0.03]} position={[-0.4, 1.15, 1.06]} material={mats.dark} />
      <Box args={[0.02, 1.7, 0.03]} position={[0.45, 1.15, 1.06]} material={mats.dark} />
      <Box args={[0.05, 1.4, 0.55]} position={[1.21, 1.2, 0.15]} material={mats.mesh} />
      <Box args={[0.35, 0.55, 0.04]} position={[-0.95, 1.45, 1.07]} material={mats.dark} />
      <Box args={[0.22, 0.16, 0.03]} position={[-0.95, 1.58, 1.1]} material={mats.glass} />
      <Box args={[0.06, 0.06, 0.03]} position={[-1.05, 1.3, 1.1]} material={mats.orange} />
      <Box args={[0.06, 0.06, 0.03]} position={[-0.95, 1.3, 1.1]} material={mats.orange} />
      <Box args={[0.06, 0.06, 0.03]} position={[-0.85, 1.3, 1.1]} material={mats.body} />
    </group>
  )

  return (
    <group
      name="InverterStation"
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onSelect('InverterStation')
      }}
    >
      <Box args={[9.2, 0.28, 3.2]} position={[0, 0.14, 0]} material={mats.pad} name="InverterStation_Pad" />

      {switchgear(-3.1, false)}

      {/* MV transformer — same exterior language as string inverters */}
      <group position={[0, 0, -0.15]} name="Transformer">
        <Box args={[2.6, 2.35, 2.35]} position={[0, 1.35, 0]} material={mats.body} />
        <Box args={[2.62, 0.07, 2.37]} position={[0, 0.58, 0]} material={mats.orange} />
        <Box args={[2.55, 0.1, 2.3]} position={[0, 2.48, 0]} material={mats.dark} />
        {Array.from({ length: 11 }).map((_, i) => (
          <Box
            key={i}
            args={[0.06, 1.7, 0.85]}
            position={[-1.0 + i * 0.2, 1.2, 1.05]}
            material={mats.steel}
          />
        ))}
        <Box args={[1.0, 0.55, 0.55]} position={[-1.85, 1.55, 0.1]} material={mats.dark} />
        <Box args={[1.0, 0.55, 0.55]} position={[1.85, 1.55, 0.1]} material={mats.dark} />
        {/* bushings */}
        <Box args={[0.18, 0.35, 0.18]} position={[-0.55, 2.7, 0]} material={mats.dark} />
        <Box args={[0.18, 0.35, 0.18]} position={[0.55, 2.7, 0]} material={mats.dark} />
      </group>

      {switchgear(3.1, true)}
    </group>
  )
}
