<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import Tag from 'primevue/tag'
import BrandLogo from '@/components/brand/BrandLogo.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Public pricing page. Annual is the headline price (task 018); limits shown
 * here must match plan_limits() in the database — update both together.
 */
const router = useRouter()
const auth = useAuthStore()

const INTERVALS = [
  { label: 'Annual — save 21%', value: 'year' },
  { label: 'Monthly', value: 'month' },
]
const interval = ref<'month' | 'year'>('year')

const proPrice = computed(() => (interval.value === 'year' ? 15 : 19))
const proPriceNote = computed(() =>
  interval.value === 'year' ? 'per month, billed annually ($180/year)' : 'per month, billed monthly',
)

/** Signed-in users go straight to billing; new visitors sign up first. */
function choosePlan() {
  if (auth.isAuthenticated) router.push({ name: 'billing' })
  else router.push({ name: 'register' })
}

const FAQ = [
  {
    q: 'What counts as an active request?',
    a: 'A request that is Pending, Awaiting Client, or In Review. Completed and expired requests don’t count — completing or deleting a request frees a slot immediately, so light users never outgrow Free.',
  },
  {
    q: 'What happens when I hit a limit?',
    a: 'Nothing breaks. Existing requests keep working and your clients can keep uploading — you just can’t open new requests until you free a slot or upgrade.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, in two clicks from the billing page. You keep Pro until the end of the period you paid for, then move back to Free. Your data stays.',
  },
  {
    q: 'Is client data secure on the Free plan?',
    a: 'Yes. Access codes, link expiry, and the review workflow are included in every plan — security is never paywalled.',
  },
]
</script>

<template>
  <div class="pricing-page">
    <header class="pricing-nav bdg-glass">
      <router-link :to="{ name: 'login' }" class="pricing-nav__brand"><BrandLogo :size="30" /></router-link>
      <div class="pricing-nav__actions">
        <Button
          v-if="!auth.isAuthenticated"
          label="Sign in"
          text
          severity="secondary"
          @click="router.push({ name: 'login' })"
        />
        <Button v-else label="Dashboard" text severity="secondary" @click="router.push({ name: 'dashboard' })" />
      </div>
    </header>

    <main class="pricing-main">
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
            <li><strong>3</strong>&nbsp;active requests</li>
            <li><strong>1 GB</strong>&nbsp;storage</li>
            <li><strong>10</strong>&nbsp;library documents</li>
            <li>Client portal with access code &amp; link expiry</li>
            <li>Review workflow &amp; ZIP download</li>
            <li>Manual reminders</li>
            <li class="is-muted">"Powered by BDG" badge on portals</li>
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
            <li><strong>25</strong>&nbsp;active requests</li>
            <li><strong>25 GB</strong>&nbsp;storage</li>
            <li><strong>Unlimited</strong>&nbsp;library documents</li>
            <li>Everything in Free, plus:</li>
            <li>Custom portal branding — your logo &amp; colours</li>
            <li>No BDG badge on client portals</li>
            <li>Automatic scheduled reminders</li>
            <li>Email support</li>
          </ul>
          <Button label="Upgrade to Pro" @click="choosePlan" />
        </section>

        <!-- Business teaser -->
        <section class="bdg-card pricing-card pricing-card--soon">
          <h2 class="pricing-card__name">Business</h2>
          <div class="pricing-card__price"><span class="amount">Coming soon</span></div>
          <p class="pricing-card__who">For firms running document collection as a core process.</p>
          <ul class="pricing-card__list">
            <li><strong>100</strong>&nbsp;active requests</li>
            <li><strong>100 GB</strong>&nbsp;storage</li>
            <li>Request templates &amp; bulk send</li>
            <li>Team roles &amp; audit trail</li>
            <li>API &amp; integrations</li>
            <li>Priority support + onboarding</li>
          </ul>
          <Button label="Coming soon" outlined disabled />
        </section>
      </div>

      <section class="pricing-faq">
        <h2>Questions, answered</h2>
        <div class="pricing-faq__grid">
          <div v-for="item in FAQ" :key="item.q" class="bdg-card pricing-faq__item">
            <h3>{{ item.q }}</h3>
            <p>{{ item.a }}</p>
          </div>
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.pricing-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.pricing-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 1.5rem;
}
.pricing-nav__brand {
  text-decoration: none;
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
