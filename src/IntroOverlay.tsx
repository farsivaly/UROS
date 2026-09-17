import { Fragment, useEffect, useState, type ReactNode } from 'react'
import {
  EARTH_CREDIT,
  INTRO_STEPS,
  type IntroCounter,
  type IntroInlineRef,
  type IntroStepId,
} from './introContent'

type Props = {
  stepIndex: number
  onStepIndex: (i: number) => void
  onStartLearning: () => void
  onSkipExpert: () => void
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

function formatCount(value: number, decimals = 0) {
  if (decimals > 0) return value.toFixed(decimals)
  return Math.round(value).toLocaleString('en-GB')
}

function Cited({ children, reference }: { children: ReactNode; reference: string }) {
  return (
    <span className="intro-cite" tabIndex={0}>
      {children}
      <span className="intro-cite-tip" role="tooltip">
        {reference}
      </span>
    </span>
  )
}

/** Wrap first occurrence of each ref text with a hover citation. */
function renderWithRefs(text: string, refs?: IntroInlineRef[]): ReactNode {
  if (!refs?.length) return text

  type Piece = { text: string; reference?: string }
  let pieces: Piece[] = [{ text }]

  for (const ref of refs) {
    const next: Piece[] = []
    for (const piece of pieces) {
      if (piece.reference || !piece.text.includes(ref.text)) {
        next.push(piece)
        continue
      }
      const idx = piece.text.indexOf(ref.text)
      const before = piece.text.slice(0, idx)
      const after = piece.text.slice(idx + ref.text.length)
      if (before) next.push({ text: before })
      next.push({ text: ref.text, reference: ref.reference })
      if (after) next.push({ text: after })
    }
    pieces = next
  }

  return pieces.map((p, i) =>
    p.reference ? (
      <Cited key={`${p.text}-${i}`} reference={p.reference}>
        {p.text}
      </Cited>
    ) : (
      <Fragment key={`${p.text}-${i}`}>{p.text}</Fragment>
    ),
  )
}

function IntroCounters({ counters, playKey }: { counters: IntroCounter[]; playKey: number }) {
  const [values, setValues] = useState(() => counters.map(() => 0))

  useEffect(() => {
    setValues(counters.map(() => 0))
    let raf = 0
    const start = performance.now()
    const durations = counters.map((c) => c.durationMs ?? 1600)

    const tick = (now: number) => {
      const next = counters.map((c, i) => {
        const t = Math.min(1, (now - start) / durations[i])
        return c.value * easeOutCubic(t)
      })
      setValues(next)
      if (next.some((v, i) => v < counters[i].value - 1e-6)) {
        raf = requestAnimationFrame(tick)
      } else {
        setValues(counters.map((c) => c.value))
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [counters, playKey])

  return (
    <div className="intro-counters" aria-live="polite">
      {counters.map((c, i) => {
        const valueNode = (
          <>
            {c.prefix}
            {formatCount(values[i] ?? 0, c.decimals)}
            {c.suffix}
          </>
        )
        return (
          <div key={c.label} className="intro-counter">
            <div className="intro-counter-value">
              {c.reference ? <Cited reference={c.reference}>{valueNode}</Cited> : valueNode}
            </div>
            <div className="intro-counter-label">{c.label}</div>
          </div>
        )
      })}
    </div>
  )
}

export default function IntroOverlay({
  stepIndex,
  onStepIndex,
  onStartLearning,
  onSkipExpert,
}: Props) {
  const step = INTRO_STEPS[Math.min(stepIndex, INTRO_STEPS.length - 1)]
  const isLast = step.id === ('start' satisfies IntroStepId)
  const progress = ((stepIndex + 1) / INTRO_STEPS.length) * 100

  return (
    <div className="intro-overlay">
      <div className="intro-sheet">
        <div className="intro-card">
          <div className="intro-progress" aria-hidden>
            <div className="intro-progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <p className="intro-kicker">
            Step {stepIndex + 1} / {INTRO_STEPS.length}
          </p>
          <h1 className="intro-headline">{step.headline}</h1>
          <p className="intro-body">{renderWithRefs(step.body, step.refs)}</p>

          {step.counters && step.counters.length > 0 ? (
            <IntroCounters counters={step.counters} playKey={stepIndex} />
          ) : (
            <p className="intro-stat">{renderWithRefs(step.stat, step.refs)}</p>
          )}

          <div className="intro-actions">
            <button
              type="button"
              className="tool-btn"
              disabled={stepIndex === 0}
              onClick={() => onStepIndex(Math.max(0, stepIndex - 1))}
            >
              Back
            </button>
            {!isLast ? (
              <button
                type="button"
                className="tool-btn primary learn-primary"
                onClick={() => onStepIndex(Math.min(INTRO_STEPS.length - 1, stepIndex + 1))}
              >
                Next →
              </button>
            ) : (
              <>
                <button type="button" className="tool-btn primary learn-primary" onClick={onStartLearning}>
                  Start Learning
                </button>
                <button type="button" className="tool-btn" onClick={onSkipExpert}>
                  Expert Mode
                </button>
              </>
            )}
          </div>

          <button type="button" className="intro-skip" onClick={onSkipExpert}>
            Skip intro
          </button>
          <a className="intro-skip" href="#/">
            Research home
          </a>
        </div>

        <footer className="intro-credit">
          <span>
            Earth model:{' '}
            <a href={EARTH_CREDIT.url} target="_blank" rel="noopener noreferrer">
              {EARTH_CREDIT.title}
            </a>{' '}
            by {EARTH_CREDIT.author} ·{' '}
            <a href={EARTH_CREDIT.licenseUrl} target="_blank" rel="noopener noreferrer">
              {EARTH_CREDIT.license}
            </a>
          </span>
        </footer>
      </div>
    </div>
  )
}
