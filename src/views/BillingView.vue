<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Message from 'primevue/message'
import SelectButton from 'primevue/selectbutton'
import Tag from 'primevue/tag'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { useBillingStore, type UsageMeter } from '@/stores/billing'
import { formatBytes, PLAN_LABELS } from '@/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const billing = useBillingStore()

const INTERVAL_OPTIONS = [
  { label: 'Annual — $15/mo (save 21%)', value: 'year' },
  { label: 'Monthly — $19/mo', value: 'month' },
]
const interval = ref<'month' | 'year'>('year')
const redirecting = ref(false)
let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await billing.load()
  // Returning from Stripe: the webhook can land a moment after the redirect,
  // so poll briefly instead of asking the user to refresh.
  if (route.query.checkout === 'success' && !billing.isPro) {
    let attempts = 0
    pollTimer = setInterval(async () => {
      attempts += 1
      await billing.refresh()
      if (billing.isPro || attempts >= 10) {
        stopPolling()
        if (billing.isPro) {
          toast.add({ severity: 'success', summary: 'Welcome to Pro!', detail: 'Your upgrade is active.', life: 5000 })
        }
        router.replace({ name: 'billing' })
      }
    }, 1500)
  } else if (route.query.checkout === 'success' && billing.isPro) {
    toast.add({ severity: 'success', summary: 'Welcome to Pro!', detail: 'Your upgrade is active.', life: 5000 })
    router.replace({ name: 'billing' })
  }
})

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = null
}
onBeforeUnmount(stopPolling)

const planLabel = computed(() => PLAN_LABELS[billing.plan])
const priceLine = computed(() => {
  if (!billing.isPro) return 'Free forever'
  return billing.entitlements?.billing_interval === 'year' ? '$180/year ($15/mo)' : '$19/month'
})
const renewalDate = computed(() => {
  const end = billing.entitlements?.current_period_end
  return end ? new Date(end).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : null
})

const meters = computed(() => [
  {
    label: 'Active requests',
    meter: billing.requests,
    display: `${billing.requests.used} of ${billing.requests.limit}`,
  },
  {
    label: 'Storage',
    meter: billing.storage,
    display: `${formatBytes(billing.storage.used)} of ${formatBytes(billing.storage.limit ?? 0)}`,
  },
  {
    label: 'Library documents',
    meter: billing.library,
    display:
      billing.library.limit === null
        ? `${billing.library.used} — unlimited`
        : `${billing.library.used} of ${billing.library.limit}`,
  },
])

function meterClass(meter: UsageMeter): string {
  if (meter.atLimit) return 'is-full'
  if (meter.nearLimit) return 'is-warning'
  return ''
}

const features = computed(() => [
  { label: 'Client portal, PIN & link expiry', included: true },
  { label: 'Review workflow & ZIP download', included: true },
  { label: 'Custom portal branding', included: billing.canUseBranding },
  { label: 'Automatic scheduled reminders', included: billing.canUseAutoReminders },
  { label: '"Powered by BDG" badge removed', included: !(billing.entitlements?.limits.show_badge ?? true) },
])

async function upgrade() {
  redirecting.value = true
  try {
    await billing.startCheckout(interval.value)
  } catch (error) {
    redirecting.value = false
    toast.add({
      severity: 'error',
      summary: 'Could not start checkout',
      detail: error instanceof Error ? error.message : undefined,
      life: 6000,
    })
  }
}

async function manageBilling() {
  redirecting.value = true
  try {
    await billing.openBillingPortal()
  } catch (error) {
    redirecting.value = false
    toast.add({
      severity: 'error',
      summary: 'Could not open billing portal',
      detail: error instanceof Error ? error.message : undefined,
      life: 6000,
    })
  }
}
</script>

<template>
  <div class="billing-page">
    <AppNavbar />

    <main class="billing-page__main">
      <div class="billing-header">
        <div>
          <h1 class="billing-header__title">Plan &amp; Billing</h1>
          <p class="billing-header__subtitle">Your subscription, usage, and invoices.</p>
        </div>
      </div>

      <Message v-if="billing.isPastDue" severity="warn" icon="pi pi-exclamation-triangle" class="billing-alert">
        Your last payment failed. Please update your payment method — Pro features stay active while we retry.
      </Message>

      <div class="billing-layout">
        <!-- Current plan -->
        <section class="bdg-card billing-card">
          <div class="billing-card__header">
            <h2>Current plan</h2>
            <Tag :value="planLabel" :severity="billing.isPro ? 'success' : 'info'" />
          </div>
          <p class="billing-plan__price">{{ priceLine }}</p>
          <p v-if="billing.isPro && renewalDate" class="billing-plan__renewal">
            <template v-if="billing.entitlements?.cancel_at_period_end">
              Cancels on {{ renewalDate }} — you keep Pro until then.
            </template>
            <template v-else>Renews on {{ renewalDate }}.</template>
          </p>
          <p v-else-if="!billing.isPro" class="billing-plan__renewal">
            No card on file, no trial clock. Upgrade whenever you need more room.
          </p>

          <ul class="billing-features">
            <li v-for="feature in features" :key="feature.label" :class="{ 'is-locked': !feature.included }">
              <i :class="feature.included ? 'pi pi-check-circle' : 'pi pi-lock'" />
              {{ feature.label }}
            </li>
          </ul>

          <div class="billing-actions">
            <template v-if="!billing.isPro">
              <SelectButton
                v-model="interval"
                :options="INTERVAL_OPTIONS"
                option-label="label"
                option-value="value"
                :allow-empty="false"
                aria-label="Billing interval"
              />
              <Button
                label="Upgrade to Pro"
                icon="pi pi-arrow-up-right"
                :loading="redirecting"
                @click="upgrade"
              />
            </template>
            <Button
              v-else
              label="Manage billing"
              icon="pi pi-external-link"
              outlined
              :loading="redirecting"
              @click="manageBilling"
            />
          </div>
        </section>

        <!-- Usage -->
        <section class="bdg-card billing-card">
          <div class="billing-card__header">
            <h2>Usage</h2>
          </div>
          <div v-for="entry in meters" :key="entry.label" class="usage-meter">
            <div class="usage-meter__row">
              <span class="usage-meter__label">{{ entry.label }}</span>
              <span class="usage-meter__value">{{ entry.display }}</span>
            </div>
            <div class="usage-meter__track">
              <div
                class="usage-meter__fill"
                :class="meterClass(entry.meter)"
                :style="{ width: `${Math.round(entry.meter.ratio * 100)}%` }"
              />
            </div>
            <small v-if="entry.meter.atLimit" class="usage-meter__note is-full-note">
              Limit reached — complete or remove items, or upgrade for more room.
            </small>
            <small v-else-if="entry.meter.nearLimit" class="usage-meter__note">Approaching your plan limit.</small>
          </div>
          <p class="billing-usage__hint">
            Active requests are those in Pending, Awaiting Client, or In Review — completing or deleting one frees a
            slot immediately.
          </p>
        </section>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.billing-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.billing-page__main {
  flex: 1;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 1.5rem;
}
.billing-header {
  margin-bottom: 1.5rem;
}
.billing-header__title {
  margin: 0;
  font-size: 1.75rem;
}
.billing-header__subtitle {
  margin: 0.25rem 0 0;
  color: #64748b;
}
.billing-alert {
  margin-bottom: 1.25rem;
}
.billing-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  align-items: start;
}
.billing-card {
  padding: 1.5rem;
}
.billing-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.billing-card__header h2 {
  margin: 0;
  font-size: 1.2rem;
}
.billing-plan__price {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--bdg-deep);
}
.billing-plan__renewal {
  margin: 0.375rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
}
.billing-features {
  list-style: none;
  margin: 1.25rem 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}
.billing-features li {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 0.925rem;
  color: var(--bdg-deep);
}
.billing-features li .pi-check-circle {
  color: #16a34a;
}
.billing-features li.is-locked {
  color: #94a3b8;
}
.billing-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-start;
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--bdg-border, #e2e8f0);
}
.usage-meter {
  margin-bottom: 1.125rem;
}
.usage-meter__row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 0.375rem;
}
.usage-meter__label {
  font-weight: 600;
  font-size: 0.925rem;
  color: var(--bdg-deep);
}
.usage-meter__value {
  color: #64748b;
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
}
.usage-meter__track {
  height: 0.5rem;
  border-radius: 999px;
  background: #eef2f7;
  overflow: hidden;
}
.usage-meter__fill {
  height: 100%;
  border-radius: 999px;
  background: var(--bdg-blue, #3b82f6);
  transition: width 0.3s ease;
}
.usage-meter__fill.is-warning {
  background: #f59e0b;
}
.usage-meter__fill.is-full {
  background: #dc2626;
}
.usage-meter__note {
  display: block;
  margin-top: 0.3rem;
  color: #b45309;
}
.usage-meter__note.is-full-note {
  color: #dc2626;
}
.billing-usage__hint {
  margin: 0.75rem 0 0;
  color: #94a3b8;
  font-size: 0.82rem;
  line-height: 1.5;
}
</style>
