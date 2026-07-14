import { createClient } from 'jsr:@supabase/supabase-js@2'

/**
 * Transactional email sender (Resend).
 *
 * Auth: either the x-email-secret header (DB triggers / cron via pg_net) or a
 * user JWT whose user owns the request. Deployed with verify_jwt disabled so
 * the hook path works; both paths are enforced below.
 *
 * Body: { type: 'request_created' | 'reminder' | 'completed' | 'link_regenerated', request_id: string }
 */

type EmailType = 'request_created' | 'reminder' | 'completed' | 'link_regenerated'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const EMAIL_HOOK_SECRET = Deno.env.get('EMAIL_HOOK_SECRET')!
const APP_URL = Deno.env.get('APP_URL') ?? 'https://business-document-gateway.vercel.app'
const FROM = 'Business Document Gateway <onboarding@resend.dev>'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

function layout(heading: string, bodyHtml: string, cta?: { label: string; url: string }) {
  const button = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 8px"><tr>
         <td style="background-color:#3b82f6;border-radius:10px">
           <a href="${cta.url}" style="display:inline-block;padding:13px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:10px">${cta.label}</a>
         </td></tr></table>
       <p style="margin:8px 0 0;font-size:12px;line-height:18px;color:#94a3b8;text-align:center;word-break:break-all">
         Or copy this link: <a href="${cta.url}" style="color:#3b82f6">${cta.url}</a></p>`
    : ''
  return `
  <body style="margin:0;padding:0;background-color:#f1f5f9">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
          <tr><td align="center" style="padding:0 8px 20px">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="background-color:#0f172a;border-radius:10px;width:36px;height:36px;text-align:center;vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:bold;color:#ffffff">B</td>
              <td style="padding-left:10px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#0f172a">Business Document Gateway</td>
            </tr></table>
          </td></tr>
          <tr><td style="background-color:#ffffff;border-radius:16px;box-shadow:0 1px 3px rgba(15,23,42,0.08)">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="height:6px;background-color:#3b82f6;border-radius:16px 16px 0 0;font-size:0;line-height:0">&nbsp;</td></tr>
              <tr><td style="padding:36px 44px 36px;font-family:Arial,Helvetica,sans-serif">
                <h1 style="margin:0 0 16px;font-size:23px;line-height:31px;color:#0f172a">${heading}</h1>
                ${bodyHtml}
                ${button}
              </td></tr>
            </table>
          </td></tr>
          <tr><td align="center" style="padding:20px 8px 0;font-family:Arial,Helvetica,sans-serif">
            <p style="margin:0;font-size:12px;line-height:18px;color:#94a3b8">Business Document Gateway — secure document collection, simplified.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>`
}

const p = (text: string) =>
  `<p style="margin:0 0 12px;font-size:15px;line-height:24px;color:#334155">${text}</p>`

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' })

  let payload: { type?: EmailType; request_id?: string }
  try {
    payload = await req.json()
  } catch {
    return json(400, { error: 'invalid json' })
  }
  const { type, request_id } = payload
  if (!type || !request_id) return json(400, { error: 'type and request_id are required' })

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  // Authenticate: hook secret (server-side callers) or owner JWT.
  let callerId: string | null = null
  const hookSecret = req.headers.get('x-email-secret')
  if (hookSecret !== EMAIL_HOOK_SECRET) {
    const authHeader = req.headers.get('Authorization') ?? ''
    const asUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data, error } = await asUser.auth.getUser()
    if (error || !data.user) return json(401, { error: 'unauthorized' })
    callerId = data.user.id
  }

  const { data: request, error: reqError } = await admin
    .from('document_requests')
    .select('*')
    .eq('id', request_id)
    .single()
  if (reqError || !request) return json(404, { error: 'request not found' })
  if (callerId && request.user_id !== callerId) return json(403, { error: 'forbidden' })

  const { data: owner } = await admin
    .from('profiles')
    .select('*')
    .eq('id', request.user_id)
    .single()

  const ownerName = `${owner?.first_name ?? ''} ${owner?.last_name ?? ''}`.trim() || 'Your contact'
  const senderCompany = owner?.company || ownerName
  const clientName = request.client_name || 'there'
  const portalUrl = `${APP_URL}/portal/${request.portal_token}`
  const pinNote = request.portal_pin
    ? p('🔒 This portal is protected by an access code. If you don\'t have it yet, ' +
        `${esc(ownerName)} will share it with you separately.`)
    : ''

  let to: string
  let subject: string
  let html: string

  switch (type) {
    case 'request_created':
      to = request.client_email
      subject = `${senderCompany} is requesting documents: ${request.name}`
      html = layout(
        `${esc(senderCompany)} needs a few documents from you`,
        p(`Hi ${esc(clientName)},`) +
          p(`${esc(ownerName)} at ${esc(senderCompany)} has requested documents for <strong>${esc(request.name)}</strong>.`) +
          (request.expected_date
            ? p(`Please upload them by <strong>${new Date(request.expected_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.`)
            : '') +
          p('Use the secure portal below — no account needed, and your files are encrypted.') +
          pinNote,
        { label: 'Upload documents securely', url: portalUrl },
      )
      break
    case 'reminder':
      to = request.client_email
      subject = `Reminder: documents needed for ${request.name}`
      html = layout(
        'A friendly reminder',
        p(`Hi ${esc(clientName)},`) +
          p(`${esc(ownerName)} at ${esc(senderCompany)} is still waiting for some documents for <strong>${esc(request.name)}</strong>.`) +
          (request.expected_date
            ? p(`The expected date is <strong>${new Date(request.expected_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.`)
            : '') +
          p('It only takes a few minutes through the secure portal below.') +
          pinNote,
        { label: 'Upload documents now', url: portalUrl },
      )
      break
    case 'link_regenerated':
      to = request.client_email
      subject = `New secure upload link for ${request.name}`
      html = layout(
        'Your new secure link is ready',
        p(`Hi ${esc(clientName)},`) +
          p(`${esc(ownerName)} at ${esc(senderCompany)} issued a new secure upload link for <strong>${esc(request.name)}</strong>. Any previous link no longer works.`) +
          (request.expires_at
            ? p(`This link is valid until <strong>${new Date(request.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.`)
            : '') +
          pinNote,
        { label: 'Open the secure portal', url: portalUrl },
      )
      break
    case 'completed':
      to = owner?.email ?? ''
      subject = `✅ ${request.client_name || request.client_email} completed "${request.name}"`
      html = layout(
        'All documents received',
        p(`Good news — <strong>${esc(request.client_name || request.client_email)}</strong> has submitted all requested documents for <strong>${esc(request.name)}</strong>.`) +
          p('You can review and download everything from the request page.'),
        { label: 'Review documents', url: `${APP_URL}/requests/${request.id}` },
      )
      break
    default:
      return json(400, { error: `unknown type: ${type}` })
  }

  if (!to) return json(400, { error: 'no recipient' })

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  })

  if (!resendResponse.ok) {
    const detail = await resendResponse.text()
    console.error('resend error', resendResponse.status, detail)
    return json(502, { error: 'email delivery failed', detail })
  }

  const activityMessage = {
    request_created: `Request email sent to ${to}`,
    reminder: `Reminder email sent to ${to}`,
    link_regenerated: `New link emailed to ${to}`,
    completed: `Completion notification sent to ${to}`,
  }[type]
  await admin.from('activity_events').insert({
    user_id: request.user_id,
    request_id: request.id,
    type: type === 'reminder' ? 'reminder' : 'info',
    message: activityMessage,
  })
  if (type === 'reminder') {
    await admin
      .from('document_requests')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', request.id)
  }

  return json(200, { sent: true, to })
})
