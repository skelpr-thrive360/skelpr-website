// Waitlist backend: a Google Apps Script web app bound to a Google Sheet
// (see website/waitlist-apps-script.gs and "Waitlist setup" in website/README.md).
// The endpoint comes from VITE_WAITLIST_ENDPOINT at build/dev time (see .env.example).
// While unset, submissions stay in a local stub so the UI stays testable without a backend.
export const WAITLIST_ENDPOINT: string | null =
  import.meta.env.VITE_WAITLIST_ENDPOINT?.trim() || null

// Success is deliberately identical for new and already-registered emails, so the
// public endpoint cannot be used to check whether an address is on the list.
export type WaitlistResult =
  | { ok: true; stub?: boolean }
  | { ok: false; error: string }

export type WaitlistDetails = {
  /** Hidden honeypot field value — leave empty; bots fill it, humans never see it. */
  trap?: string
}

export async function submitWaitlistEmail(
  emailInput: string,
  details: WaitlistDetails = {},
): Promise<WaitlistResult> {
  const email = emailInput.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Enter a valid email address.' }
  }
  if (!WAITLIST_ENDPOINT) {
    // Local stub: nothing is stored, so the success state is reachable in dev.
    console.info('[waitlist stub] email captured:', email)
    return { ok: true, stub: true }
  }

  try {
    // Apps Script answers redirects/CORS with opaque 200s, so judge success by
    // the JSON body ({ ok: true }) rather than the status code.
    const response = await fetch(WAITLIST_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // avoids a CORS preflight
      body: JSON.stringify({ email, trap: details.trap ?? '' }),
    })
    const data = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string }
      | null
    if (response.ok && data?.ok) {
      return { ok: true }
    }
    return { ok: false, error: data?.error ?? 'Something went wrong. Please try again.' }
  } catch {
    return { ok: false, error: 'Network error. Please try again.' }
  }
}
