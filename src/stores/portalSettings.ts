import { ref } from 'vue'
import { defineStore } from 'pinia'
import { BRANDING_BUCKET, supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { PORTAL_SETTINGS_DEFAULTS, type PortalSettings } from '@/types'

export type PortalSettingsInput = Omit<PortalSettings, 'user_id'>

export const usePortalSettingsStore = defineStore('portalSettings', () => {
  const settings = ref<PortalSettings | null>(null)
  const loading = ref(false)

  async function load() {
    const auth = useAuthStore()
    if (!auth.user) return
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('portal_settings')
        .select('*')
        .eq('user_id', auth.user.id)
        .maybeSingle()
      if (error) throw error
      settings.value = data ?? { user_id: auth.user.id, ...PORTAL_SETTINGS_DEFAULTS }
    } finally {
      loading.value = false
    }
  }

  async function save(input: PortalSettingsInput) {
    const auth = useAuthStore()
    if (!auth.user) throw new Error('Not authenticated')
    const row = { user_id: auth.user.id, ...input, updated_at: new Date().toISOString() }
    const { data, error } = await supabase
      .from('portal_settings')
      .upsert(row)
      .select()
      .single()
    if (error) throw error
    settings.value = data
  }

  /** Uploads a logo to the public branding bucket and returns its storage path. */
  async function uploadLogo(file: File): Promise<string> {
    const auth = useAuthStore()
    if (!auth.user) throw new Error('Not authenticated')
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    const path = `${auth.user.id}/logo_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(BRANDING_BUCKET).upload(path, file)
    if (error) throw error
    return path
  }

  /** Best-effort cleanup of a replaced or removed logo file. */
  async function deleteLogo(path: string) {
    await supabase.storage.from(BRANDING_BUCKET).remove([path])
  }

  return { settings, loading, load, save, uploadLogo, deleteLogo }
})
