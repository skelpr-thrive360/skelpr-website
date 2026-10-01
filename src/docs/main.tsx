import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DocsApp />
  </StrictMode>,
)
