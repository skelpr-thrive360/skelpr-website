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
      pageRedirects({ '/docs': '/docs/', '/privacy': '/privacy/' }),
    ],
    // Serve each document at its own path and return 404 for unknown paths.
    appType: 'mpa',
    build: {
      rollupOptions: {
        input: {
          main: 'index.html',
          docs: 'docs/index.html',
          privacy: 'privacy/index.html',
        },
      },
    },
  }
})
