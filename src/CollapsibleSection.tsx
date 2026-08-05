import { useId, type ReactNode } from 'react'

type Props = {
  title: string
  open: boolean
  onToggle: () => void
  badge?: string | number
  tone?: 'ok' | 'warn' | 'danger'
  children: ReactNode
}

/** Top-level SCADA accordion section (max five). */
export default function CollapsibleSection({
  title,
  open,
  onToggle,
  badge,
  tone,
  children,
}: Props) {
  const id = useId()
  return (
    <section className={`scada-section${open ? ' open' : ''}`}>
      <button
        type="button"
        className="scada-section-head"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
      >
        <span className="scada-chevron" aria-hidden />
        <span className="scada-section-title">{title}</span>
        {badge != null && badge !== '' && (
          <span className={`scada-badge${tone ? ` ${tone}` : ''}`}>{badge}</span>
        )}
      </button>
      {open && (
        <div id={id} className="scada-section-body">
          {children}
        </div>
      )}
    </section>
  )
}
