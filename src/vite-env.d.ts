/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google Apps Script waitlist web app URL; unset falls back to the local stub. */
  readonly VITE_WAITLIST_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
