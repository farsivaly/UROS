import { useEffect, useState } from 'react'
import {
  DOCUMENTS,
  REPORT_VERSIONS,
  type ReportVersionId,
} from './content'

type DocId = keyof typeof DOCUMENTS

function parseReportVersion(): ReportVersionId {
  const query = window.location.hash.split('?')[1] ?? ''
  const view = new URLSearchParams(query).get('view')
  return view === 'extended' ? 'extended' : 'short'
}

export default function DocumentPage({ id }: { id: DocId }) {
  const doc = DOCUMENTS[id]
  const isReport = id === 'report'
  const [version, setVersion] = useState<ReportVersionId>(parseReportVersion)
  const active = isReport
    ? REPORT_VERSIONS.find((item) => item.id === version) ?? REPORT_VERSIONS[0]
    : null
  const href = active?.href ?? doc.href
  const preview = active && 'preview' in active ? active.preview : doc.preview
  const [available, setAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isReport) return
    const sync = () => setVersion(parseReportVersion())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [isReport])

  useEffect(() => {
    let cancelled = false
    setAvailable(null)
    fetch(href, { method: 'HEAD' })
      .then((res) => {
        if (!cancelled) setAvailable(res.ok)
      })
      .catch(() => {
        if (!cancelled) setAvailable(false)
      })
    return () => {
      cancelled = true
    }
  }, [href])

  const summary = active?.summary ?? doc.summary
  const openLabel = active?.openLabel ?? doc.openLabel
  const downloadLabel = active?.downloadLabel ?? doc.downloadLabel
  const dropPath = active?.dropPath ?? doc.dropPath
  const cover = active?.cover ?? doc.cover

  return (
    <section>
      <div className="site-page-head">
        <div>
          <p className="site-kicker">{doc.kicker}</p>
          <h1>{doc.title}</h1>
          <p>{summary}</p>
          {isReport && (
            <div className="site-seg" role="tablist" aria-label="Report version">
              {REPORT_VERSIONS.map((item) => (
                <a
                  key={item.id}
                  href={item.hash}
                  role="tab"
                  aria-selected={item.id === version}
                  className={`site-seg-btn${item.id === version ? ' is-active' : ''}`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </div>
        {available && (
          <div className="site-actions">
            <a className="site-btn primary" href={href} target="_blank" rel="noreferrer">
              {openLabel}
            </a>
            <a className="site-btn" href={href} download>
              {downloadLabel}
            </a>
            {!isReport &&
              doc.extraActions?.map((action) => (
                <a
                  key={action.href}
                  className="site-btn"
                  href={action.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {action.label}
                </a>
              ))}
          </div>
        )}
      </div>

      {available === null && <p className="site-lead">Checking for the file…</p>}

      {available && (
        <div className="report-stage">
          <object className="report-embed" data={href} type="application/pdf" aria-label={doc.title}>
            <div className="report-fallback">
              This browser cannot embed the PDF.{' '}
              <a href={href} target="_blank" rel="noreferrer">
                Open it instead
              </a>
              .
            </div>
          </object>
          {preview && (
            <img className="report-preview" src={preview} alt={`Preview of ${doc.title}`} />
          )}
        </div>
      )}

      {available === false && (
        <div className="doc-placeholder" role="status">
          <p className="doc-placeholder-kicker">Coming soon</p>
          <h2>
            {isReport && version === 'extended'
              ? 'Extended article will appear here'
              : `${doc.title} will appear here`}
          </h2>
          <p>{cover}</p>
          <p>
            Drop the finished PDF at <code>{dropPath}</code> and refresh this
            page.
          </p>
        </div>
      )}
    </section>
  )
}
