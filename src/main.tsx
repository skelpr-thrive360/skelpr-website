import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
// Self-hosted type: IBM Plex Sans/Mono for UI and code, Source Serif 4 for display.
import '@fontsource-variable/ibm-plex-sans/wght.css'
import '@fontsource-variable/source-serif-4/wght.css'
import '@fontsource-variable/source-serif-4/wght-italic.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
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
    <Analytics />
  </StrictMode>
)

if (container.hasChildNodes()) hydrateRoot(container, app)
else createRoot(container).render(app)
