import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Without VITE_WAITLIST_ENDPOINT the waitlist falls back to a sessionStorage stub,
 * which is right for local dev and silently lossy in a deployed build: the form
 * reports success and the address is stored nowhere. Nothing else fails, so the
 * mistake is invisible until someone asks why the list is empty. Say it at build
 * time, where the missing piece (the host's env vars) actually is.
 */
function waitlistEndpointGuard(endpoint: string | undefined): Plugin {
  return {
    name: 'skelpr:waitlist-endpoint-guard',
    apply: 'build',
    buildStart() {
      if (!endpoint) {
        this.warn(
          'VITE_WAITLIST_ENDPOINT is not set for this build, so waitlist submissions will be ' +
            'accepted and discarded. Set it in the hosting provider\'s build environment to ' +
            'collect addresses — see "Waitlist setup" in website/README.md.',
        )
      }
    },
  }
}

/**
 * Send a bare page path to the directory that serves it.
 *
 * `/docs` is a directory, and a directory is served by its trailing slash. Left to
 * themselves the dev server answers the extensionless path with a 404 and `vite
 * preview` answers it with `/index.html` — the *marketing* page — so a link to
 * `/docs` would quietly render the wrong document, and a check that only looked at
 * the status code would call it working. A static host does this redirect for us in
 * production; this is the same move locally, so all three agree.
 *
 * The three parameters are `any` deliberately: their real types come from
 * `@types/node`, which this project does not carry, and a devDependency exists to
 * serve the source, not to spell three annotations. Same trade as the build inputs
 * above, which are plain relative strings rather than `path.resolve` calls.
 */
function pageRedirects(pages: Record<string, string>): Plugin {
  const middleware = (req: any, res: any, next: () => void) => {
    const url: string = req.url ?? ''
    const path = url.split('?')[0]
    const target = pages[path]
    if (target === undefined) return next()
    res.statusCode = 301
    res.setHeader('Location', target + url.slice(path.length))
    res.end()
  }
  return {
    name: 'skelpr:page-redirects',
    // Registered directly rather than returned as a post hook, so this runs before
    // the server's own html fallback gets a chance to answer with the wrong page.
    // Block bodies, not arrow expressions: these hooks take a return value to mean
    // "a post hook to run later", and `use()` hands back the Connect server.
    configureServer: (server) => {
      server.middlewares.use(middleware)
    },
    configurePreviewServer: (server) => {
      server.middlewares.use(middleware)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  return {
    plugins: [
      react(),
      waitlistEndpointGuard(env.VITE_WAITLIST_ENDPOINT),
      pageRedirects({ '/docs': '/docs/' }),
    ],
    // Not an SPA: two real pages live at two real paths, and neither is the other's
    // fallback. Under the default 'spa' behaviour an unknown path was answered with
    // /index.html, so the marketing homepage stood in for anything that did not
    // resolve — a 404 wearing a 200. 'mpa' turns that off, so what does not exist
    // says so.
    appType: 'mpa',
    build: {
      rollupOptions: {
        // Two pages, two entries. The marketing page is one document that scrolls
        // through every section; /docs is a second, standalone page with its own
        // URL, its own title and meta, and no scroll choreography. Vite's default
        // single-entry build would emit only index.html, so the docs page has to
        // be named here or it simply would not be built.
        //
        // Paths are relative to the project root rather than resolved with
        // `node:path`, because the config is typechecked by tsconfig.node.json,
        // which carries no Node types — and one more devDependency to spell the
        // root is a poor trade for two literals.
        input: {
          main: 'index.html',
          docs: 'docs/index.html',
        },
      },
    },
  }
})
