<script setup lang="ts">
import MarketingNav from '@/components/marketing/MarketingNav.vue'
import SiteFooter from '@/components/marketing/SiteFooter.vue'

/**
 * Branded 404 on the marketing shell. Catch-all for unknown URLs — public
 * visitors get routes back into the site instead of a login bounce.
 */
</script>

<template>
  <div class="nf-page">
    <MarketingNav />
    <main id="main" class="nf-main">
      <p class="nf-code" aria-hidden="true">404</p>
      <h1>We can't find that page</h1>
      <p class="nf-lead">
        The link may be out of date, or the address may have a typo. Here's the way back.
      </p>
      <div class="nf-actions">
        <router-link class="bdg-btn bdg-btn--primary" :to="{ name: 'landing' }">
          <i class="pi pi-home" /> Go to the homepage
        </router-link>
        <router-link class="bdg-btn bdg-btn--ghost" :to="{ name: 'pricing' }">See pricing</router-link>
      </div>
      <p class="nf-help">
        Looking for a document request you were sent? Use the exact link from your email — portal links are unique to
        you.
      </p>
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.nf-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.nf-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 1.5rem;
}
.nf-code {
  margin: 0;
  font-size: clamp(4rem, 12vw, 6.5rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  background: var(--bdg-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.nf-main h1 {
  margin: 0.75rem 0 0.5rem;
  font-size: clamp(1.5rem, 4vw, 2rem);
}
.nf-lead {
  margin: 0 0 1.75rem;
  color: #64748b;
  font-size: 1.05rem;
  max-width: 28rem;
}
.nf-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}
.nf-help {
  margin: 2.5rem 0 0;
  color: #94a3b8;
  font-size: 0.875rem;
  max-width: 30rem;
}
</style>
