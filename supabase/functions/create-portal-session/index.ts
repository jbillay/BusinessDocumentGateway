import Stripe from 'npm:stripe@17'
import { createClient } from 'jsr:@supabase/supabase-js@2'

/**
 * Opens a Stripe Customer Portal session for the signed-in user: payment
 * method, invoices, cancel, and monthly/annual switches all happen on
 * Stripe-hosted pages.
 *
 * Auth: user JWT (Authorization header).
 * Returns: { url } to redirect the browser to.
 */

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
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

  if (!STRIPE_SECRET_KEY) return json(503, { error: 'billing_not_configured' })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json(401, { error: 'unauthorized' })
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } })
  const {
    data: { user },
  } = await userClient.auth.getUser()
  if (!user) return json(401, { error: 'unauthorized' })

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const { data: sub, error: subError } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()
  if (subError) return json(500, { error: subError.message })
  if (!sub.stripe_customer_id) return json(400, { error: 'no_billing_account' })

  const stripe = new Stripe(STRIPE_SECRET_KEY)
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${APP_URL}/billing`,
  })

  return json(200, { url: session.url })
})
