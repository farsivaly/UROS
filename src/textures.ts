import * as THREE from 'three'

function makeCanvas(size: number) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  return { canvas, ctx }
}

function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function finishColor(tex: THREE.CanvasTexture, repeatX: number, repeatY: number) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeatX, repeatY)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

function finishData(tex: THREE.CanvasTexture, repeatX: number, repeatY: number) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeatX, repeatY)
  tex.colorSpace = THREE.NoColorSpace
  tex.anisotropy = 4
  tex.needsUpdate = true
  return tex
}

/** Multi-tone grass with dry patches, dirt, and colour breakup */
export function createGroundTexture() {
  const size = 1024
  const { canvas, ctx } = makeCanvas(size)
  const rnd = seededRand(42)

  const base = ctx.createLinearGradient(0, 0, size, size)
  base.addColorStop(0, '#4a6340')
  base.addColorStop(0.35, '#556f45')
  base.addColorStop(0.65, '#3f5736')
  base.addColorStop(1, '#5c784c')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  for (let i = 0; i < 48; i++) {
    const x = rnd() * size
    const y = rnd() * size
    const r = 40 + rnd() * 120
    const dry = rnd() > 0.55
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    if (dry) {
      g.addColorStop(0, `rgba(140, 125, 70, ${0.18 + rnd() * 0.2})`)
      g.addColorStop(1, 'rgba(140, 125, 70, 0)')
    } else {
      g.addColorStop(0, `rgba(${50 + rnd() * 40}, ${90 + rnd() * 50}, ${35 + rnd() * 25}, ${0.2 + rnd() * 0.2})`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
    }
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  for (let i = 0; i < 18; i++) {
    const x = rnd() * size
    const y = rnd() * size
    const r = 18 + rnd() * 40
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(${95 + rnd() * 30}, ${78 + rnd() * 20}, ${48 + rnd() * 15}, 0.45)`)
    g.addColorStop(1, 'rgba(90, 75, 45, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  for (let i = 0; i < 9000; i++) {
    const x = rnd() * size
    const y = rnd() * size
    const bright = rnd() > 0.5
    ctx.fillStyle = bright
      ? `rgba(${70 + rnd() * 60}, ${110 + rnd() * 70}, ${40 + rnd() * 35}, ${0.08 + rnd() * 0.18})`
      : `rgba(${30 + rnd() * 30}, ${45 + rnd() * 35}, ${20 + rnd() * 20}, ${0.1 + rnd() * 0.15})`
    ctx.fillRect(x, y, 1 + rnd() * 2, 1 + rnd() * 3)
  }

  ctx.strokeStyle = 'rgba(110, 100, 70, 0.12)'
  ctx.lineWidth = 28
  ctx.beginPath()
  ctx.moveTo(size * 0.1, 0)
  ctx.quadraticCurveTo(size * 0.35, size * 0.5, size * 0.2, size)
  ctx.stroke()

  return finishColor(new THREE.CanvasTexture(canvas), 10, 8)
}

export function createGroundRoughnessMap() {
  const size = 512
  const { canvas, ctx } = makeCanvas(size)
  const rnd = seededRand(77)
  ctx.fillStyle = '#c8c8c8'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 2000; i++) {
    const v = 150 + Math.floor(rnd() * 90)
    ctx.fillStyle = `rgb(${v},${v},${v})`
    ctx.beginPath()
    ctx.arc(rnd() * size, rnd() * size, 2 + rnd() * 10, 0, Math.PI * 2)
    ctx.fill()
  }
  return finishData(new THREE.CanvasTexture(canvas), 10, 8)
}

/** Compacted gravel service road with wheel marks and colour variation */
export function createGravelTexture() {
  const size = 512
  const { canvas, ctx } = makeCanvas(size)
  const rnd = seededRand(19)

  ctx.fillStyle = '#6a645c'
  ctx.fillRect(0, 0, size, size)

  // Soft tonal variation
  for (let i = 0; i < 30; i++) {
    const x = rnd() * size
    const y = rnd() * size
    const r = 30 + rnd() * 80
    const shade = 90 + rnd() * 50
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(${shade}, ${shade - 6}, ${shade - 14}, 0.35)`)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  }

  // Stones
  for (let i = 0; i < 5500; i++) {
    const x = rnd() * size
    const y = rnd() * size
    const r = 0.5 + rnd() * 2.4
    const shade = 85 + rnd() * 100
    const warm = rnd() > 0.7
    ctx.fillStyle = warm
      ? `rgb(${shade + 10}, ${shade - 5}, ${shade - 25})`
      : `rgb(${shade}, ${shade - 6}, ${shade - 14})`
    ctx.beginPath()
    ctx.ellipse(x, y, r, r * (0.6 + rnd() * 0.5), rnd() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }

  // Wheel ruts (parallel dark bands)
  for (const lane of [0.28, 0.72]) {
    ctx.strokeStyle = 'rgba(40, 38, 34, 0.22)'
    ctx.lineWidth = 14 + rnd() * 6
    ctx.beginPath()
    ctx.moveTo(size * lane + (rnd() - 0.5) * 8, 0)
    for (let y = 0; y < size; y += 40) {
      ctx.lineTo(size * lane + Math.sin(y * 0.04) * 5, y)
    }
    ctx.stroke()
    // lighter compacted centre of rut
    ctx.strokeStyle = 'rgba(160, 150, 135, 0.12)'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(size * lane, 0)
    ctx.lineTo(size * lane + 2, size)
    ctx.stroke()
  }

  // Edge blend darker (into grass)
  const edge = ctx.createLinearGradient(0, 0, size, 0)
  edge.addColorStop(0, 'rgba(70, 85, 50, 0.25)')
  edge.addColorStop(0.08, 'rgba(70, 85, 50, 0)')
  edge.addColorStop(0.92, 'rgba(70, 85, 50, 0)')
  edge.addColorStop(1, 'rgba(70, 85, 50, 0.25)')
  ctx.fillStyle = edge
  ctx.fillRect(0, 0, size, size)

  return finishColor(new THREE.CanvasTexture(canvas), 16, 5)
}

/** Weathered concrete with joints, stains, and colour variation */
export function createConcreteTexture() {
  const size = 512
  const { canvas, ctx } = makeCanvas(size)
  const rnd = seededRand(91)

  ctx.fillStyle = '#8e8a83'
  ctx.fillRect(0, 0, size, size)

  // Aggregate speckles
  for (let i = 0; i < 4000; i++) {
    const v = 110 + rnd() * 70
    ctx.fillStyle = `rgba(${v}, ${v - 3}, ${v - 8}, ${0.15 + rnd() * 0.25})`
    ctx.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 2, 1 + rnd() * 2)
  }

  // Colour mottling
  for (let i = 0; i < 25; i++) {
    const x = rnd() * size
    const y = rnd() * size
    const r = 20 + rnd() * 70
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    const warm = rnd() > 0.5
    g.addColorStop(
      0,
      warm
        ? `rgba(130, 115, 90, ${0.12 + rnd() * 0.15})`
        : `rgba(70, 75, 80, ${0.1 + rnd() * 0.12})`,
    )
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Expansion joints
  ctx.strokeStyle = 'rgba(45, 44, 40, 0.45)'
  ctx.lineWidth = 2.5
  for (let i = 1; i < 4; i++) {
    const y = (i / 4) * size + (rnd() - 0.5) * 4
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(size, y + (rnd() - 0.5) * 6)
    ctx.stroke()
  }
  for (let i = 1; i < 4; i++) {
    const x = (i / 4) * size + (rnd() - 0.5) * 4
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + (rnd() - 0.5) * 6, size)
    ctx.stroke()
  }

  // Oil / water stains
  for (let i = 0; i < 8; i++) {
    const x = rnd() * size
    const y = rnd() * size
    const r = 12 + rnd() * 35
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(55, 52, 45, ${0.18 + rnd() * 0.15})`)
    g.addColorStop(1, 'rgba(55, 52, 45, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  return finishColor(new THREE.CanvasTexture(canvas), 3, 3)
}

export function createConcreteRoughnessMap() {
  const size = 256
  const { canvas, ctx } = makeCanvas(size)
  ctx.fillStyle = '#b0b0b0'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 800; i++) {
    const v = 140 + Math.floor(Math.random() * 80)
    ctx.fillStyle = `rgb(${v},${v},${v})`
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2)
  }
  // Joints slightly smoother (darker in roughness = smoother if we invert... 
  // In Three.js roughnessMap: white = rough. Joints should be darker (smoother dirt).
  ctx.strokeStyle = '#707070'
  ctx.lineWidth = 3
  for (let i = 1; i < 4; i++) {
    ctx.beginPath()
    ctx.moveTo(0, (i / 4) * size)
    ctx.lineTo(size, (i / 4) * size)
    ctx.stroke()
  }
  return finishData(new THREE.CanvasTexture(canvas), 3, 3)
}

/**
 * Anti-reflective PV glass with cell grid — not mirror-like.
 * Moderate roughness; soft sheen only.
 */
export function createSolarCellTexture() {
  const size = 1024
  const { canvas, ctx } = makeCanvas(size)
  const rnd = seededRand(3)

  // AR blue glass base
  const base = ctx.createLinearGradient(0, 0, size, size)
  base.addColorStop(0, '#0a2868')
  base.addColorStop(0.4, '#061a48')
  base.addColorStop(0.75, '#0c3278')
  base.addColorStop(1, '#082456')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  const cols = 6
  const rows = 10
  const margin = 22
  const gap = 4
  const cellW = (size - margin * 2 - gap * (cols - 1)) / cols
  const cellH = (size - margin * 2 - gap * (rows - 1)) / rows

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = margin + col * (cellW + gap)
      const y = margin + row * (cellH + gap)

      const g = ctx.createLinearGradient(x, y, x + cellW, y + cellH)
      g.addColorStop(0, '#1554a8')
      g.addColorStop(0.4, '#0a2d70')
      g.addColorStop(0.75, '#071f52')
      g.addColorStop(1, '#124890')
      ctx.fillStyle = g
      ctx.fillRect(x, y, cellW, cellH)

      // Polycrystalline facets — low contrast
      for (let i = 0; i < 10; i++) {
        const px = x + rnd() * cellW
        const py = y + rnd() * cellH
        const pr = 3 + rnd() * 10
        ctx.fillStyle = `rgba(100, 160, 230, ${0.03 + rnd() * 0.06})`
        ctx.beginPath()
        ctx.moveTo(px, py - pr)
        ctx.lineTo(px + pr * 0.75, py)
        ctx.lineTo(px, py + pr)
        ctx.lineTo(px - pr * 0.75, py)
        ctx.closePath()
        ctx.fill()
      }

      // Busbars
      ctx.strokeStyle = 'rgba(200, 205, 215, 0.55)'
      ctx.lineWidth = 1.8
      for (let i = 1; i < 4; i++) {
        const bx = x + (cellW * i) / 4
        ctx.beginPath()
        ctx.moveTo(bx, y + 3)
        ctx.lineTo(bx, y + cellH - 3)
        ctx.stroke()
      }

      // Fingers
      ctx.strokeStyle = 'rgba(175, 190, 215, 0.22)'
      ctx.lineWidth = 0.7
      for (let i = 1; i < 14; i++) {
        const fy = y + (cellH * i) / 14
        ctx.beginPath()
        ctx.moveTo(x + 2, fy)
        ctx.lineTo(x + cellW - 2, fy)
        ctx.stroke()
      }
    }
  }

  // Frame rebate (dark)
  ctx.strokeStyle = 'rgba(22, 24, 28, 0.9)'
  ctx.lineWidth = 16
  ctx.strokeRect(8, 8, size - 16, size - 16)
  ctx.strokeStyle = 'rgba(140, 145, 155, 0.35)'
  ctx.lineWidth = 3
  ctx.strokeRect(16, 16, size - 32, size - 32)

  // Soft AR glass sheen — keep subtle
  const sheen = ctx.createLinearGradient(0, 0, size * 0.35, size)
  sheen.addColorStop(0, 'rgba(220, 235, 255, 0.1)')
  sheen.addColorStop(0.2, 'rgba(255,255,255,0.03)')
  sheen.addColorStop(0.5, 'rgba(255,255,255,0)')
  sheen.addColorStop(1, 'rgba(30, 70, 140, 0.04)')
  ctx.fillStyle = sheen
  ctx.fillRect(0, 0, size, size)

  // Dust / weathering film
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = `rgba(180, 175, 160, ${0.015 + rnd() * 0.03})`
    ctx.fillRect(rnd() * size, rnd() * size, 2 + rnd() * 6, 1 + rnd() * 2)
  }

  return finishColor(new THREE.CanvasTexture(canvas), 1, 1)
}

/**
 * Powder-coated painted steel — subtle scratches, edge wear, light dirt at base.
 * Pass `weathered: true` for outdoor cabinets.
 */
export function createMetalTexture(base: string, opts?: { weathered?: boolean }) {
  const size = 512
  const { canvas, ctx } = makeCanvas(size)
  const rnd = seededRand(base.split('').reduce((a, c) => a + c.charCodeAt(0), 11))
  const weathered = opts?.weathered ?? true

  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  // Soft spray mottling
  for (let i = 0; i < 40; i++) {
    const x = rnd() * size
    const y = rnd() * size
    const r = 15 + rnd() * 50
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(255,255,255,${0.02 + rnd() * 0.04})`)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Fine brush / powder texture lines
  for (let y = 0; y < size; y++) {
    const a = 0.012 + rnd() * 0.02
    ctx.fillStyle = rnd() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`
    ctx.fillRect(0, y, size, 1)
  }

  if (weathered) {
    // Micro scratches
    for (let i = 0; i < 60; i++) {
      ctx.strokeStyle = `rgba(255,255,255,${0.03 + rnd() * 0.05})`
      ctx.lineWidth = 0.5 + rnd()
      ctx.beginPath()
      const x = rnd() * size
      const y = rnd() * size
      ctx.moveTo(x, y)
      ctx.lineTo(x + 8 + rnd() * 40, y + (rnd() - 0.5) * 4)
      ctx.stroke()
    }
    // Edge wear (lighter metal showing)
    ctx.strokeStyle = 'rgba(200, 205, 210, 0.18)'
    ctx.lineWidth = 6
    ctx.strokeRect(3, 3, size - 6, size - 6)
    // Dirt near “base” (bottom of map)
    const dirt = ctx.createLinearGradient(0, size * 0.65, 0, size)
    dirt.addColorStop(0, 'rgba(60, 55, 45, 0)')
    dirt.addColorStop(1, 'rgba(55, 48, 38, 0.22)')
    ctx.fillStyle = dirt
    ctx.fillRect(0, 0, size, size)
  }

  return finishColor(new THREE.CanvasTexture(canvas), 2, 2)
}

export function createMetalRoughnessMap(weathered = true) {
  const size = 256
  const { canvas, ctx } = makeCanvas(size)
  ctx.fillStyle = weathered ? '#9a9a9a' : '#888888'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 400; i++) {
    const v = 100 + Math.floor(Math.random() * 100)
    ctx.fillStyle = `rgb(${v},${v},${v})`
    ctx.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 3, 1)
  }
  if (weathered) {
    const dirt = ctx.createLinearGradient(0, size * 0.7, 0, size)
    dirt.addColorStop(0, 'rgba(180,180,180,0)')
    dirt.addColorStop(1, 'rgba(210,210,210,0.8)')
    ctx.fillStyle = dirt
    ctx.fillRect(0, 0, size, size)
  }
  return finishData(new THREE.CanvasTexture(canvas), 2, 2)
}

export function createCopperTexture() {
  const size = 256
  const { canvas, ctx } = makeCanvas(size)
  const rnd = seededRand(55)
  const g = ctx.createLinearGradient(0, 0, size, size)
  g.addColorStop(0, '#d9924a')
  g.addColorStop(0.45, '#b87333')
  g.addColorStop(1, '#8a4f1f')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)

  for (let y = 0; y < size; y += 2) {
    ctx.fillStyle = `rgba(255,220,160,${0.04 + rnd() * 0.06})`
    ctx.fillRect(0, y, size, 1)
  }
  // Light oxidation mottling
  for (let i = 0; i < 20; i++) {
    const x = rnd() * size
    const y = rnd() * size
    const r = 8 + rnd() * 25
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r)
    gr.addColorStop(0, `rgba(60, 110, 90, ${0.08 + rnd() * 0.1})`)
    gr.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gr
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  return finishColor(new THREE.CanvasTexture(canvas), 3, 1)
}

/** Building / cabinet painted cladding */
export function createPaintedPanelTexture() {
  return createMetalTexture('#d4d9df', { weathered: true })
}

export type TextureKit = {
  ground: THREE.Texture
  groundRough: THREE.Texture
  groundNormal: THREE.Texture
  gravel: THREE.Texture
  gravelRough: THREE.Texture
  gravelNormal: THREE.Texture
  concrete: THREE.Texture
  concreteRough: THREE.Texture
  solar: THREE.Texture
  steel: THREE.Texture
  steelRough: THREE.Texture
  aluminium: THREE.Texture
  copper: THREE.Texture
  paint: THREE.Texture
}

/** Poly Haven sparse grass + gravelly sand (2K exports under /textures) */
export const SITE_PBR_URLS = {
  ground: '/textures/sparse_grass_diff.jpg',
  groundRough: '/textures/sparse_grass_rough.png',
  groundNormal: '/textures/sparse_grass_nor.png',
  gravel: '/textures/gravelly_sand_diff.jpg',
  gravelRough: '/textures/gravelly_sand_rough.png',
  gravelNormal: '/textures/gravelly_sand_nor.png',
} as const

export const ROCK_PBR_URLS = {
  map: '/textures/dark_rock_diff.jpg',
  roughnessMap: '/textures/dark_rock_rough.png',
  normalMap: '/textures/dark_rock_nor.png',
} as const

/** Poly Haven modular electric cables */
export const CABLE_PBR_URLS = {
  map: '/textures/cable_diff.jpg',
  roughnessMap: '/textures/cable_rough.png',
  normalMap: '/textures/cable_nor.png',
  metalnessMap: '/textures/cable_metal.png',
} as const

export const CABLE_BOX_PBR_URLS = {
  map: '/textures/cable_box_diff.jpg',
  roughnessMap: '/textures/cable_box_rough.png',
  normalMap: '/textures/cable_box_nor.png',
} as const

export function configureMap(
  tex: THREE.Texture,
  repeatX: number,
  repeatY: number,
  srgb: boolean,
) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeatX, repeatY)
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

export function buildTextureKit(site: {
  ground: THREE.Texture
  groundRough: THREE.Texture
  groundNormal: THREE.Texture
  gravel: THREE.Texture
  gravelRough: THREE.Texture
  gravelNormal: THREE.Texture
}): TextureKit {
  configureMap(site.ground, 14, 11, true)
  configureMap(site.groundRough, 14, 11, false)
  configureMap(site.groundNormal, 14, 11, false)
  configureMap(site.gravel, 18, 6, true)
  configureMap(site.gravelRough, 18, 6, false)
  configureMap(site.gravelNormal, 18, 6, false)

  return {
    ground: site.ground,
    groundRough: site.groundRough,
    groundNormal: site.groundNormal,
    gravel: site.gravel,
    gravelRough: site.gravelRough,
    gravelNormal: site.gravelNormal,
    concrete: createConcreteTexture(),
    concreteRough: createConcreteRoughnessMap(),
    solar: createSolarCellTexture(),
    steel: createMetalTexture('#5e656e', { weathered: true }),
    steelRough: createMetalRoughnessMap(true),
    aluminium: createMetalTexture('#b0b6bc', { weathered: false }),
    copper: createCopperTexture(),
    paint: createPaintedPanelTexture(),
  }
}

/** @deprecated procedural-only kit — prefer buildTextureKit with Poly Haven maps */
export function createTextureKit(): TextureKit {
  return buildTextureKit({
    ground: createGroundTexture(),
    groundRough: createGroundRoughnessMap(),
    groundNormal: createGroundRoughnessMap(),
    gravel: createGravelTexture(),
    gravelRough: createGroundRoughnessMap(),
    gravelNormal: createGroundRoughnessMap(),
  })
}
