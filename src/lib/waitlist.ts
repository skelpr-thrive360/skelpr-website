// Waitlist backend: a Google Apps Script web app bound to a Google Sheet
// (see website/waitlist-apps-script.gs and "Waitlist setup" in website/README.md).
// The endpoint comes from VITE_WAITLIST_ENDPOINT at build/dev time (see .env.example).
// While unset, submissions stay in a local stub so the UI stays testable without a backend.
export const WAITLIST_ENDPOINT: string | null =
  import.meta.env.VITE_WAITLIST_ENDPOINT?.trim() || null

export type WaitlistAction = 'join' | 'withdraw'

export type WaitlistResult =
  | { ok: true; stub?: boolean; duplicate?: boolean; removed?: boolean }
  | { ok: false; error: string }

export type WaitlistDetails = {
  /** 'join' (default) adds the email once; 'withdraw' removes it if present. */
  action?: WaitlistAction
  /** Hidden honeypot field value — leave empty; bots fill it, humans never see it. */
  trap?: string
}

const STUB_KEY = 'locodex-waitlist-email'

export async function submitWaitlistEmail(
  emailInput: string,
  details: WaitlistDetails = {},
): Promise<WaitlistResult> {
  const email = emailInput.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Enter a valid email address.' }
  }
  const action = details.action ?? 'join'

  if (!WAITLIST_ENDPOINT) {
    // Local stub: remember the email for the session so the success state is reachable.
    const stored = sessionStorage.getItem(STUB_KEY) === email
    if (action === 'withdraw') {
      sessionStorage.removeItem(STUB_KEY)
      console.info('[waitlist stub] email removed:', email)
      return { ok: true, stub: true, removed: stored }
    }
    if (stored) return { ok: true, stub: true, duplicate: true }
    sessionStorage.setItem(STUB_KEY, email)
    console.info('[waitlist stub] email captured:', email)
    return { ok: true, stub: true, duplicate: false }
  }

  try {
    // Apps Script answers redirects/CORS with opaque 200s, so judge success by
    // the JSON body ({ ok: true }) rather than the status code.
    const response = await fetch(WAITLIST_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // avoids a CORS preflight
      body: JSON.stringify({ email, action, trap: details.trap ?? '' }),
    })
    const data = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string; duplicate?: boolean; removed?: boolean }
      | null
    if (response.ok && data?.ok) {
      return { ok: true, duplicate: data.duplicate, removed: data.removed }
    }
    return { ok: false, error: data?.error ?? 'Something went wrong. Please try again.' }
  } catch {
    return { ok: false, error: 'Network error. Please try again.' }
  }
}
