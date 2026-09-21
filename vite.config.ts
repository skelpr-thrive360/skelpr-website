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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  return {
    plugins: [react(), waitlistEndpointGuard(env.VITE_WAITLIST_ENDPOINT)],
  }
})
