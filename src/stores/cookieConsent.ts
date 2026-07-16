import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * GDPR / RGPD cookie consent (task 021).
 *
 * The app itself only sets strictly-necessary cookies today (Supabase auth
 * session), so "essential" is always on and cannot be refused. Analytics and
 * marketing categories are opt-in and default to OFF until the visitor makes a
 * choice — no non-essential cookie/tracker may be set before consent is given.
 * The decision is stored locally so the banner does not reappear, and can be
 * changed at any time from the footer's "Cookie settings" link.
 */

export type CookieCategory = 'essential' | 'analytics' | 'marketing'

export interface CookiePreferences {
  /** Always true — strictly necessary cookies cannot be refused. */
  essential: true
  analytics: boolean
  marketing: boolean
}

interface StoredConsent extends CookiePreferences {
  /** ISO timestamp of the decision, for audit / re-consent windows. */
  decidedAt: string
  /** Schema version, so a future policy change can force re-consent. */
  version: number
}

const STORAGE_KEY = 'bdg-cookie-consent'
const CONSENT_VERSION = 1

function readStored(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredConsent
    if (parsed.version !== CONSENT_VERSION) return null
    return { ...parsed, essential: true }
  } catch {
    return null
  }
}

export const useCookieConsentStore = defineStore('cookieConsent', () => {
  const stored = ref<StoredConsent | null>(readStored())

  /** Whether the granular settings dialog is open (opened from the banner or footer). */
  const settingsOpen = ref(false)
  function openSettings() {
    settingsOpen.value = true
  }
  function closeSettings() {
    settingsOpen.value = false
  }

  /** True once the visitor has accepted, rejected, or saved a choice. */
  const hasDecided = computed(() => stored.value !== null)

  const preferences = computed<CookiePreferences>(() => ({
    essential: true,
    analytics: stored.value?.analytics ?? false,
    marketing: stored.value?.marketing ?? false,
  }))

  const analyticsAllowed = computed(() => preferences.value.analytics)
  const marketingAllowed = computed(() => preferences.value.marketing)

  function persist(prefs: { analytics: boolean; marketing: boolean }) {
    const next: StoredConsent = {
      essential: true,
      analytics: prefs.analytics,
      marketing: prefs.marketing,
      decidedAt: new Date().toISOString(),
      version: CONSENT_VERSION,
    }
    stored.value = next
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* storage may be unavailable (private mode) — banner will simply reappear */
    }
  }

  /** Accept every category. */
  function acceptAll() {
    persist({ analytics: true, marketing: true })
  }

  /** Reject all optional categories (essential still applies). */
  function rejectAll() {
    persist({ analytics: false, marketing: false })
  }

  /** Save a granular choice from the settings dialog. */
  function save(prefs: { analytics: boolean; marketing: boolean }) {
    persist(prefs)
  }

  return {
    stored,
    settingsOpen,
    openSettings,
    closeSettings,
    hasDecided,
    preferences,
    analyticsAllowed,
    marketingAllowed,
    acceptAll,
    rejectAll,
    save,
  }
})
