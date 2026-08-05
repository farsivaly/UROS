import * as THREE from 'three'

/** Blue → green → yellow → orange → red for temperature (°C). */
export function temperatureToColor(
  tempC: number,
  tMin = 25,
  tMax = 85,
  target = new THREE.Color(),
): THREE.Color {
  const t = THREE.MathUtils.clamp((tempC - tMin) / (tMax - tMin), 0, 1)
  if (t < 0.25) {
    return target.setRGB(0.15, 0.35 + t * 2.2, 0.95)
  }
  if (t < 0.45) {
    const u = (t - 0.25) / 0.2
    return target.setRGB(0.15 + u * 0.15, 0.75 + u * 0.15, 0.55 - u * 0.4)
  }
  if (t < 0.65) {
    const u = (t - 0.45) / 0.2
    return target.setRGB(0.35 + u * 0.55, 0.9 - u * 0.15, 0.15)
  }
  if (t < 0.85) {
    const u = (t - 0.65) / 0.2
    return target.setRGB(0.95, 0.65 - u * 0.35, 0.08)
  }
  const u = (t - 0.85) / 0.15
  return target.setRGB(0.95, 0.28 - u * 0.2, 0.06)
}

/** Health % → status colour (blue/green/yellow/orange/red). */
export function healthToColor(
  healthPct: number,
  target = new THREE.Color(),
): THREE.Color {
  if (healthPct >= 97) return target.set('#4a9fff')
  if (healthPct >= 90) return target.set('#5cb87a')
  if (healthPct >= 75) return target.set('#e2a34a')
  if (healthPct >= 55) return target.set('#e07a3a')
  return target.set('#d4655a')
}

export function healthTone(healthPct: number): 'ok' | 'warn' | 'danger' {
  if (healthPct < 70) return 'danger'
  if (healthPct < 90) return 'warn'
  return 'ok'
}

export function sampleProfile(profile: number[], t: number): number {
  if (!profile.length) return 40
  if (profile.length === 1) return profile[0]
  const x = THREE.MathUtils.clamp(t, 0, 1) * (profile.length - 1)
  const i = Math.floor(x)
  const f = x - i
  const a = profile[i]
  const b = profile[Math.min(i + 1, profile.length - 1)]
  return a + (b - a) * f
}

/** Build a placeholder DTS profile from max / avg / hotspot position. */
export function synthesizeProfile(
  avg: number,
  max: number,
  hotspotPos: number,
  length = 12.4,
  samples = 32,
): number[] {
  const peakT = THREE.MathUtils.clamp(hotspotPos / length, 0.05, 0.95)
  const out: number[] = []
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1)
    const d = Math.abs(t - peakT)
    const bump = Math.exp(-(d * d) / 0.012) * (max - avg)
    out.push(avg + bump)
  }
  return out
}
