/**
 * Cheap check for a stored Supabase session WITHOUT importing the Supabase
 * client. Marketing pages use it so anonymous cold visits never download the
 * auth/Supabase chunk; it is only a hint — real session validity is decided
 * by the auth store once loaded.
 */
export function hasStoredSession(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('sb-') && key.endsWith('-auth-token')) return true
    }
  } catch {
    /* storage unavailable (privacy mode / SSR) — treat as signed out */
  }
  return false
}
