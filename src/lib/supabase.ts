import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

/** Storage bucket holding client-uploaded binaries. */
export const FILES_BUCKET = 'request-files'

/** Public storage bucket holding portal branding assets (logos). */
export const BRANDING_BUCKET = 'branding'

/** Public URL for a branding asset (the bucket has public read). */
export function brandingUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return supabase.storage.from(BRANDING_BUCKET).getPublicUrl(path).data.publicUrl
}
