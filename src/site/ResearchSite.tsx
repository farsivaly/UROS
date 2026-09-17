import { useEffect, useId, useRef, useState } from 'react'
import { NAV, RESEARCH, type SiteRoute } from './content'
import HomePage from './HomePage'
import DocumentPage from './DocumentPage'
import ModelPage from './ModelPage'

type Props = {
  route: SiteRoute
}

export default function ResearchSite({ route }: Props) {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOpen(false)
  }, [route])

  useEffect(() => {
    if (!open) return

    const onPointer = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="site">
      <header className="site-header">
        <div className="site-header-inner">
          <a className="site-brand" href="#/">
            <strong>{RESEARCH.brand}</strong>
            <span>Research</span>
          </a>
          <div className="site-menu" ref={wrapRef}>
            <button
              type="button"
              className={`site-menu-btn${open ? ' is-open' : ''}`}
              aria-expanded={open}
              aria-controls={menuId}
              aria-label={open ? 'Close contents' : 'Open contents'}
              onClick={() => setOpen((value) => !value)}
            >
              <span className="site-menu-bars" aria-hidden>
                <span />
                <span />
                <span />
              </span>
              <span className="site-menu-label">Contents</span>
            </button>
            <nav
              id={menuId}
              className={`site-nav${open ? ' is-open' : ''}`}
              aria-label="Research sections"
              hidden={!open}
            >
              {NAV.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  aria-current={item.id === route ? 'page' : undefined}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="site-main">
        {route === 'home' && <HomePage />}
        {route === 'report' && <DocumentPage id="report" />}
        {route === 'poster' && <DocumentPage id="poster" />}
        {route === 'presentation' && <DocumentPage id="presentation" />}
        {route === 'literature' && <DocumentPage id="literature" />}
        {route === 'model' && <ModelPage />}
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div>
            <span className="site-footer-label">Investigator</span>
            <span>{RESEARCH.author}</span>
          </div>
          <div>
            <span className="site-footer-label">Supervisors</span>
            <span>{RESEARCH.supervisors.join(' · ')}</span>
          </div>
          <div>
            <span className="site-footer-label">Institution</span>
            <span>{RESEARCH.institution}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
