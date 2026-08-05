import * as THREE from 'three'
import { sampleProfile, temperatureToColor, synthesizeProfile } from './temperature'
import type { TwinComponentData } from './types'

/** Colour Raman fibre vertices from a DTS temperature profile. */
export function applyFibreTemperature(
  fibre: THREE.Mesh,
  data: TwinComponentData | undefined,
  enabled: boolean,
) {
  const mat = fibre.material as THREE.MeshStandardMaterial
  if (!mat?.isMeshStandardMaterial) return

  if (!mat.userData._fibreSaved) {
    mat.userData._fibreSaved = {
      color: mat.color.clone(),
      emissive: mat.emissive.clone(),
      emissiveIntensity: mat.emissiveIntensity,
      vertexColors: mat.vertexColors,
    }
  }

  if (!enabled || !data) {
    const s = mat.userData._fibreSaved
    mat.color.copy(s.color)
    mat.emissive.copy(s.emissive)
    mat.emissiveIntensity = s.emissiveIntensity
    mat.vertexColors = s.vertexColors
    mat.needsUpdate = true
    return
  }

  const avg = data.average_temperature ?? data.T_fibre ?? 40
  const max = data.max_temperature ?? data.T_DTS ?? avg + 10
  const hotspot = data.hotspot_position ?? 3.8
  const profile =
    data.temperature_profile?.length
      ? data.temperature_profile
      : synthesizeProfile(avg, max, hotspot)

  const geo = fibre.geometry
  const uv = geo.attributes.uv
  const count = geo.attributes.position.count
  let colors = geo.getAttribute('color') as THREE.BufferAttribute | null
  if (!colors || colors.count !== count) {
    colors = new THREE.BufferAttribute(new Float32Array(count * 3), 3)
    geo.setAttribute('color', colors)
  }

  const c = new THREE.Color()
  for (let i = 0; i < count; i++) {
    // TubeGeometry: u along path
    const t = uv ? uv.getX(i) : i / Math.max(1, count - 1)
    temperatureToColor(sampleProfile(profile, t), 25, 85, c)
    colors.setXYZ(i, c.r, c.g, c.b)
  }
  colors.needsUpdate = true

  mat.vertexColors = true
  mat.color.set('#ffffff')
  mat.emissive.set('#111111')
  mat.emissiveIntensity = 0.35
  mat.needsUpdate = true
}
