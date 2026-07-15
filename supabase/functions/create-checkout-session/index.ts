import Stripe from 'npm:stripe@17'
import { createClient } from 'jsr:@supabase/supabase-js@2'

/**
 * Starts a Stripe Checkout session to upgrade the signed-in user to Pro.
 *
 * Auth: user JWT (Authorization header). Card details never touch our code —
 * Stripe hosts the checkout page.
 *
 * Body: { interval?: 'month' | 'year' }  (default 'month')
 * Returns: { url } to redirect the browser to.
 */

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const STRIPE_PRICE_MONTHLY = Deno.env.get('STRIPE_PRICE_MONTHLY')
const STRIPE_PRICE_ANNUAL = Deno.env.get('STRIPE_PRICE_ANNUAL')
const APP_URL = Deno.env.get('APP_URL') ?? 'https://business-document-gateway.vercel.app'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } })

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS })
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })

  if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_MONTHLY || !STRIPE_PRICE_ANNUAL) {
    return json(503, { error: 'billing_not_configured' })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json(401, { error: 'unauthorized' })
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } })
  const {
    data: { user },
  } = await userClient.auth.getUser()
  if (!user) return json(401, { error: 'unauthorized' })

  const { interval = 'month' } = await req.json().catch(() => ({}))
  const price = interval === 'year' ? STRIPE_PRICE_ANNUAL : STRIPE_PRICE_MONTHLY

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const { data: sub, error: subError } = await admin
    .from('subscriptions')
    .select('plan, status, stripe_customer_id')
    .eq('user_id', user.id)
    .single()
  if (subError) return json(500, { error: subError.message })
  if (sub.plan === 'pro' && sub.status !== 'canceled') {
    return json(400, { error: 'already_subscribed' })
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY)

  let customerId = sub.stripe_customer_id as string | null
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    })
    customerId = customer.id
    const { error: saveError } = await admin
      .from('subscriptions')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', user.id)
    if (saveError) return json(500, { error: saveError.message })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    success_url: `${APP_URL}/billing?checkout=success`,
    cancel_url: `${APP_URL}/billing`,
    metadata: { user_id: user.id },
    subscription_data: { metadata: { user_id: user.id } },
  })

  return json(200, { url: session.url })
})
