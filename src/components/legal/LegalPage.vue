<script setup lang="ts">
import MarketingNav from '@/components/marketing/MarketingNav.vue'
import SiteFooter from '@/components/marketing/SiteFooter.vue'

/**
 * Shared shell for the static legal pages (task 021): marketing nav, a centered
 * prose column, and the site footer. Children pass a title, an effective date,
 * and the document body via the default slot.
 */
defineProps<{
  title: string
  /** Human-readable effective / last-updated date. */
  updated: string
}>()
</script>

<template>
  <div class="legal-page">
    <MarketingNav />
    <main class="legal-page__main">
      <article class="legal-prose">
        <header class="legal-prose__head">
          <h1>{{ title }}</h1>
          <p class="legal-prose__meta">Last updated: {{ updated }}</p>
        </header>
        <slot />
      </article>
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.legal-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.legal-page__main {
  flex: 1;
  width: 100%;
  padding: 3rem 1.5rem 4rem;
}
.legal-prose {
  max-width: 760px;
  margin: 0 auto;
}
.legal-prose__head {
  margin-bottom: 1.5rem;
}
.legal-prose__head h1 {
  margin: 0 0 0.5rem;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
}
.legal-prose__meta {
  margin: 0;
  color: #94a3b8;
  font-size: 0.875rem;
}
/* Prose styling applied to slotted content (deep, since it's unscoped markup). */
.legal-prose :deep(h2) {
  margin: 2.25rem 0 0.75rem;
  font-size: 1.3rem;
}
.legal-prose :deep(h3) {
  margin: 1.5rem 0 0.5rem;
  font-size: 1.05rem;
  color: var(--bdg-deep);
}
.legal-prose :deep(p),
.legal-prose :deep(li) {
  color: #334155;
  font-size: 0.95rem;
  line-height: 1.7;
}
.legal-prose :deep(p) {
  margin: 0 0 1rem;
}
.legal-prose :deep(ul),
.legal-prose :deep(ol) {
  margin: 0 0 1rem;
  padding-left: 1.4rem;
}
.legal-prose :deep(li) {
  margin-bottom: 0.4rem;
}
.legal-prose :deep(a) {
  color: var(--bdg-blue);
  text-decoration: none;
}
.legal-prose :deep(a:hover) {
  text-decoration: underline;
}
.legal-prose :deep(strong) {
  color: var(--bdg-deep);
}
.legal-prose :deep(code) {
  background: #f1f5f9;
  padding: 0.05rem 0.35rem;
  border-radius: 0.25rem;
  font-size: 0.85em;
  color: #0f172a;
}
.legal-prose :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 1.25rem;
  font-size: 0.9rem;
}
.legal-prose :deep(th),
.legal-prose :deep(td) {
  border: 1px solid var(--bdg-border);
  padding: 0.6rem 0.75rem;
  text-align: left;
  vertical-align: top;
  color: #334155;
}
.legal-prose :deep(th) {
  background: #f8fafc;
  font-weight: 600;
  color: var(--bdg-deep);
}
.legal-prose :deep(hr) {
  border: none;
  border-top: 1px solid var(--bdg-border);
  margin: 2rem 0;
}
</style>
