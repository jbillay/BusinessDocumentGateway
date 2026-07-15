import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { Entitlements, PlanTier } from '@/types'

/** Usage meters flip to a warning state at this fraction of any limit. */
export const USAGE_WARN_RATIO = 0.8

export interface UsageMeter {
  used: number
  /** null = unlimited (never warns, never blocks). */
  limit: number | null
  /** 0..1 fraction of the limit used; 0 when unlimited. */
  ratio: number
  nearLimit: boolean
  atLimit: boolean
}

function meter(used: number, limit: number | null): UsageMeter {
  const ratio = limit === null || limit === 0 ? 0 : Math.min(used / limit, 1)
  return {
    used,
    limit,
    ratio,
    nearLimit: limit !== null && ratio >= USAGE_WARN_RATIO,
    atLimit: limit !== null && used >= limit,
  }
}

/**
 * Plan, limits, and live usage for the signed-in user, fetched in one RPC.
 * Server-side triggers are the source of truth (plan_limit:* errors); this
 * store exists so views can warn or gate before the server has to say no.
 */
export const useBillingStore = defineStore('billing', () => {
  const entitlements = ref<Entitlements | null>(null)
  const loading = ref(false)

  const plan = computed<PlanTier>(() => entitlements.value?.plan ?? 'free')
  const isPro = computed(() => plan.value === 'pro')
  const isPastDue = computed(() => entitlements.value?.status === 'past_due')

  const requests = computed(() =>
    meter(entitlements.value?.usage.active_requests ?? 0, entitlements.value?.limits.max_active_requests ?? null),
  )
  const storage = computed(() =>
    meter(entitlements.value?.usage.storage_bytes ?? 0, entitlements.value?.limits.max_storage_bytes ?? null),
  )
  const library = computed(() =>
    meter(entitlements.value?.usage.library_documents ?? 0, entitlements.value?.limits.max_library_documents ?? null),
  )

  const canUseBranding = computed(() => entitlements.value?.limits.custom_branding ?? false)
  const canUseAutoReminders = computed(() => entitlements.value?.limits.auto_reminders ?? false)

  async function load() {
    loading.value = true
    try {
      const { data, error } = await supabase.rpc('get_my_entitlements')
      if (error) throw error
      entitlements.value = data as Entitlements
    } finally {
      loading.value = false
    }
  }

  /** Re-fetch after anything that changes usage (request created/completed/deleted, upload, …). */
  async function refresh() {
    if (!loading.value) await load()
  }

  /** Redirects to Stripe Checkout for the chosen billing interval. */
  async function startCheckout(interval: 'month' | 'year') {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', { body: { interval } })
    if (error) throw await describeFunctionError(error)
    window.location.href = (data as { url: string }).url
  }

  /** Redirects to the Stripe Customer Portal (payment method, invoices, cancel). */
  async function openBillingPortal() {
    const { data, error } = await supabase.functions.invoke('create-portal-session', { body: {} })
    if (error) throw await describeFunctionError(error)
    window.location.href = (data as { url: string }).url
  }

  return {
    entitlements,
    loading,
    plan,
    isPro,
    isPastDue,
    requests,
    storage,
    library,
    canUseBranding,
    canUseAutoReminders,
    load,
    refresh,
    startCheckout,
    openBillingPortal,
  }
})

/** Turns an edge-function error into a user-explainable one. */
async function describeFunctionError(error: unknown): Promise<Error> {
  const context = (error as { context?: Response }).context
  const body = context ? await context.json().catch(() => null) : null
  if (body?.error === 'billing_not_configured') {
    return new Error('Billing is not available yet — payment processing has not been configured.')
  }
  if (body?.error === 'already_subscribed') {
    return new Error('This account already has an active Pro subscription.')
  }
  if (body?.error === 'no_billing_account') {
    return new Error('No billing account found — upgrade to Pro first.')
  }
  return error instanceof Error ? error : new Error('Billing request failed')
}
