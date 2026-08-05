import { useEffect, useState } from 'react'
import { EARTH_CREDIT, INTRO_STEPS, type IntroCounter, type IntroStepId } from './introContent'

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
      {counters.map((c, i) => (
        <div key={c.label} className="intro-counter">
          <div className="intro-counter-value">
            {c.prefix}
            {formatCount(values[i] ?? 0, c.decimals)}
            {c.suffix}
          </div>
          <div className="intro-counter-label">{c.label}</div>
        </div>
      ))}
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
      <div className="intro-card">
        <div className="intro-progress" aria-hidden>
          <div className="intro-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <p className="intro-kicker">
          Step {stepIndex + 1} / {INTRO_STEPS.length}
        </p>
        <h1 className="intro-headline">{step.headline}</h1>
        <p className="intro-body">{step.body}</p>

        {step.counters && step.counters.length > 0 ? (
          <IntroCounters counters={step.counters} playKey={stepIndex} />
        ) : (
          <p className="intro-stat">{step.stat}</p>
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
  )
}
