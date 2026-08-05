type Props = {
  onRestart: () => void
  onExpert: () => void
}

export default function InvestigationComplete({ onRestart, onExpert }: Props) {
  return (
    <div className="invest-complete" role="status" aria-live="polite">
      <div className="invest-complete-burst" aria-hidden>
        {Array.from({ length: 18 }, (_, i) => (
          <span key={i} className="invest-spark" />
        ))}
      </div>
      <div className="invest-complete-medal" aria-hidden>
        <span className="invest-medal-ring" />
        <span className="invest-medal-core">★</span>
      </div>
      <p className="invest-complete-kicker">Investigation complete</p>
      <h2 className="invest-complete-title">Congratulations</h2>
      <p className="invest-complete-body">
        You traced power from the array through switching heat, Raman DTS sensing, and twin analytics to a
        maintenance decision. That full chain is the point of the digital twin.
      </p>
      <ul className="invest-complete-badges">
        <li>Power path</li>
        <li>Thermal fault</li>
        <li>Raman DTS</li>
        <li>Twin decision</li>
      </ul>
      <div className="btn-row wrap invest-complete-actions">
        <button type="button" className="tool-btn primary learn-primary" onClick={onExpert}>
          Open Expert Mode
        </button>
        <button type="button" className="tool-btn" onClick={onRestart}>
          Restart investigation
        </button>
      </div>
    </div>
  )
}
