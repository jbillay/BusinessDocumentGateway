import Stripe from 'npm:stripe@17'
import { createClient } from 'jsr:@supabase/supabase-js@2'

/**
 * Stripe → subscriptions sync. The ONLY writer of plan/status after signup.
 *
 * Deployed with verify_jwt disabled — Stripe calls it directly; authenticity
 * is proven by the webhook signature (constructEventAsync), never by a JWT.
 * Handlers write absolute values keyed on user_id, so Stripe's retried or
 * duplicated deliveries are naturally idempotent.
 */

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** Stripe subscription statuses → our three-state model. */
function mapStatus(stripeStatus: Stripe.Subscription.Status): 'active' | 'past_due' | 'canceled' {
  if (stripeStatus === 'past_due' || stripeStatus === 'unpaid') return 'past_due'
  if (stripeStatus === 'canceled' || stripeStatus === 'incomplete_expired') return 'canceled'
  return 'active'
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) return json(503, { error: 'billing_not_configured' })

  const stripe = new Stripe(STRIPE_SECRET_KEY)
  const signature = req.headers.get('stripe-signature')
  if (!signature) return json(400, { error: 'missing_signature' })

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(await req.text(), signature, STRIPE_WEBHOOK_SECRET)
  } catch {
    return json(400, { error: 'invalid_signature' })
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  /** metadata.user_id is set at checkout; customer lookup is the fallback. */
  async function resolveUserId(metadata: Record<string, string> | null, customerId: string | null) {
    if (metadata?.user_id) return metadata.user_id
    if (!customerId) return null
    const { data } = await admin.from('subscriptions').select('user_id').eq('stripe_customer_id', customerId).single()
    return data?.user_id ?? null
  }

  async function syncSubscription(sub: Stripe.Subscription) {
    const userId = await resolveUserId(sub.metadata, typeof sub.customer === 'string' ? sub.customer : sub.customer.id)
    if (!userId) return json(200, { ignored: 'unknown_customer' })

    const status = mapStatus(sub.status)
    const interval = sub.items.data[0]?.price.recurring?.interval ?? null
    const { error } = await admin
      .from('subscriptions')
      .update({
        plan: status === 'canceled' ? 'free' : 'pro',
        status,
        stripe_subscription_id: sub.id,
        price_id: sub.items.data[0]?.price.id ?? null,
        billing_interval: interval === 'year' ? 'year' : interval === 'month' ? 'month' : null,
        current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
        cancel_at_period_end: sub.cancel_at_period_end,
      })
      .eq('user_id', userId)
    if (error) return json(500, { error: error.message })
    return json(200, { synced: sub.id })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription' || !session.subscription) return json(200, { ignored: event.type })
      const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
      return syncSubscription(await stripe.subscriptions.retrieve(subId))
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      return syncSubscription(event.data.object as Stripe.Subscription)

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer?.id ?? null)
      const userId = await resolveUserId(null, customerId)
      // Keep Pro entitlements during Stripe's retry window; subscription.deleted
      // arrives later if dunning ultimately fails.
      if (userId) {
        const { error } = await admin.from('subscriptions').update({ status: 'past_due' }).eq('user_id', userId)
        if (error) return json(500, { error: error.message })
      }
      return json(200, { handled: event.type })
    }

    default:
      return json(200, { ignored: event.type })
  }
})
