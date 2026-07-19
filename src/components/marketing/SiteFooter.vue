<script setup lang="ts">
import BrandLogo from '@/components/brand/BrandLogo.vue'
import { useCookieConsentStore } from '@/stores/cookieConsent'
import { CONTACT_EMAIL } from '@/lib/contact'

/**
 * Public marketing footer (landing, pricing, legal pages). Carries the legal
 * links required by task 021 and the "Cookie settings" trigger (GDPR: the
 * decision must be changeable at any time).
 */
const consent = useCookieConsentStore()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <div class="site-footer__brand">
        <BrandLogo :size="30" />
        <p class="site-footer__tagline">Collect documents from your clients — securely, and without the email back-and-forth.</p>
        <a class="site-footer__email" :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>
      </div>

      <!-- Hash links render as plain anchors (custom slot) so vue-router doesn't
           stamp aria-current="page" on all of them at once while on the landing page. -->
      <nav class="site-footer__col" aria-label="Product">
        <h3 class="site-footer__heading">Product</h3>
        <router-link :to="{ name: 'landing', hash: '#how' }" custom v-slot="{ href, navigate }">
          <a :href="href" @click="navigate">How it works</a>
        </router-link>
        <router-link :to="{ name: 'landing', hash: '#features' }" custom v-slot="{ href, navigate }">
          <a :href="href" @click="navigate">Features</a>
        </router-link>
        <router-link :to="{ name: 'pricing' }">Pricing</router-link>
        <router-link :to="{ name: 'landing', hash: '#contact' }" custom v-slot="{ href, navigate }">
          <a :href="href" @click="navigate">Contact us</a>
        </router-link>
      </nav>

      <nav class="site-footer__col" aria-label="Resources">
        <h3 class="site-footer__heading">Resources</h3>
        <router-link :to="{ name: 'guide-collect' }">Collecting documents from clients</router-link>
        <router-link :to="{ name: 'guide-checklist' }">Onboarding document checklist</router-link>
        <router-link :to="{ name: 'guide-secure' }">Secure file-sharing guide</router-link>
      </nav>

      <nav class="site-footer__col" aria-label="Account">
        <h3 class="site-footer__heading">Account</h3>
        <router-link :to="{ name: 'login' }">Sign in</router-link>
        <router-link :to="{ name: 'register' }">Create account</router-link>
      </nav>

      <nav class="site-footer__col" aria-label="Legal">
        <h3 class="site-footer__heading">Legal</h3>
        <router-link :to="{ name: 'terms' }">Terms of Service</router-link>
        <router-link :to="{ name: 'privacy' }">Privacy Policy</router-link>
        <router-link :to="{ name: 'dpa' }">Data Processing Agreement</router-link>
        <router-link :to="{ name: 'cookie-policy' }">Cookie Policy</router-link>
        <button type="button" class="site-footer__linkbtn" @click="consent.openSettings()">Cookie settings</button>
      </nav>
    </div>

    <div class="site-footer__bar">
      <span>© {{ year }} Business Document Gateway™. All rights reserved.</span>
      <span class="site-footer__made">Secure document collection, simplified.</span>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: auto;
  background: #ffffff;
  border-top: 1px solid var(--bdg-border);
}
.site-footer__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1.5rem 2.5rem;
  display: grid;
  grid-template-columns: 1.5fr 0.9fr 1.3fr 0.9fr 1.2fr;
  gap: 2rem;
}
.site-footer__brand {
  max-width: 22rem;
}
.site-footer__tagline {
  margin: 0.875rem 0 0.75rem;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.55;
}
.site-footer__email {
  display: inline-block;
  padding: 0.3rem 0;
  color: var(--bdg-blue);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}
.site-footer__email:hover {
  text-decoration: underline;
}
.site-footer__col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
}
.site-footer__heading {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #94a3b8;
}
.site-footer__col a,
.site-footer__linkbtn {
  /* Padding (not column gap) provides the ≥24px hit area per link. */
  display: inline-block;
  padding: 0.3rem 0;
  color: #475569;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.15s ease;
}
.site-footer__col a:hover,
.site-footer__linkbtn:hover {
  color: var(--bdg-blue);
}
.site-footer__linkbtn {
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font: inherit;
}
.site-footer__bar {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--bdg-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: #94a3b8;
}

@media (max-width: 980px) {
  .site-footer__inner {
    grid-template-columns: 1fr 1fr;
    gap: 1.75rem 1.5rem;
  }
  .site-footer__brand {
    grid-column: 1 / -1;
  }
}
@media (max-width: 480px) {
  .site-footer__inner {
    grid-template-columns: 1fr;
  }
}
</style>
