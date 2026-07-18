import type { RouteLocationNormalized, Router } from 'vue-router'
import { PRICING_FAQ, PRO_PRICES } from '@/lib/plans'

/**
 * Per-route document head management: title, description, canonical URL,
 * Open Graph mirrors, robots directive, and JSON-LD structured data.
 * Runs on every navigation (and during build-time prerendering, which is how
 * crawlers that don't execute JS see the right head per route).
 */

export const SITE_URL = 'https://business-document-gateway.vercel.app'
const SITE_NAME = 'Business Document Gateway'
const DEFAULT_TITLE = 'Business Document Gateway — Collect client documents without the email back-and-forth'
const DEFAULT_DESCRIPTION =
  'Send your clients one secure link, get automatic reminders, and download every file in one tidy ZIP. Free forever plan — no card required.'

interface PageMeta {
  /** Full document title. Defaults to the site-wide title. */
  title?: string
  description?: string
  /** Keep crawlers out (app, portal, auth, 404 routes). */
  noindex?: boolean
}

const PAGE_META: Record<string, PageMeta> = {
  landing: { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
  pricing: {
    title: `Pricing — ${SITE_NAME}`,
    description: `Start free forever — 3 active requests, 1 GB storage, security included. Pro is $${PRO_PRICES.annual}/month billed annually for 25 requests, 25 GB, and custom branding.`,
  },
  terms: { title: `Terms of Service — ${SITE_NAME}`, description: `The terms that govern your use of ${SITE_NAME}.` },
  privacy: {
    title: `Privacy Policy — ${SITE_NAME}`,
    description: `How ${SITE_NAME} collects and protects personal data, in accordance with the GDPR.`,
  },
  dpa: {
    title: `Data Processing Agreement — ${SITE_NAME}`,
    description: `The Article 28 GDPR data processing terms for documents you collect through ${SITE_NAME}.`,
  },
  'cookie-policy': {
    title: `Cookie Policy — ${SITE_NAME}`,
    description: `Which cookies ${SITE_NAME} uses and how to change your consent at any time.`,
  },
  login: { title: `Sign in — ${SITE_NAME}`, noindex: true },
  register: { title: `Create your account — ${SITE_NAME}`, noindex: true },
  portal: { title: `Secure document upload — ${SITE_NAME}`, noindex: true },
  'not-found': { title: `Page not found — ${SITE_NAME}`, noindex: true },
  dashboard: { title: `Dashboard — ${SITE_NAME}`, noindex: true },
  'request-new': { title: `New request — ${SITE_NAME}`, noindex: true },
  'request-detail': { title: `Request — ${SITE_NAME}`, noindex: true },
  profile: { title: `Profile — ${SITE_NAME}`, noindex: true },
  library: { title: `Document library — ${SITE_NAME}`, noindex: true },
  'portal-config': { title: `Portal settings — ${SITE_NAME}`, noindex: true },
  billing: { title: `Billing — ${SITE_NAME}`, noindex: true },
}

/** JSON-LD payloads for the routes that benefit from structured data. */
function jsonLdFor(routeName: string): object | null {
  if (routeName === 'landing') {
    return {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: SITE_URL,
      description: DEFAULT_DESCRIPTION,
      offers: [
        { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
        { '@type': 'Offer', name: 'Pro (billed annually)', price: String(PRO_PRICES.annual), priceCurrency: 'USD' },
      ],
    }
  }
  if (routeName === 'pricing') {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: PRICING_FAQ.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    }
  }
  return null
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string | null) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (content === null) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function applyMeta(to: RouteLocationNormalized) {
  const meta = PAGE_META[String(to.name)] ?? {}
  const title = meta.title ?? DEFAULT_TITLE
  const description = meta.description ?? DEFAULT_DESCRIPTION
  const url = SITE_URL + (to.path === '/' ? '/' : to.path)

  document.title = title
  upsertMeta('name', 'description', description)
  upsertMeta('name', 'robots', meta.noindex ? 'noindex' : null)
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:url', url)
  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', description)

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (meta.noindex) {
    canonical?.remove()
  } else {
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', url)
  }

  document.head.querySelector('script[data-bdg-jsonld]')?.remove()
  const jsonLd = jsonLdFor(String(to.name))
  if (jsonLd) {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-bdg-jsonld', '')
    script.textContent = JSON.stringify(jsonLd)
    document.head.appendChild(script)
  }
}

export function installMeta(router: Router) {
  router.afterEach((to) => applyMeta(to))
}
