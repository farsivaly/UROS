import { StrictMode, Suspense, lazy, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import ResearchSite from './site/ResearchSite'
import type { SiteRoute } from './site/content'
import './styles.css'
import './site/research.css'

const Playground = lazy(() => import('./App'))

type AppRoute = SiteRoute | 'playground'

function parseHash(): AppRoute {
  const raw = window.location.hash.replace(/^#\/?/, '').split('?')[0].toLowerCase()
  if (raw === 'playground' || raw === 'twin' || raw === 'learn') return 'playground'
  if (raw === 'report') return 'report'
  if (raw === 'poster') return 'poster'
  if (raw === 'presentation' || raw === 'slides') return 'presentation'
  if (raw === 'literature' || raw === 'review') return 'literature'
  if (raw === 'model' || raw === 'matlab') return 'model'
  return 'home'
}

function Root() {
  const [route, setRoute] = useState<AppRoute>(parseHash)

  useEffect(() => {
    const sync = () => setRoute(parseHash())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  useEffect(() => {
    const scrolling = route !== 'playground'
    document.documentElement.classList.toggle('site-scroll', scrolling)
    document.body.classList.toggle('site-scroll', scrolling)

    const titles: Record<AppRoute, string> = {
      home: 'UROS — Research',
      report: 'UROS — Research Report',
      poster: 'UROS — Research Poster',
      presentation: 'UROS — Research Presentation',
      literature: 'UROS — Literature Review',
      model: 'UROS — Models',
      playground: 'UROS — Learning Playground',
    }
    document.title = titles[route]
  }, [route])

  if (route === 'playground') {
    return (
      <Suspense fallback={<div className="site-boot">Loading playground</div>}>
        <Playground />
      </Suspense>
    )
  }

  return <ResearchSite route={route} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
