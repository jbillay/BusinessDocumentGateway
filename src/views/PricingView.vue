<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import Tag from 'primevue/tag'
import MarketingNav from '@/components/marketing/MarketingNav.vue'
import SiteFooter from '@/components/marketing/SiteFooter.vue'
import { hasStoredSession } from '@/lib/session'
import { PLAN_BUSINESS, PLAN_FREE, PLAN_PRO, PRICING_FAQ, PRO_PRICES } from '@/lib/plans'

/**
 * Public pricing page on the shared marketing shell. Annual is the headline
 * price (task 018); plan data comes from lib/plans.ts, shared with the
 * landing teaser.
 */
const router = useRouter()

const INTERVALS = [
  { label: 'Annual — save 21%', value: 'year' },
  { label: 'Monthly', value: 'month' },
]
const interval = ref<'month' | 'year'>('year')

const proPrice = computed(() => (interval.value === 'year' ? PRO_PRICES.annual : PRO_PRICES.monthly))
const proPriceNote = computed(() =>
  interval.value === 'year'
    ? `per month, billed annually ($${PRO_PRICES.annualTotal}/year)`
    : 'per month, billed monthly',
)

/** Signed-in users go straight to billing; new visitors sign up first. */
function choosePlan() {
  if (hasStoredSession()) router.push({ name: 'billing' })
  else router.push({ name: 'register' })
}
</script>

<template>
  <div class="pricing-page">
    <MarketingNav />

    <main id="main" class="pricing-main">
      <div class="pricing-hero">
        <h1>Simple pricing for collecting documents</h1>
        <p>Start free forever — no card, no trial clock. Upgrade when your client volume does.</p>
        <SelectButton
          v-model="interval"
          :options="INTERVALS"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          aria-label="Billing interval"
        />
      </div>

      <div class="pricing-grid">
        <!-- Free -->
        <section class="bdg-card pricing-card">
          <h2 class="pricing-card__name">Free</h2>
          <div class="pricing-card__price"><span class="amount">$0</span><span class="per">forever</span></div>
          <p class="pricing-card__who">Try the full workflow with real clients.</p>
          <ul class="pricing-card__list">
            <li v-for="line in PLAN_FREE" :key="line.text" :class="{ 'is-muted': line.muted }">
              <template v-if="line.strong"><strong>{{ line.strong }}</strong>&nbsp;</template>{{ line.text }}
            </li>
          </ul>
          <Button label="Start for free" outlined @click="choosePlan" />
        </section>

        <!-- Pro -->
        <section class="bdg-card pricing-card pricing-card--featured">
          <Tag value="Most popular" class="pricing-card__flag" />
          <h2 class="pricing-card__name">Pro</h2>
          <div class="pricing-card__price">
            <span class="amount">${{ proPrice }}</span
            ><span class="per">{{ proPriceNote }}</span>
          </div>
          <p class="pricing-card__who">Solo professionals and small practices running steady client volume.</p>
          <ul class="pricing-card__list">
            <li v-for="line in PLAN_PRO" :key="line.text" :class="{ 'is-muted': line.muted }">
              <template v-if="line.strong"><strong>{{ line.strong }}</strong>&nbsp;</template>{{ line.text }}
            </li>
          </ul>
          <Button label="Upgrade to Pro" @click="choosePlan" />
        </section>

        <!-- Business teaser -->
        <section class="bdg-card pricing-card pricing-card--soon">
          <h2 class="pricing-card__name">Business</h2>
          <div class="pricing-card__price"><span class="amount">Coming soon</span></div>
          <p class="pricing-card__who">For firms running document collection as a core process.</p>
          <ul class="pricing-card__list">
            <li v-for="line in PLAN_BUSINESS" :key="line.text" :class="{ 'is-muted': line.muted }">
              <template v-if="line.strong"><strong>{{ line.strong }}</strong>&nbsp;</template>{{ line.text }}
            </li>
          </ul>
          <Button label="Coming soon" outlined disabled />
        </section>
      </div>

      <section class="pricing-faq">
        <h2>Questions, answered</h2>
        <div class="pricing-faq__grid">
          <div v-for="item in PRICING_FAQ" :key="item.q" class="bdg-card pricing-faq__item">
            <h3>{{ item.q }}</h3>
            <p>{{ item.a }}</p>
          </div>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<style scoped>
.pricing-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.pricing-main {
  flex: 1;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
}
.pricing-hero {
  text-align: center;
  margin-bottom: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
.pricing-hero h1 {
  margin: 0;
  font-size: clamp(1.6rem, 4vw, 2.25rem);
}
.pricing-hero p {
  margin: 0 0 0.75rem;
  color: #64748b;
  font-size: 1.05rem;
}
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  align-items: stretch;
}
.pricing-card {
  position: relative;
  padding: 1.75rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.pricing-card--featured {
  border: 2px solid var(--bdg-blue, #3b82f6);
}
.pricing-card--soon {
  opacity: 0.85;
}
.pricing-card__flag {
  position: absolute;
  top: -0.8rem;
  left: 1.25rem;
}
.pricing-card__name {
  margin: 0;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}
.pricing-card--featured .pricing-card__name {
  color: var(--bdg-blue, #3b82f6);
}
.pricing-card__price {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.pricing-card__price .amount {
  font-size: 2rem;
  font-weight: 700;
  color: var(--bdg-deep);
}
.pricing-card__price .per {
  color: #64748b;
  font-size: 0.85rem;
}
.pricing-card__who {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  min-height: 2.6em;
}
.pricing-card__list {
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--bdg-deep);
  flex: 1;
}
.pricing-card__list li.is-muted {
  color: #94a3b8;
}
.pricing-faq {
  margin-top: 3rem;
}
.pricing-faq h2 {
  text-align: center;
  margin: 0 0 1.5rem;
}
.pricing-faq__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
}
.pricing-faq__item {
  padding: 1.25rem 1.5rem;
}
.pricing-faq__item h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}
.pricing-faq__item p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.55;
}
</style>
