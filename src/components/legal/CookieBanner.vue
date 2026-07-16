<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import { useCookieConsentStore } from '@/stores/cookieConsent'

/**
 * GDPR/RGPD consent banner (task 021). Shown app-wide until the visitor makes a
 * choice. Non-essential categories stay off until then. Paired with
 * CookieSettingsDialog for granular control.
 */
const consent = useCookieConsentStore()
const router = useRouter()
</script>

<template>
  <!--
    Plain v-if (no <Transition>): the enter animation is CSS-only. A Vue
    <Transition> here gets stuck on leave because .bdg-card declares its own
    border-color/box-shadow transition, so Vue waits for a transitionend that
    never fires and the banner never unmounts (same reason App.vue avoids it).
  -->
  <div
    v-if="!consent.hasDecided"
    class="cookie-banner bdg-card"
    role="dialog"
    aria-label="Cookie consent"
    aria-live="polite"
  >
    <div class="cookie-banner__text">
      <p class="cookie-banner__title">We value your privacy</p>
      <p class="cookie-banner__body">
        We use strictly necessary cookies to run the app. With your consent we also use analytics to improve it. See our
        <a href="#" @click.prevent="router.push({ name: 'cookie-policy' })">Cookie Policy</a>.
      </p>
    </div>
    <div class="cookie-banner__actions">
      <Button label="Cookie settings" text severity="secondary" size="small" @click="consent.openSettings()" />
      <Button label="Reject all" outlined size="small" @click="consent.rejectAll()" />
      <Button label="Accept all" size="small" @click="consent.acceptAll()" />
    </div>
  </div>
</template>

<style scoped>
.cookie-banner {
  position: fixed;
  z-index: 1000;
  left: 1rem;
  right: 1rem;
  bottom: 1rem;
  max-width: 46rem;
  margin: 0 auto;
  padding: 1.125rem 1.375rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  box-shadow: var(--bdg-shadow-2);
}
.cookie-banner__text {
  min-width: 0;
}
.cookie-banner__title {
  margin: 0 0 0.2rem;
  font-weight: 600;
  color: var(--bdg-deep);
  font-size: 0.95rem;
}
.cookie-banner__body {
  margin: 0;
  color: #475569;
  font-size: 0.85rem;
  line-height: 1.5;
}
.cookie-banner__body a {
  color: var(--bdg-blue);
  text-decoration: none;
}
.cookie-banner__body a:hover {
  text-decoration: underline;
}
.cookie-banner__actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

/* CSS-only enter animation (no Vue <Transition>; see template comment). */
@media (prefers-reduced-motion: no-preference) {
  .cookie-banner {
    animation: cookie-banner-in 0.25s ease;
  }
}
@keyframes cookie-banner-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (max-width: 720px) {
  .cookie-banner {
    flex-direction: column;
    align-items: stretch;
    gap: 0.875rem;
  }
  .cookie-banner__actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}
</style>
