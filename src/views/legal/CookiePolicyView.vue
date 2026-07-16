<script setup lang="ts">
import Button from 'primevue/button'
import LegalPage from '@/components/legal/LegalPage.vue'
import { useCookieConsentStore } from '@/stores/cookieConsent'
import { CONTACT_EMAIL } from '@/lib/contact'

const consent = useCookieConsentStore()
</script>

<template>
  <LegalPage title="Cookie Policy" updated="16 July 2026">
    <p>
      This Cookie Policy explains how the Business Document Gateway service (the "<strong>Service</strong>") uses
      cookies and similar technologies such as browser local storage, and how you can control them. It should be read
      together with our <router-link :to="{ name: 'privacy' }">Privacy Policy</router-link>.
    </p>

    <h2>1. What are cookies?</h2>
    <p>
      Cookies are small text files stored on your device when you visit a website. "Local storage" is a related
      technology used to keep information in your browser. We use both to run the Service and, with your permission, to
      improve it.
    </p>

    <h2>2. Categories we use</h2>
    <h3>Strictly necessary <em>(always active)</em></h3>
    <p>
      These are required for the Service to function and cannot be switched off. They keep you signed in (your
      authentication session), remember your cookie choices, and support security. Because they are essential, we do not
      need your consent for them.
    </p>
    <h3>Analytics <em>(optional — off until you consent)</em></h3>
    <p>
      With your consent, we may use analytics to understand, in aggregate and anonymised form, how the Service is used
      so we can improve it. These are never set before you opt in.
    </p>
    <h3>Marketing <em>(optional — off until you consent)</em></h3>
    <p>
      With your consent, we may use marketing cookies to measure the effectiveness of our campaigns. These are off by
      default and only used if you opt in.
    </p>

    <h2>3. Managing your choices</h2>
    <p>
      You can change your decision at any time. Use the button below (also available as "Cookie settings" in the site
      footer) to review and update your preferences.
    </p>
    <p>
      <Button label="Manage cookie settings" icon="pi pi-sliders-h" outlined @click="consent.openSettings()" />
    </p>
    <p>
      You can also block or delete cookies through your browser settings. Note that disabling strictly necessary cookies
      may prevent you from signing in or using parts of the Service.
    </p>

    <h2>4. Changes to this policy</h2>
    <p>
      We may update this Cookie Policy as our use of cookies evolves. If our categories change materially, we will ask
      for your consent again where required.
    </p>

    <h2>5. Contact</h2>
    <p>
      Questions about our use of cookies? Contact us at <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>.
    </p>
  </LegalPage>
</template>
