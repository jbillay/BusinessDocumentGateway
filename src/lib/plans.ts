/**
 * Single source of truth for public plan data. Rendered by the landing pricing
 * teaser and the pricing page (and reused for pricing structured data), so the
 * two can never drift. Limits must match plan_limits() in the database —
 * update both together (task 018).
 */

/** Pro price in USD per month, by billing interval. */
export const PRO_PRICES = {
  annual: 15,
  monthly: 19,
  /** Total charged for a year when billed annually. */
  annualTotal: 180,
} as const

/** A single feature/limit line on a plan card. */
export interface PlanLine {
  /** Leading emphasised fragment (e.g. the numeric limit). */
  strong?: string
  text: string
  /** De-emphasised caveat line (e.g. the Free badge note). */
  muted?: boolean
}

/** Full plan cards for the pricing page. */
export const PLAN_FREE: PlanLine[] = [
  { strong: '3', text: 'active requests' },
  { strong: '1 GB', text: 'storage' },
  { strong: '10', text: 'library documents' },
  { text: 'Client portal with access code & link expiry' },
  { text: 'Review workflow & ZIP download' },
  { text: 'Manual reminders' },
  { text: '"Powered by BDG" badge on portals', muted: true },
]

export const PLAN_PRO: PlanLine[] = [
  { strong: '25', text: 'active requests' },
  { strong: '25 GB', text: 'storage' },
  { strong: 'Unlimited', text: 'library documents' },
  { text: 'Everything in Free, plus:' },
  { text: 'Custom portal branding — your logo & colours' },
  { text: 'No BDG badge on client portals' },
  { text: 'Automatic scheduled reminders' },
  { text: 'Email support' },
]

export const PLAN_BUSINESS: PlanLine[] = [
  { strong: '100', text: 'active requests' },
  { strong: '100 GB', text: 'storage' },
  { text: 'Request templates & bulk send' },
  { text: 'Team roles & audit trail' },
  { text: 'API & integrations' },
  { text: 'Priority support + onboarding' },
]

/** Condensed highlight lines for the landing-page teaser cards. */
export const TEASER_FREE = [
  '3 active requests',
  '1 GB storage',
  '10 library documents',
  'Access codes, link expiry & review',
]

export const TEASER_PRO = [
  '25 active requests',
  '25 GB storage',
  'Unlimited library documents',
  'Custom branding & auto reminders',
]

/** Pricing page FAQ (also feeds FAQPage structured data). */
export const PRICING_FAQ = [
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
