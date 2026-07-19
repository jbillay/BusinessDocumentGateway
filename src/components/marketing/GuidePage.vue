<script setup lang="ts">
import MarketingNav from '@/components/marketing/MarketingNav.vue'
import SiteFooter from '@/components/marketing/SiteFooter.vue'

/**
 * Shared shell for the SEO guide pages: marketing nav, a readable prose
 * column, a standard closing CTA, and the site footer. Children pass the
 * title/lede and the article body via the default slot.
 */
defineProps<{
  title: string
  /** One-sentence standfirst under the title. */
  lede: string
  /** Human-readable publication / last-updated date. */
  updated: string
}>()
</script>

<template>
  <div class="guide-page">
    <MarketingNav />
    <main id="main" class="guide-page__main">
      <article class="guide-prose">
        <header class="guide-prose__head">
          <p class="bdg-label-sm">Guide</p>
          <h1>{{ title }}</h1>
          <p class="guide-prose__lede">{{ lede }}</p>
          <p class="guide-prose__meta">Last updated: {{ updated }}</p>
        </header>
        <slot />
        <aside class="guide-prose__cta bdg-card">
          <h2>Stop chasing documents by hand</h2>
          <p>
            Business Document Gateway sends your clients one secure link, reminds them automatically, and hands you
            every file in a single ZIP. Free forever — no card required.
          </p>
          <router-link class="bdg-btn bdg-btn--primary" :to="{ name: 'register' }">
            Start for free <i class="pi pi-arrow-right" />
          </router-link>
        </aside>
      </article>
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.guide-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.guide-page__main {
  flex: 1;
  width: 100%;
  padding: 3rem 1.5rem 4rem;
}
.guide-prose {
  max-width: 760px;
  margin: 0 auto;
}
.guide-prose__head {
  margin-bottom: 2rem;
}
.guide-prose__head h1 {
  margin: 0.5rem 0;
  font-size: clamp(1.75rem, 4vw, 2.4rem);
  line-height: 1.15;
}
.guide-prose__lede {
  margin: 0 0 0.75rem;
  color: #475569;
  font-size: 1.1rem;
  line-height: 1.6;
}
.guide-prose__meta {
  margin: 0;
  color: #94a3b8;
  font-size: 0.875rem;
}

.guide-prose :deep(h2) {
  margin: 2.25rem 0 0.75rem;
  font-size: 1.35rem;
}
.guide-prose :deep(h3) {
  margin: 1.5rem 0 0.5rem;
  font-size: 1.05rem;
  color: var(--bdg-deep);
}
.guide-prose :deep(p),
.guide-prose :deep(li) {
  color: #334155;
  font-size: 0.98rem;
  line-height: 1.7;
}
.guide-prose :deep(p) {
  margin: 0 0 1rem;
}
.guide-prose :deep(ul),
.guide-prose :deep(ol) {
  margin: 0 0 1rem;
  padding-left: 1.4rem;
}
.guide-prose :deep(li) {
  margin-bottom: 0.4rem;
}
.guide-prose :deep(a) {
  color: var(--bdg-blue);
  text-decoration: none;
}
.guide-prose :deep(a:hover) {
  text-decoration: underline;
}
.guide-prose :deep(strong) {
  color: var(--bdg-deep);
}
.guide-prose :deep(blockquote) {
  margin: 0 0 1rem;
  padding: 0.75rem 1.25rem;
  border-left: 3px solid var(--bdg-blue);
  background: #f8fafc;
  border-radius: 0 0.5rem 0.5rem 0;
}

.guide-prose__cta {
  margin-top: 3rem;
  padding: 2rem;
  text-align: center;
}
.guide-prose__cta h2 {
  margin: 0 0 0.5rem;
  font-size: 1.3rem;
}
.guide-prose__cta p {
  margin: 0 auto 1.25rem;
  max-width: 32rem;
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.6;
}
</style>
