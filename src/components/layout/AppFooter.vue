<script setup lang="ts">
import { useCookieConsentStore } from '@/stores/cookieConsent'

const consent = useCookieConsentStore()
</script>

<template>
  <footer class="app-footer">
    <span>© {{ new Date().getFullYear() }} Business Document Gateway™ — Secure document collection.</span>
    <nav class="app-footer__links" aria-label="Legal">
      <router-link :to="{ name: 'terms' }">Terms</router-link>
      <router-link :to="{ name: 'privacy' }">Privacy</router-link>
      <router-link :to="{ name: 'dpa' }">DPA</router-link>
      <router-link :to="{ name: 'cookie-policy' }">Cookies</router-link>
      <button type="button" class="app-footer__linkbtn" @click="consent.openSettings()">Cookie settings</button>
    </nav>
  </footer>
</template>

<style scoped>
.app-footer {
  margin-top: auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  text-align: center;
  font-size: 0.8rem;
  color: #64748b;
  border-top: 1px solid var(--bdg-border);
  background: #ffffff;
}
.app-footer__links {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
}
.app-footer__links a,
.app-footer__linkbtn {
  color: #64748b;
  text-decoration: none;
  font-size: 0.8rem;
  transition: color 0.15s ease;
}
.app-footer__links a:hover,
.app-footer__linkbtn:hover {
  color: var(--bdg-blue);
}
.app-footer__linkbtn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font: inherit;
}
</style>
