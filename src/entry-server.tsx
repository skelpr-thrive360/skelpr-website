import { renderToString } from 'react-dom/server'
import App from './App'
import { DocsApp } from './docs/DocsApp'

/**
 * Build-time render of both pages; scripts/prerender.mjs writes the output into
 * the built documents and the client hydrates it.
 *
 * Keeps server and client markup identical: no browser reads during render
 * (window/document only in effects, handlers, or server snapshots), and no CSS
 * imports — the document links those itself. StrictMode stays client-side.
 */
export function renderMarketingPage(): string {
  return renderToString(<App />)
}

export function renderDocsPage(): string {
  return renderToString(<DocsApp />)
}
