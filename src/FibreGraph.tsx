import { useEffect, useRef } from 'react'
import type { ActiveTwinState, GraphKind } from './digitalTwin/phase4Types'

type Props = {
  state: ActiveTwinState
  kind: GraphKind
}

function seriesFor(state: ActiveTwinState, kind: GraphKind): number[] {
  if (kind === 'stokes') return state.stokes_profile
  if (kind === 'antistokes') return state.anti_stokes_profile
  if (kind === 'ratio') return state.raman_ratio_profile
  return state.fibre_temperature_profile
}

function yLabel(kind: GraphKind) {
  if (kind === 'stokes') return 'Stokes (a.u.)'
  if (kind === 'antistokes') return 'Anti-Stokes (a.u.)'
  if (kind === 'ratio') return 'Raman ratio'
  return 'Temperature (°C)'
}

export default function FibreGraph({ state, kind }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(8, 12, 18, 0.9)'
    ctx.fillRect(0, 0, w, h)

    const pad = { l: 36, r: 10, t: 12, b: 24 }
    const plotW = w - pad.l - pad.r
    const plotH = h - pad.t - pad.b

    const y = seriesFor(state, kind)
    const x = state.fibre_distance_profile
    if (!y.length) {
      ctx.fillStyle = '#8fa3b8'
      ctx.font = '11px sans-serif'
      ctx.fillText('No profile data', pad.l, h / 2)
      return
    }

    const ymin = Math.min(...y)
    const ymax = Math.max(...y)
    const span = ymax - ymin || 1
    const xmin = x[0] ?? 0
    const xmax = x[x.length - 1] ?? 1

    const toX = (d: number) => pad.l + ((d - xmin) / (xmax - xmin || 1)) * plotW
    const toY = (v: number) => pad.t + (1 - (v - ymin) / span) * plotH

    // grid
    ctx.strokeStyle = 'rgba(140,170,200,0.12)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const gy = pad.t + (plotH * i) / 4
      ctx.beginPath()
      ctx.moveTo(pad.l, gy)
      ctx.lineTo(pad.l + plotW, gy)
      ctx.stroke()
    }

    // curve
    ctx.strokeStyle = state.is_predicted ? '#e2a34a' : '#3db8a0'
    ctx.lineWidth = 1.75
    ctx.beginPath()
    y.forEach((v, i) => {
      const dx = x[i] ?? (i / Math.max(1, y.length - 1)) * (xmax - xmin) + xmin
      const px = toX(dx)
      const py = toY(v)
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    })
    ctx.stroke()

    // hotspot marker
    const hx = toX(state.hotspot_position)
    ctx.strokeStyle = '#d4655a'
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(hx, pad.t)
    ctx.lineTo(hx, pad.t + plotH)
    ctx.stroke()
    ctx.setLineDash([])

    // max marker
    const maxIdx = y.indexOf(ymax)
    const mx = toX(x[maxIdx] ?? state.hotspot_position)
    const my = toY(ymax)
    ctx.fillStyle = '#e2a34a'
    ctx.beginPath()
    ctx.arc(mx, my, 3.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#8fa3b8'
    ctx.font = '10px ui-monospace, monospace'
    ctx.fillText(yLabel(kind), pad.l, 10)
    ctx.fillText(`${xmin.toFixed(1)} m`, pad.l, h - 6)
    ctx.fillText(`${xmax.toFixed(1)} m`, pad.l + plotW - 28, h - 6)
    ctx.fillText(ymax.toFixed(1), 4, pad.t + 8)
    ctx.fillText(ymin.toFixed(1), 4, pad.t + plotH)

    if (state.is_predicted) {
      ctx.fillStyle = '#e2a34a'
      ctx.fillText('Predicted', pad.l + plotW - 54, 10)
    }
  }, [state, kind])

  return <canvas ref={ref} className="fibre-graph" />
}
