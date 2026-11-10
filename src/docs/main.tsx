import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { startAnalytics } from '../lib/analytics'
import '../fonts.css'
import '../styles.css'
import './docs.css'
import { DocsApp } from './DocsApp'

/** Hydrate the prerendered article when it shipped, mount fresh when it did not —
 *  the same rule as src/main.tsx, which is why this file reads the same way. */
const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <DocsApp />
  </StrictMode>
)

if (container.hasChildNodes()) hydrateRoot(container, app)
else createRoot(container).render(app)

startAnalytics()
