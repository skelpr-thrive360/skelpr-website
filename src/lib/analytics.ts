/** Load the deployed analytics script after the initial page assets finish. */
export function startAnalytics() {
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
  if (import.meta.env.DEV || local) return

  const start = () => {
    void import('@vercel/analytics')
      .then(({ inject }) => inject({ mode: 'production' }))
      .catch(() => { /* Analytics is optional. */ })
  }

  if (document.readyState === 'complete') start()
  else window.addEventListener('load', start, { once: true })
}
