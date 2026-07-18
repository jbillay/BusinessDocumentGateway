<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import MarketingNav from '@/components/marketing/MarketingNav.vue'
import SiteFooter from '@/components/marketing/SiteFooter.vue'
import { useAuthStore } from '@/stores/auth'
import { CONTACT_EMAIL } from '@/lib/contact'

/**
 * Public commercial landing page (task 020). Sections: hero, value metrics,
 * how it works, features, benefits, pricing teaser, and a contact form that
 * composes a message via the visitor's mail client (mailto).
 */
const router = useRouter()
const auth = useAuthStore()

function getStarted() {
  router.push(auth.isAuthenticated ? { name: 'dashboard' } : { name: 'register' })
}

const STEPS = [
  {
    icon: 'pi pi-list-check',
    title: 'Build the request',
    body: 'Pick the documents you need — from scratch or a saved checklist — set a due date, and add an access code if you want one.',
  },
  {
    icon: 'pi pi-send',
    title: 'Send a secure link',
    body: 'Your client gets a branded portal link. No account, no app to install — they just open it and upload.',
  },
  {
    icon: 'pi pi-verified',
    title: 'Review & download',
    body: 'Approve or reject each file, get notified as they arrive, and download everything as a single ZIP when complete.',
  },
]

const FEATURES = [
  {
    icon: 'pi pi-shield',
    title: 'Secure by default',
    body: 'Access codes, expiring links, and per-account data isolation — security is included on every plan, never paywalled.',
  },
  {
    icon: 'pi pi-check-circle',
    title: 'Review workflow',
    body: 'Approve or reject documents individually. Rejected items reopen for the client while approved ones stay locked.',
  },
  {
    icon: 'pi pi-palette',
    title: 'Your branding',
    body: 'Put your logo, colours, and headline on the client portal so the whole experience looks like you.',
  },
  {
    icon: 'pi pi-bell',
    title: 'Automatic reminders',
    body: 'Stop chasing. Scheduled reminders nudge clients who haven’t uploaded yet, so requests get finished.',
  },
  {
    icon: 'pi pi-book',
    title: 'Reusable library',
    body: 'Save the document sets you request again and again, and spin up a new request in seconds.',
  },
  {
    icon: 'pi pi-download',
    title: 'One-click export',
    body: 'Download every file collected against a request as a single, tidy ZIP — no more digging through email.',
  },
]

const METRICS = [
  { value: 'Minutes', label: 'to set up a request, not hours of email' },
  { value: 'Zero', label: 'logins for your clients — just a link' },
  { value: '1 ZIP', label: 'to download everything, neatly named' },
]

const BENEFITS = [
  {
    icon: 'pi pi-clock',
    title: 'Save hours every week',
    body: 'Replace the endless “did you send that yet?” email thread with one link and automatic reminders. What took a dozen messages now takes one.',
  },
  {
    icon: 'pi pi-heart',
    title: 'Look effortlessly professional',
    body: 'Clients get a clean, branded, mobile-friendly portal instead of a confusing inbox. A better first impression, every time.',
  },
  {
    icon: 'pi pi-lock',
    title: 'Keep sensitive files safe',
    body: 'Documents move through access-controlled links with expiry and optional codes — far safer than attachments flying around email.',
  },
]

// --- Contact form (mailto) --------------------------------------------------
const contact = reactive({ name: '', email: '', message: '' })
const contactErrors = reactive<{ name?: string; email?: string; message?: string }>({})
const contactSent = ref(false)

function submitContact() {
  contactErrors.name = contact.name ? undefined : 'Please tell us your name.'
  contactErrors.email = !contact.email
    ? 'Please add your email so we can reply.'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)
      ? 'Enter a valid email address.'
      : undefined
  contactErrors.message = contact.message ? undefined : 'Let us know how we can help.'
  if (contactErrors.name || contactErrors.email || contactErrors.message) return

  const subject = encodeURIComponent(`Business Document Gateway enquiry from ${contact.name}`)
  const body = encodeURIComponent(`${contact.message}\n\n— ${contact.name} (${contact.email})`)
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
  contactSent.value = true
}
</script>

<template>
  <div class="landing">
    <MarketingNav />

    <!-- Hero -->
    <section class="hero">
      <div class="hero__inner">
        <div class="hero__copy">
          <span class="hero__eyebrow">Document collection, handled</span>
          <h1 class="hero__title">Collect client documents without the email back-and-forth</h1>
          <p class="hero__lead">
            Business Document Gateway sends your clients one secure link, reminds them for you, and hands you every file
            neatly in one place. No accounts for them. No chasing for you.
          </p>
          <div class="hero__cta">
            <Button label="Start for free" icon="pi pi-arrow-right" icon-pos="right" size="large" @click="getStarted" />
            <Button
              label="See how it works"
              text
              severity="secondary"
              size="large"
              @click="router.push({ name: 'landing', hash: '#how' })"
            />
          </div>
          <p class="hero__note"><i class="pi pi-check" /> Free forever — no card, no trial clock.</p>
        </div>

        <!-- Product preview mock -->
        <div class="hero__preview" aria-hidden="true">
          <div class="mock bdg-card">
            <div class="mock__head">
              <span class="mock__dot" /><span class="mock__dot" /><span class="mock__dot" />
              <span class="mock__url">yourfirm.bdg.app/portal</span>
            </div>
            <div class="mock__body">
              <div class="mock__title-row">
                <div>
                  <div class="mock__label">Document request</div>
                  <div class="mock__req">Onboarding — Acme Ltd</div>
                </div>
                <span class="mock__badge">3 of 4 done</span>
              </div>
              <div class="mock__bar"><span style="width: 75%" /></div>
              <ul class="mock__list">
                <li class="is-done"><i class="pi pi-check-circle" /> Signed engagement letter</li>
                <li class="is-done"><i class="pi pi-check-circle" /> Proof of identity</li>
                <li class="is-done"><i class="pi pi-check-circle" /> Bank statement (last 3 months)</li>
                <li class="is-pending"><i class="pi pi-circle" /> VAT registration certificate</li>
              </ul>
              <div class="mock__foot"><i class="pi pi-clock" /> Due in 5 days · secured with access code</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Value metrics -->
    <section class="metrics">
      <div class="metrics__inner">
        <div v-for="m in METRICS" :key="m.label" class="metrics__item">
          <div class="metrics__value">{{ m.value }}</div>
          <div class="metrics__label">{{ m.label }}</div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section id="how" class="section">
      <div class="section__inner">
        <header class="section__head">
          <span class="bdg-label-sm">How it works</span>
          <h2>From request to done in three steps</h2>
          <p>Built for solo professionals and small teams who collect paperwork from clients again and again.</p>
        </header>
        <div class="steps">
          <div v-for="(step, i) in STEPS" :key="step.title" class="steps__item">
            <div class="steps__num">{{ i + 1 }}</div>
            <div class="steps__icon"><i :class="step.icon" /></div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.body }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="section section--alt">
      <div class="section__inner">
        <header class="section__head">
          <span class="bdg-label-sm">Features</span>
          <h2>Everything you need to collect documents properly</h2>
          <p>Thoughtful defaults, a professional client experience, and no busywork.</p>
        </header>
        <div class="features">
          <div v-for="f in FEATURES" :key="f.title" class="features__card bdg-card bdg-card--hover">
            <span class="features__icon"><i :class="f.icon" /></span>
            <h3>{{ f.title }}</h3>
            <p>{{ f.body }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Benefits -->
    <section class="section">
      <div class="section__inner">
        <header class="section__head">
          <span class="bdg-label-sm">Why teams switch</span>
          <h2>Less chasing. Happier clients. Safer files.</h2>
        </header>
        <div class="benefits">
          <div v-for="b in BENEFITS" :key="b.title" class="benefits__item">
            <span class="benefits__icon"><i :class="b.icon" /></span>
            <div>
              <h3>{{ b.title }}</h3>
              <p>{{ b.body }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing teaser -->
    <section id="pricing" class="section section--alt">
      <div class="section__inner">
        <header class="section__head">
          <span class="bdg-label-sm">Pricing</span>
          <h2>Start free. Upgrade when your volume does.</h2>
          <p>No card to get started, and security is included on every plan.</p>
        </header>
        <div class="plans">
          <div class="plans__card bdg-card">
            <h3 class="plans__name">Free</h3>
            <div class="plans__price"><span class="amount">$0</span><span class="per">forever</span></div>
            <ul class="plans__list">
              <li><i class="pi pi-check" /> 3 active requests</li>
              <li><i class="pi pi-check" /> 1 GB storage</li>
              <li><i class="pi pi-check" /> 10 library documents</li>
              <li><i class="pi pi-check" /> Access codes, link expiry & review</li>
            </ul>
            <Button label="Start for free" outlined class="w-full" @click="getStarted" />
          </div>
          <div class="plans__card plans__card--featured bdg-card">
            <span class="plans__flag">Most popular</span>
            <h3 class="plans__name">Pro</h3>
            <div class="plans__price">
              <span class="amount">$15</span><span class="per">/mo billed annually</span>
            </div>
            <ul class="plans__list">
              <li><i class="pi pi-check" /> 25 active requests</li>
              <li><i class="pi pi-check" /> 25 GB storage</li>
              <li><i class="pi pi-check" /> Unlimited library documents</li>
              <li><i class="pi pi-check" /> Custom branding & auto reminders</li>
            </ul>
            <Button label="See full pricing" icon="pi pi-arrow-right" icon-pos="right" class="w-full" @click="router.push({ name: 'pricing' })" />
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="cta">
      <div class="cta__inner">
        <h2>Ready to stop chasing documents?</h2>
        <p>Create your first request in minutes — free, no card required.</p>
        <Button label="Get started free" icon="pi pi-arrow-right" icon-pos="right" size="large" @click="getStarted" />
      </div>
    </section>

    <!-- Contact -->
    <section id="contact" class="section">
      <div class="section__inner contact">
        <div class="contact__intro">
          <span class="bdg-label-sm">Contact us</span>
          <h2>Questions? We’re happy to help.</h2>
          <p>
            Tell us what you’re trying to do and we’ll get back to you. Prefer email? Reach us directly at
            <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>.
          </p>
        </div>
        <form class="contact__form bdg-card" @submit.prevent="submitContact" novalidate>
          <div v-if="contactSent" class="contact__sent">
            <i class="pi pi-check-circle" />
            <p>Your email draft is ready in your mail app. Send it and we’ll be in touch soon.</p>
          </div>
          <template v-else>
            <div class="bdg-field">
              <label for="c-name">Name</label>
              <InputText id="c-name" v-model.trim="contact.name" :invalid="!!contactErrors.name" autocomplete="name" />
              <small v-if="contactErrors.name" class="p-error">{{ contactErrors.name }}</small>
            </div>
            <div class="bdg-field">
              <label for="c-email">Email</label>
              <InputText id="c-email" v-model.trim="contact.email" type="email" placeholder="name@company.com" :invalid="!!contactErrors.email" autocomplete="email" />
              <small v-if="contactErrors.email" class="p-error">{{ contactErrors.email }}</small>
            </div>
            <div class="bdg-field">
              <label for="c-message">How can we help?</label>
              <Textarea id="c-message" v-model.trim="contact.message" rows="4" auto-resize :invalid="!!contactErrors.message" />
              <small v-if="contactErrors.message" class="p-error">{{ contactErrors.message }}</small>
            </div>
            <Button type="submit" label="Send message" icon="pi pi-send" icon-pos="right" class="w-full" />
          </template>
        </form>
      </div>
    </section>

    <SiteFooter />
  </div>
</template>

<style scoped>
.landing {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ---- Hero ---- */
.hero {
  background:
    radial-gradient(ellipse 55% 45% at 12% 0%, rgba(74, 86, 176, 0.1), transparent),
    radial-gradient(ellipse 50% 50% at 92% 30%, rgba(6, 182, 212, 0.12), transparent),
    var(--bdg-canvas);
}
.hero__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 4.5rem 1.5rem 4rem;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 3rem;
  align-items: center;
}
.hero__eyebrow {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--bdg-blue);
  background: rgba(59, 130, 246, 0.1);
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  margin-bottom: 1.25rem;
}
.hero__title {
  margin: 0 0 1.125rem;
  font-size: clamp(2.1rem, 5vw, 3.25rem);
  line-height: 1.08;
  letter-spacing: -0.03em;
}
.hero__lead {
  margin: 0 0 1.75rem;
  color: #475569;
  font-size: 1.125rem;
  line-height: 1.6;
  max-width: 34rem;
}
.hero__cta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.hero__note {
  margin: 1.25rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
}
.hero__note i {
  color: #059669;
  margin-right: 0.35rem;
}

/* Product mock */
.hero__preview {
  perspective: 1600px;
}
.mock {
  overflow: hidden;
  transform: rotateY(-9deg) rotateX(3deg);
  transform-origin: center;
}
.mock__head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.7rem 1rem;
  background: #f1f5f9;
  border-bottom: 1px solid var(--bdg-border);
}
.mock__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #cbd5e1;
}
.mock__url {
  margin-left: 0.5rem;
  font-size: 0.72rem;
  color: #94a3b8;
}
.mock__body {
  padding: 1.375rem 1.5rem 1.5rem;
}
.mock__title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.875rem;
}
.mock__label {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #94a3b8;
}
.mock__req {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--bdg-deep);
}
.mock__badge {
  flex-shrink: 0;
  font-size: 0.72rem;
  font-weight: 600;
  color: #047857;
  background: rgba(5, 150, 105, 0.12);
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
}
.mock__bar {
  height: 7px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
  margin-bottom: 1.125rem;
}
.mock__bar span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--bdg-gradient);
}
.mock__list {
  list-style: none;
  margin: 0 0 1.125rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.mock__list li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9rem;
  color: var(--bdg-deep);
}
.mock__list li.is-done i {
  color: #059669;
}
.mock__list li.is-pending {
  color: #94a3b8;
}
.mock__list li.is-pending i {
  color: #cbd5e1;
}
.mock__foot {
  font-size: 0.78rem;
  color: #94a3b8;
  border-top: 1px solid var(--bdg-border);
  padding-top: 0.875rem;
}
.mock__foot i {
  margin-right: 0.3rem;
}

/* ---- Metrics ---- */
.metrics {
  border-top: 1px solid var(--bdg-border);
  border-bottom: 1px solid var(--bdg-border);
  background: #ffffff;
}
.metrics__inner {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2.25rem 1.5rem;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  text-align: center;
}
.metrics__value {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: var(--bdg-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.metrics__label {
  margin-top: 0.35rem;
  color: #64748b;
  font-size: 0.9rem;
}

/* ---- Generic section ---- */
.section {
  padding: 4.5rem 0;
}
/* Anchor targets clear the sticky header when scrolled to. */
.section[id] {
  scroll-margin-top: 4.5rem;
}
.section--alt {
  background: #ffffff;
  border-top: 1px solid var(--bdg-border);
  border-bottom: 1px solid var(--bdg-border);
}
.section__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}
.section__head {
  text-align: center;
  max-width: 40rem;
  margin: 0 auto 2.75rem;
}
.section__head h2 {
  margin: 0.5rem 0 0.75rem;
  font-size: clamp(1.6rem, 3.5vw, 2.25rem);
}
.section__head p {
  margin: 0;
  color: #64748b;
  font-size: 1.05rem;
  line-height: 1.6;
}

/* ---- Steps ---- */
.steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
.steps__item {
  position: relative;
  padding: 1.75rem 1.5rem;
  text-align: center;
}
.steps__num {
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  font-size: 2.25rem;
  font-weight: 800;
  color: #eef2f7;
  line-height: 1;
}
.steps__icon {
  width: 3rem;
  height: 3rem;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.9rem;
  background: rgba(59, 130, 246, 0.1);
  color: var(--bdg-blue);
  font-size: 1.25rem;
}
.steps__item h3 {
  margin: 0 0 0.5rem;
  font-size: 1.15rem;
}
.steps__item p {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.6;
}

/* ---- Features ---- */
.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}
.features__card {
  padding: 1.5rem;
}
.features__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.8rem;
  background: var(--bdg-gradient);
  color: #fff;
  font-size: 1.15rem;
  margin-bottom: 1rem;
}
.features__card h3 {
  margin: 0 0 0.5rem;
  font-size: 1.05rem;
}
.features__card p {
  margin: 0;
  color: #64748b;
  font-size: 0.925rem;
  line-height: 1.6;
}

/* ---- Benefits ---- */
.benefits {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}
.benefits__item {
  display: flex;
  gap: 1rem;
}
.benefits__icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.8rem;
  background: rgba(6, 182, 212, 0.12);
  color: #0891b2;
  font-size: 1.15rem;
}
.benefits__item h3 {
  margin: 0.15rem 0 0.4rem;
  font-size: 1.1rem;
}
.benefits__item p {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.6;
}

/* ---- Pricing teaser ---- */
.plans {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 22rem));
  gap: 1.5rem;
  justify-content: center;
}
.plans__card {
  position: relative;
  padding: 1.75rem 1.625rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}
.plans__card--featured {
  border: 2px solid var(--bdg-blue);
}
.plans__flag {
  position: absolute;
  top: -0.75rem;
  left: 1.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: #fff;
  background: var(--bdg-blue);
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
}
.plans__name {
  margin: 0;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}
.plans__card--featured .plans__name {
  color: var(--bdg-blue);
}
.plans__price {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}
.plans__price .amount {
  font-size: 2rem;
  font-weight: 700;
  color: var(--bdg-deep);
}
.plans__price .per {
  color: #64748b;
  font-size: 0.85rem;
}
.plans__list {
  list-style: none;
  margin: 0.25rem 0 0.5rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  flex: 1;
}
.plans__list li {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.9rem;
  color: var(--bdg-deep);
}
.plans__list li i {
  color: #059669;
  font-size: 0.85rem;
}

/* ---- CTA band ---- */
.cta {
  background: var(--bdg-deep);
  background-image: var(--bdg-gradient);
}
.cta__inner {
  max-width: 720px;
  margin: 0 auto;
  padding: 3.75rem 1.5rem;
  text-align: center;
  color: #fff;
}
.cta__inner h2 {
  margin: 0 0 0.5rem;
  color: #fff;
  font-size: clamp(1.6rem, 3.5vw, 2.1rem);
}
.cta__inner p {
  margin: 0 0 1.75rem;
  color: rgba(255, 255, 255, 0.85);
  font-size: 1.05rem;
}
.cta :deep(.p-button) {
  background: #fff;
  border-color: #fff;
  color: var(--bdg-deep);
}
.cta :deep(.p-button:hover) {
  background: #f1f5f9;
  border-color: #f1f5f9;
  color: var(--bdg-deep);
}

/* ---- Contact ---- */
.contact {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5rem;
  align-items: start;
}
.contact__intro h2 {
  margin: 0.5rem 0 0.75rem;
  font-size: clamp(1.5rem, 3vw, 2rem);
}
.contact__intro p {
  margin: 0;
  color: #64748b;
  font-size: 1rem;
  line-height: 1.6;
}
.contact__intro a {
  color: var(--bdg-blue);
  text-decoration: none;
}
.contact__intro a:hover {
  text-decoration: underline;
}
.contact__form {
  padding: 1.75rem;
}
.contact__sent {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
  padding: 1.5rem 0.5rem;
}
.contact__sent i {
  font-size: 2rem;
  color: #059669;
}
.contact__sent p {
  margin: 0;
  color: #475569;
}

/* ---- Responsive ---- */
@media (max-width: 960px) {
  .hero__inner {
    grid-template-columns: 1fr;
    gap: 2.5rem;
    padding-top: 3rem;
  }
  .hero__preview {
    order: -1;
    max-width: 26rem;
  }
  .mock {
    transform: none;
  }
  .steps,
  .features,
  .benefits {
    grid-template-columns: 1fr 1fr;
  }
  .contact {
    grid-template-columns: 1fr;
    gap: 1.75rem;
  }
}
@media (max-width: 620px) {
  .metrics__inner,
  .steps,
  .features,
  .benefits,
  .plans {
    grid-template-columns: 1fr;
  }
  .plans {
    justify-items: stretch;
  }
}
</style>
