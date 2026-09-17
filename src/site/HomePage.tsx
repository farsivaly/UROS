import { PORTALS, RESEARCH } from './content'

function PortalMedia({
  kind,
}: {
  kind: 'poster' | 'pipeline' | 'farm' | 'document' | 'slides' | 'literature'
}) {
  if (kind === 'poster') {
    return (
      <img
        src="/research/previews/poster.jpg"
        alt="UCL research poster for the UROS digital-twin project"
      />
    )
  }

  if (kind === 'farm') {
    return (
      <img
        src="/research/previews/playground.jpg"
        alt="Snapshot of the UROS 3D solar-farm learning environment"
      />
    )
  }

  if (kind === 'document') {
    return (
      <img
        src="/research/previews/report.jpg"
        alt="First page of the UROS research report"
      />
    )
  }

  if (kind === 'slides') {
    return (
      <img
        src="/research/previews/presentation.jpg"
        alt="Title slide of the UROS research presentation"
      />
    )
  }

  if (kind === 'pipeline') {
    return (
      <span className="portal-media-split" aria-hidden>
        <img
          src="/research/previews/inverter-block.png"
          alt=""
        />
        <img
          src="/research/previews/raman-block.png"
          alt=""
        />
      </span>
    )
  }

  if (kind === 'literature') {
    return (
      <svg className="media-pipeline" viewBox="0 0 360 220" role="img" aria-hidden>
        <rect width="360" height="220" fill="#080d13" />
        <rect x="72" y="52" width="72" height="108" rx="3" fill="#1a2430" stroke="rgba(140,170,200,0.28)" />
        <rect x="144" y="44" width="76" height="116" rx="3" fill="#101820" stroke="#3db8a0" />
        <rect x="220" y="56" width="68" height="104" rx="3" fill="#1a2430" stroke="rgba(140,170,200,0.28)" />
        <rect x="158" y="62" width="48" height="6" rx="2" fill="#3db8a0" fillOpacity="0.85" />
        <rect x="158" y="78" width="48" height="4" rx="1" fill="#8fa3b8" fillOpacity="0.35" />
        <rect x="158" y="90" width="40" height="4" rx="1" fill="#8fa3b8" fillOpacity="0.25" />
        <text x="20" y="204" fill="#8fa3b8" fontSize="10" fontFamily="IBM Plex Mono, monospace">
          FILE PENDING
        </text>
      </svg>
    )
  }

  return null
}

export default function HomePage() {
  return (
    <section className="site-home">
      <header className="site-hero">
        <p className="site-kicker">{RESEARCH.kicker}</p>
        <h1 className="site-h1">{RESEARCH.shortTitle}</h1>
        <p className="site-lead">{RESEARCH.lead}</p>
        <dl className="site-meta">
          <div>
            <dt>Investigator</dt>
            <dd>{RESEARCH.author}</dd>
          </div>
          <div>
            <dt>Supervisors</dt>
            <dd>{RESEARCH.supervisors.join(' · ')}</dd>
          </div>
          <div>
            <dt>Institution</dt>
            <dd>{RESEARCH.institution}</dd>
          </div>
        </dl>
      </header>

      <div className="portals" aria-label="Research contents">
        {PORTALS.map((portal) => (
          <a key={portal.id} className="portal" href={portal.href}>
            <div className="portal-media">
              <PortalMedia kind={portal.media} />
              {portal.soon && <span className="portal-soon">Coming soon</span>}
            </div>
            <div className="portal-body">
              <div className="portal-head">
                <span className="portal-index">{portal.index}</span>
                <span className="portal-kicker">{portal.kicker}</span>
              </div>
              <h2>{portal.title}</h2>
              <p>{portal.body}</p>
              <span className="portal-cta">{portal.cta}</span>
            </div>
          </a>
        ))}
      </div>

      <aside className="site-note">
        <p className="site-kicker">Full title</p>
        <p>{RESEARCH.title}</p>
      </aside>
    </section>
  )
}
