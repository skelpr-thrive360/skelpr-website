import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { startAnalytics } from './lib/analytics'
import './fonts.css'
import './styles.css'
import App from './App'

/**
 * Hydrate the markup that arrived (scripts/prerender.mjs wrote it there), or
 * mount fresh when the root is empty — dev, or a build that skipped the pass.
 * Chosen by inspection rather than by build flag so the two can't disagree:
 * hydration against an empty root is a hard failure.
 */
const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

if (container.hasChildNodes()) hydrateRoot(container, app)
else createRoot(container).render(app)

startAnalytics()
