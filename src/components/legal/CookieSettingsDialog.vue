<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import ToggleSwitch from 'primevue/toggleswitch'
import { useCookieConsentStore } from '@/stores/cookieConsent'

/**
 * Granular cookie preferences (task 021). Bound app-wide to the consent store's
 * `settingsOpen` flag so any "Cookie settings" link (banner, footer) can open it.
 * Essential cookies are shown but locked on; analytics/marketing are opt-in.
 */
const consent = useCookieConsentStore()

const analytics = ref(consent.preferences.analytics)
const marketing = ref(consent.preferences.marketing)

// Re-sync the local toggles to the saved choice each time the dialog opens.
watch(
  () => consent.settingsOpen,
  (open) => {
    if (open) {
      analytics.value = consent.preferences.analytics
      marketing.value = consent.preferences.marketing
    }
  },
)

function savePreferences() {
  consent.save({ analytics: analytics.value, marketing: marketing.value })
  consent.closeSettings()
}
function acceptAll() {
  consent.acceptAll()
  consent.closeSettings()
}
function rejectAll() {
  consent.rejectAll()
  consent.closeSettings()
}
</script>

<template>
  <Dialog
    :visible="consent.settingsOpen"
    @update:visible="(v: boolean) => (v ? consent.openSettings() : consent.closeSettings())"
    modal
    header="Cookie settings"
    :style="{ width: '32rem' }"
    :draggable="false"
    :breakpoints="{ '480px': '95vw' }"
  >
    <p class="cookie-settings__intro">
      We use cookies to keep you signed in and, with your permission, to understand usage and improve the product. You
      can change these choices at any time.
    </p>

    <ul class="cookie-settings__list">
      <li class="cookie-settings__row">
        <div>
          <div class="cookie-settings__row-head">
            <span class="cookie-settings__name">Strictly necessary</span>
            <span class="cookie-settings__always">Always on</span>
          </div>
          <p class="cookie-settings__desc">
            Required for the site to work — your sign-in session and security. These cannot be switched off.
          </p>
        </div>
        <ToggleSwitch :model-value="true" disabled aria-label="Strictly necessary cookies (always on)" />
      </li>

      <li class="cookie-settings__row">
        <div>
          <span class="cookie-settings__name">Analytics</span>
          <p class="cookie-settings__desc">
            Anonymous, aggregated usage so we can see which features help and fix what doesn't.
          </p>
        </div>
        <ToggleSwitch v-model="analytics" aria-label="Analytics cookies" />
      </li>

      <li class="cookie-settings__row">
        <div>
          <span class="cookie-settings__name">Marketing</span>
          <p class="cookie-settings__desc">
            Used to measure the effectiveness of our campaigns. Off unless you opt in.
          </p>
        </div>
        <ToggleSwitch v-model="marketing" aria-label="Marketing cookies" />
      </li>
    </ul>

    <template #footer>
      <div class="cookie-settings__footer">
        <Button label="Reject all" text severity="secondary" @click="rejectAll" />
        <div class="cookie-settings__footer-primary">
          <Button label="Save choices" outlined @click="savePreferences" />
          <Button label="Accept all" @click="acceptAll" />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.cookie-settings__intro {
  margin: 0 0 1.25rem;
  color: #475569;
  font-size: 0.925rem;
  line-height: 1.55;
}
.cookie-settings__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.cookie-settings__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0;
  border-top: 1px solid var(--bdg-border);
}
.cookie-settings__row:last-child {
  border-bottom: 1px solid var(--bdg-border);
}
.cookie-settings__row-head {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}
.cookie-settings__name {
  font-weight: 600;
  color: var(--bdg-deep);
}
.cookie-settings__always {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #059669;
  background: rgba(5, 150, 105, 0.1);
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
}
.cookie-settings__desc {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.85rem;
  line-height: 1.5;
}
.cookie-settings__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
}
.cookie-settings__footer-primary {
  display: flex;
  gap: 0.5rem;
}
@media (max-width: 480px) {
  .cookie-settings__footer {
    flex-direction: column-reverse;
    align-items: stretch;
  }
  .cookie-settings__footer-primary {
    flex-direction: column-reverse;
  }
}
</style>
