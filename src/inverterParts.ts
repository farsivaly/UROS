import * as THREE from 'three'

export const INVERTER_PART_URLS = {
  igbt: '/models/inverter_parts/glb/igbt.glb',
  heatsink: '/models/inverter_parts/glb/heatsink.glb',
  capacitor: '/models/inverter_parts/glb/capacitor.glb',
  coolingFan: '/models/inverter_parts/glb/cooling_fan.glb',
  busbar: '/models/inverter_parts/glb/busbar.glb',
  opticFiber: '/models/inverter_parts/glb/optic_fiber.glb',
} as const

export type InverterPartTemplates = {
  [K in keyof typeof INVERTER_PART_URLS]: THREE.Object3D
}

/** Deep-clone a CAD part, name it for twin IDs / picking, and shareable materials. */
export function cloneNamedPart(
  template: THREE.Object3D,
  name: string,
  opts?: {
    position?: [number, number, number]
    rotation?: [number, number, number]
    scale?: number | [number, number, number]
  },
) {
  const root = new THREE.Group()
  root.name = name

  const cloned = template.clone(true)
  cloned.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    mesh.name = name
    mesh.castShadow = true
    mesh.receiveShadow = true
    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((m) => m.clone())
    } else if (mesh.material) {
      mesh.material = mesh.material.clone()
    }
  })
  root.add(cloned)

  if (opts?.position) root.position.set(...opts.position)
  if (opts?.rotation) root.rotation.set(...opts.rotation)
  if (opts?.scale != null) {
    if (typeof opts.scale === 'number') root.scale.setScalar(opts.scale)
    else root.scale.set(...opts.scale)
  }

  return root
}
