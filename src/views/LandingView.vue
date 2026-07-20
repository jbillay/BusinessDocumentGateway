<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import MarketingNav from '@/components/marketing/MarketingNav.vue'
import SiteFooter from '@/components/marketing/SiteFooter.vue'
import { hasStoredSession } from '@/lib/session'
import { CONTACT_EMAIL } from '@/lib/contact'
import { PRICING_FAQ, PRO_PRICES, TEASER_FREE, TEASER_PRO } from '@/lib/plans'

/**
 * Public commercial landing page (task 020). Sections: hero, value metrics,
 * how it works, features, benefits, pricing teaser, FAQ teaser, and a contact
 * form that submits through the send-email edge function. Deliberately
 * PrimeVue-free so anonymous visitors get the lightest possible bundle.
 */
const router = useRouter()

function getStarted() {
  router.push(hasStoredSession() ? { name: 'dashboard' } : { name: 'register' })
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

// Truthful trust signals only — practices we actually ship today, no
// certifications or customer counts we don't have.
const TRUST = [
  {
    icon: 'pi pi-lock',
    label: 'Encrypted in transit',
    detail: 'Every portal link and upload travels over HTTPS.',
  },
  {
    icon: 'pi pi-globe',
    label: 'EU data hosting',
    detail: 'Documents are stored in the EU (eu-west-1).',
  },
  {
    icon: 'pi pi-key',
    label: 'Access codes & expiring links',
    detail: 'You decide who gets in, and for how long.',
  },
  {
    icon: 'pi pi-database',
    label: 'Per-account isolation',
    detail: 'Your clients’ files are visible to your account alone.',
  },
]

// Two objection-killers surfaced from the pricing FAQ, shown near the CTA.
const FAQ_TEASER = [PRICING_FAQ[3], PRICING_FAQ[1]]

// --- Contact form (send-email edge function) --------------------------------
const contact = reactive({ name: '', email: '', message: '', website: '' /* honeypot */ })
const contactErrors = reactive<{ name?: string; email?: string; message?: string }>({})
const contactSent = ref(false)
const contactSending = ref(false)
const contactFailed = ref(false)

async function submitContact() {
  contactErrors.name = contact.name ? undefined : 'Please tell us your name.'
  contactErrors.email = !contact.email
    ? 'Please add your email so we can reply.'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)
      ? 'Enter a valid email address.'
      : undefined
  contactErrors.message = contact.message ? undefined : 'Let us know how we can help.'
  if (contactErrors.name || contactErrors.email || contactErrors.message) return

  contactSending.value = true
  contactFailed.value = false
  try {
    // Plain fetch (not supabase.functions.invoke) keeps the Supabase client
    // out of the marketing bundle. The endpoint is unauthenticated for the
    // contact_enquiry type only.
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'contact_enquiry',
        name: contact.name,
        email: contact.email,
        message: contact.message,
        website: contact.website,
      }),
    })
    if (!res.ok) throw new Error(`send failed (${res.status})`)
    contactSent.value = true
  } catch {
    contactFailed.value = true
  } finally {
    contactSending.value = false
  }
}
</script>

<template>
  <div class="landing">
    <MarketingNav />

    <main id="main">
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
            <button type="button" class="bdg-btn bdg-btn--primary bdg-btn--lg" @click="getStarted">
              Start for free <i class="pi pi-arrow-right" />
            </button>
            <router-link :to="{ name: 'landing', hash: '#how' }" custom v-slot="{ href, navigate }">
              <a :href="href" class="bdg-btn bdg-btn--ghost bdg-btn--lg" @click="navigate">See how it works</a>
            </router-link>
          </div>
          <p class="hero__note"><i class="pi pi-check" /> Free forever — no card, no trial clock.</p>
          <p class="hero__audience">For accountants&ensp;·&ensp;bookkeepers&ensp;·&ensp;agencies&ensp;·&ensp;HR&ensp;·&ensp;legal</p>
        </div>

        <!-- Real screenshot of the live client portal (a seeded demo request), framed as a browser window. -->
        <div class="hero__preview">
          <div class="mock bdg-card">
            <div class="mock__head" aria-hidden="true">
              <span class="mock__dot" /><span class="mock__dot" /><span class="mock__dot" />
              <!-- Truthful address: this is what a real portal link looks like today. -->
              <span class="mock__url">business-document-gateway.vercel.app/portal/…</span>
            </div>
            <img
              class="mock__img"
              src="@/assets/portal-screenshot.webp"
              width="1456"
              height="2024"
              alt="The client upload portal for a request named Onboarding — Acme Ltd: 3 of 4 documents uploaded, a drag-and-drop upload area, and one document still pending."
            />
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
    <section id="how" class="section section--full">
      <div class="section__inner">
        <header class="section__head">
          <span class="bdg-label-sm">How it works</span>
          <h2>From request to done in three steps</h2>
          <p>Built for solo professionals and small teams who collect paperwork from clients again and again.</p>
        </header>
        <div class="steps">
          <div v-for="(step, i) in STEPS" :key="step.title" class="steps__card bdg-card bdg-card--hover">
            <div class="steps__top">
              <span class="steps__num" aria-hidden="true">{{ i + 1 }}</span>
              <span class="steps__icon"><i :class="step.icon" /></span>
            </div>
            <h3><span class="bdg-sr-only">Step {{ i + 1 }}: </span>{{ step.title }}</h3>
            <p>{{ step.body }}</p>
          </div>
        </div>
        <div class="steps__cta">
          <button type="button" class="bdg-btn bdg-btn--primary bdg-btn--lg" @click="getStarted">
            Create your first request <i class="pi pi-arrow-right" />
          </button>
          <p>Free forever — your first request takes about two minutes.</p>
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
        <!-- Trust strip: the security practices behind the pitch, right before the pricing ask. -->
        <ul class="trust bdg-card" aria-label="Security practices">
          <li v-for="t in TRUST" :key="t.label" class="trust__item">
            <i :class="t.icon" aria-hidden="true" />
            <div>
              <strong>{{ t.label }}</strong>
              <span>{{ t.detail }}</span>
            </div>
          </li>
        </ul>
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
              <li v-for="line in TEASER_FREE" :key="line"><i class="pi pi-check" /> {{ line }}</li>
            </ul>
            <button type="button" class="bdg-btn bdg-btn--outlined bdg-btn--block" @click="getStarted">Start for free</button>
          </div>
          <div class="plans__card plans__card--featured bdg-card">
            <span class="plans__flag">Most popular</span>
            <h3 class="plans__name">Pro</h3>
            <div class="plans__price">
              <span class="amount">${{ PRO_PRICES.annual }}</span><span class="per">/mo billed annually</span>
            </div>
            <ul class="plans__list">
              <li v-for="line in TEASER_PRO" :key="line"><i class="pi pi-check" /> {{ line }}</li>
            </ul>
            <router-link class="bdg-btn bdg-btn--primary bdg-btn--block" :to="{ name: 'pricing' }">
              See full pricing <i class="pi pi-arrow-right" />
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ teaser: objections answered BEFORE the final ask, so the CTA lands
         on reassurance rather than interrupting it. -->
    <section class="section faq">
      <div class="section__inner">
        <header class="section__head">
          <span class="bdg-label-sm">Good to know</span>
          <h2>The questions everyone asks first</h2>
        </header>
        <div class="faq__grid">
          <div v-for="item in FAQ_TEASER" :key="item.q" class="bdg-card faq__item">
            <h3>{{ item.q }}</h3>
            <p>{{ item.a }}</p>
          </div>
        </div>
        <p class="faq__more">
          <router-link :to="{ name: 'pricing' }">More questions answered on the pricing page →</router-link>
        </p>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="cta">
      <div class="cta__inner">
        <h2>Ready to stop chasing documents?</h2>
        <p>Create your first request in minutes — free, no card required.</p>
        <button type="button" class="bdg-btn bdg-btn--lg cta__btn" @click="getStarted">
          Start for free <i class="pi pi-arrow-right" />
        </button>
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
            <p>
              Thanks, {{ contact.name }} — your message is on its way. We’ll reply to
              <strong>{{ contact.email }}</strong> as soon as we can.
            </p>
          </div>
          <template v-else>
            <div class="bdg-field">
              <label for="c-name">Name</label>
              <input
                id="c-name"
                v-model.trim="contact.name"
                class="bdg-input"
                :class="{ 'bdg-input--invalid': contactErrors.name }"
                :aria-invalid="!!contactErrors.name"
                autocomplete="name"
              />
              <small v-if="contactErrors.name" class="bdg-error">{{ contactErrors.name }}</small>
            </div>
            <div class="bdg-field">
              <label for="c-email">Email</label>
              <input
                id="c-email"
                v-model.trim="contact.email"
                type="email"
                class="bdg-input"
                :class="{ 'bdg-input--invalid': contactErrors.email }"
                :aria-invalid="!!contactErrors.email"
                placeholder="name@company.com"
                autocomplete="email"
              />
              <small v-if="contactErrors.email" class="bdg-error">{{ contactErrors.email }}</small>
            </div>
            <div class="bdg-field">
              <label for="c-message">How can we help?</label>
              <textarea
                id="c-message"
                v-model.trim="contact.message"
                rows="4"
                class="bdg-input"
                :class="{ 'bdg-input--invalid': contactErrors.message }"
                :aria-invalid="!!contactErrors.message"
              />
              <small v-if="contactErrors.message" class="bdg-error">{{ contactErrors.message }}</small>
            </div>
            <!-- Honeypot: invisible to humans; bots that fill it are dropped server-side. -->
            <div class="bdg-honeypot" aria-hidden="true">
              <label for="c-website">Website</label>
              <input id="c-website" v-model="contact.website" tabindex="-1" autocomplete="off" />
            </div>
            <button type="submit" class="bdg-btn bdg-btn--primary bdg-btn--block" :disabled="contactSending">
              {{ contactSending ? 'Sending…' : 'Send message' }} <i class="pi pi-send" />
            </button>
            <p v-if="contactFailed" class="contact__error" role="alert">
              Something went wrong sending your message. Please email us directly at
              <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>.
            </p>
          </template>
        </form>
      </div>
    </section>
    </main>

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
  display: flex;
}
.hero__inner {
  max-width: 1200px;
  margin: 0 auto;
  /* Asymmetric padding shifts the optical centre up on tall viewports. */
  padding: 2rem 1.5rem 5rem;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 3rem;
  align-items: center;
  /* First impression owns the viewport (svh keeps mobile URL bars honest). */
  min-height: calc(100vh - 4.2rem);
  min-height: calc(100svh - 4.2rem);
}
.hero__eyebrow {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  /* blue-600 rather than --bdg-blue: 12.8px text needs 4.5:1 on the tinted chip. */
  color: #2563eb;
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
.hero__audience {
  margin: 0.875rem 0 0;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

/* Product preview — a real portal screenshot in a browser-window frame */
.hero__preview {
  perspective: 1600px;
}
.mock {
  overflow: hidden;
  transform: rotateY(-9deg) rotateX(3deg);
  transform-origin: center;
  /* The screenshot is tall (aspect ≈ 0.72): cap the card's width by the
     viewport's height budget so the whole portal stays above the fold. */
  max-width: min(100%, calc((100vh - 12rem) * 0.72));
  max-width: min(100%, calc((100svh - 12rem) * 0.72));
  margin-inline: auto;
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
.mock__img {
  display: block;
  width: 100%;
  height: auto;
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
/* One shared rhythm: every section is an unhurried chapter. */
.section {
  padding: 5.5rem 0;
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
/* Full-viewport chapter: same height math as the hero, content optically centred. */
.section--full {
  display: flex;
  align-items: center;
  min-height: calc(100vh - 4.2rem);
  min-height: calc(100svh - 4.2rem);
}
.section--full .section__inner {
  width: 100%;
}
.section__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}
.section__head {
  text-align: center;
  max-width: 40rem;
  margin: 0 auto 3rem;
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
  gap: 1.75rem;
}
.steps__card {
  position: relative;
  padding: 1.875rem 1.75rem 2rem;
}
/* Journey arrow sitting in the gap between consecutive cards. */
.steps__card:not(:last-child)::after {
  content: '→';
  position: absolute;
  top: 50%;
  left: 100%;
  width: 1.75rem;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 1.3rem;
  font-weight: 600;
}
.steps__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.375rem;
}
.steps__num {
  width: 3.25rem;
  height: 3.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--bdg-gradient);
  color: #fff;
  font-size: 1.35rem;
  font-weight: 800;
  box-shadow: 0 8px 18px rgba(59, 130, 246, 0.3);
}
.steps__icon {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.9rem;
  background: rgba(59, 130, 246, 0.1);
  color: var(--bdg-blue);
  font-size: 1.25rem;
}
.steps__card h3 {
  margin: 0 0 0.55rem;
  font-size: 1.2rem;
}
.steps__card p {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.65;
}
.steps__cta {
  margin-top: 3.25rem;
  text-align: center;
}
.steps__cta p {
  margin: 0.875rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
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

/* ---- Trust strip ---- */
.trust {
  list-style: none;
  margin: 3rem 0 0;
  padding: 1.5rem 1.75rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
}
.trust__item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}
.trust__item i {
  color: #0891b2;
  font-size: 1.1rem;
  margin-top: 0.15rem;
}
.trust__item strong {
  display: block;
  margin-bottom: 0.15rem;
  font-size: 0.9rem;
  color: var(--bdg-deep);
}
.trust__item span {
  font-size: 0.825rem;
  color: #64748b;
  line-height: 1.45;
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
  padding: 4.5rem 1.5rem;
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
.cta__btn {
  background: #fff;
  border-color: #fff;
  color: var(--bdg-deep);
}
.cta__btn:hover {
  background: #f1f5f9;
  border-color: #f1f5f9;
}

/* ---- FAQ teaser ---- */
.faq__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 26rem));
  gap: 1.25rem;
  justify-content: center;
}
.faq__item {
  padding: 1.5rem 1.625rem;
}
.faq__item h3 {
  margin: 0 0 0.5rem;
  font-size: 1.02rem;
}
.faq__item p {
  margin: 0;
  color: #64748b;
  font-size: 0.925rem;
  line-height: 1.6;
}
.faq__more {
  margin: 1.75rem 0 0;
  text-align: center;
  font-size: 0.925rem;
}
.faq__more a {
  /* blue-600: link-sized text fails AA at --bdg-blue's 3.68:1. */
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}
.faq__more a:hover {
  text-decoration: underline;
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
.contact__error {
  margin: 0.875rem 0 0;
  font-size: 0.875rem;
  color: #ba1a1a;
}
.contact__error a {
  color: inherit;
  font-weight: 600;
}

/* ---- Responsive ---- */
@media (max-width: 960px) {
  .hero__inner {
    grid-template-columns: 1fr;
    gap: 2.5rem;
    padding-top: 3rem;
    /* Stacked layout: let content set the height so the CTA stays reachable. */
    min-height: 0;
  }
  /* Copy and CTA own the mobile fold; the mock follows as supporting proof. */
  .hero__preview {
    max-width: 26rem;
    margin: 0 auto;
  }
  .mock {
    transform: none;
  }
  .features,
  .benefits,
  .trust {
    grid-template-columns: 1fr 1fr;
  }
  /* Stacked steps: one column, arrows turn downward in the row gaps. */
  .steps {
    grid-template-columns: 1fr;
    max-width: 30rem;
    margin: 0 auto;
    gap: 2.25rem;
  }
  .steps__card:not(:last-child)::after {
    content: '↓';
    top: 100%;
    left: 50%;
    width: auto;
    height: 2.25rem;
    transform: translateX(-50%);
  }
  .contact {
    grid-template-columns: 1fr;
    gap: 1.75rem;
  }
}
@media (max-width: 620px) {
  .metrics__inner,
  .features,
  .benefits,
  .trust,
  .plans,
  .faq__grid {
    grid-template-columns: 1fr;
  }
  .plans {
    justify-items: stretch;
  }
}
</style>
