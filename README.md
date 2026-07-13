# Business Document Gateway (BDG)

Secure document collection SaaS: create document requests, share a private upload
link with your client, and watch files arrive in real time.

Built with **Vue 3 (Composition API) + TypeScript + PrimeVue v4 + Pinia + Supabase**.

## Features

- **Auth** — email/password sign-up & sign-in (Supabase Auth), route guards, session persistence.
- **Dashboard** — summary stat cards, searchable/filterable DataTable of requests
  (status tags, progress bars), create/edit dialog with a per-request document checklist,
  copy-portal-link / download / remind / delete row actions, selected-item side panel,
  and a live global activity log.
- **Client portal** (`/portal/:token`) — public, token-scoped upload page. Clients see the
  checklist, drag & drop or pick files (PDF/DOCX/JPG/PNG, ≤50 MB), and submit. No account needed.
- **Realtime** — Postgres changes stream to the dashboard (uploads, status changes, activity).
- **Profile** — view/edit first name, last name, company; avatar initials; email immutable.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production bundle
```

Copy `.env.example` to `.env` and fill in your Supabase project URL and publishable key.

## Architecture

```
src/
  lib/supabase.ts          Supabase client singleton
  theme/preset.ts          PrimeVue v4 preset (Lara base, BDG blue/slate tokens)
  types/index.ts           Domain types + status/format helpers
  stores/                  Pinia: auth, requests (CRUD + realtime), activity
  router/index.ts          Routes + auth guards
  components/
    brand/                 Logo
    layout/                Glass navbar, footer
    dashboard/             StatCard, RequestDialog, ActivityPanel
  views/                   Login, Register, Dashboard, Profile, Portal
```

## Backend (Supabase project `business-document-gateway`)

Tables (all RLS-protected, owner-scoped): `profiles`, `document_requests`,
`request_items`, `uploaded_files`, `activity_events`.

- A trigger on `auth.users` auto-creates the profile row from signup metadata.
- Uploading a file marks its checklist item done and logs an activity event.
- The client portal never authenticates: it calls SECURITY DEFINER RPCs
  (`get_portal_request`, `portal_add_file`, `portal_clear_item`, `portal_submit`)
  keyed by the unguessable `portal_token`, and uploads binaries to the private
  `request-files` bucket under `portal/{token}/…`, which a storage policy validates
  with `portal_token_valid()`. Owners read/delete files via signed URLs.
- Realtime publication includes `document_requests`, `request_items`,
  `uploaded_files`, and `activity_events`.

## Follow-ups

- **Email notifications** — wire a Supabase Edge Function to Resend (needs an API key)
  so "Remind" and status changes send real email; today they log activity events.
- Optionally enable leaked-password protection in Supabase Auth settings.
- Replace the inline SVG logo in `src/components/brand/BrandLogo.vue` and
  `public/favicon.svg` with the official brand assets if desired.
