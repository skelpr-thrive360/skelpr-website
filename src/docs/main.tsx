import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
// The same three families as the marketing page, loaded here so /docs is a page in
// its own right rather than a redirect into a bundle that happens to be cached.
import '@fontsource-variable/ibm-plex-sans/wght.css'
import '@fontsource-variable/source-serif-4/wght.css'
import '@fontsource-variable/source-serif-4/wght-italic.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
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
