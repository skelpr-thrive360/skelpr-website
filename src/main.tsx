import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted type: IBM Plex Sans/Mono for UI and code, Source Serif 4 for display.
import '@fontsource-variable/ibm-plex-sans/wght.css'
import '@fontsource-variable/source-serif-4/wght.css'
import '@fontsource-variable/source-serif-4/wght-italic.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import './styles.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
