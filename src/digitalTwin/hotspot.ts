import * as THREE from 'three'
import { temperatureToColor } from './temperature'

const HOTSPOT_NAME = '_TwinHotspot'

/** Localised hotspot — small relative to the host component (remake §13). */
export function applyHotspot(
  host: THREE.Object3D,
  opts: {
    enabled: boolean
    position?: number
    radius?: number
    temperature?: number
  },
) {
  let overlay = host.getObjectByName(HOTSPOT_NAME) as THREE.Mesh | undefined

  if (!opts.enabled) {
    if (overlay) overlay.visible = false
    return
  }

  // Twin data uses larger absolute radii; map into a local patch (≈6–25% of a module)
  const raw = opts.radius ?? 0.08
  const radius = Math.min(0.03, Math.max(0.007, raw * 0.12))
  if (!overlay) {
    overlay = new THREE.Mesh(
      new THREE.CircleGeometry(1, 24),
      new THREE.MeshStandardMaterial({
        color: '#ff3300',
        emissive: '#ff2200',
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    overlay.name = HOTSPOT_NAME
    overlay.renderOrder = 2
    host.add(overlay)
  }

  overlay.visible = true
  overlay.scale.setScalar(radius)
  // Sit slightly in front of the component face
  const along = opts.position ?? 0
  overlay.position.set(0, 0, 0.02 + Math.min(0.04, along * 0.01))
  overlay.rotation.x = -Math.PI / 2

  const mat = overlay.material as THREE.MeshStandardMaterial
  if (opts.temperature != null) {
    const c = temperatureToColor(opts.temperature)
    mat.color.copy(c)
    mat.emissive.copy(c)
    mat.emissiveIntensity = 0.9 + Math.min(1.0, (opts.temperature - 40) / 50)
  }
}

/** Tint a component material from temperature without recreating the material. */
export function applyComponentTemperature(
  root: THREE.Object3D,
  componentKey: string,
  tempC: number | null,
  enabled: boolean,
) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh || !mesh.name.includes(componentKey)) return
    // Skip hotspot child
    if (mesh.name === HOTSPOT_NAME) return
    const mat = mesh.material as THREE.MeshStandardMaterial
    if (!mat?.isMeshStandardMaterial) return

    if (!mat.userData._twinSaved) {
      mat.userData._twinSaved = {
        color: mat.color.clone(),
        emissive: mat.emissive.clone(),
        emissiveIntensity: mat.emissiveIntensity,
        map: mat.map,
      }
    }

    if (!enabled || tempC == null) {
      const s = mat.userData._twinSaved
      mat.color.copy(s.color)
      mat.emissive.copy(s.emissive)
      mat.emissiveIntensity = s.emissiveIntensity
      return
    }

    const c = temperatureToColor(tempC)
    mat.color.copy(c)
    mat.emissive.copy(c)
    mat.emissiveIntensity = 0.15 + Math.min(0.55, (tempC - 30) / 80)
  })
}
