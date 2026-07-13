import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

export interface RegisterPayload {
  firstName: string
  lastName: string
  company: string
  email: string
  password: string
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const profile = ref<Profile | null>(null)
  const ready = ref(false)

  let initPromise: Promise<void> | null = null

  const user = computed(() => session.value?.user ?? null)
  const isAuthenticated = computed(() => session.value !== null)
  const displayName = computed(() => {
    if (!profile.value) return user.value?.email ?? ''
    const name = `${profile.value.first_name} ${profile.value.last_name}`.trim()
    return name || profile.value.email
  })
  const initials = computed(() => {
    if (!profile.value) return '?'
    const f = profile.value.first_name.charAt(0)
    const l = profile.value.last_name.charAt(0)
    return (f + l).toUpperCase() || profile.value.email.charAt(0).toUpperCase()
  })

  /** Resolve the initial session exactly once; used by the router guard. */
  function ensureReady(): Promise<void> {
    if (!initPromise) {
      initPromise = (async () => {
        const { data } = await supabase.auth.getSession()
        session.value = data.session
        if (data.session) await fetchProfile()
        supabase.auth.onAuthStateChange((_event, newSession) => {
          session.value = newSession
          if (!newSession) profile.value = null
        })
        ready.value = true
      })()
    }
    return initPromise
  }

  async function fetchProfile() {
    if (!user.value) return
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()
    if (error) throw error
    profile.value = data
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await fetchProfile()
  }

  /** Returns true when a session was created immediately (email confirmation disabled). */
  async function signUp(payload: RegisterPayload): Promise<boolean> {
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          first_name: payload.firstName,
          last_name: payload.lastName,
          company: payload.company,
        },
      },
    })
    if (error) throw error
    if (data.session) {
      session.value = data.session
      await fetchProfile()
      return true
    }
    return false
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    session.value = null
    profile.value = null
  }

  async function updateProfile(patch: Partial<Pick<Profile, 'first_name' | 'last_name' | 'company' | 'avatar_url'>>) {
    if (!user.value) throw new Error('Not authenticated')
    const { error } = await supabase.from('profiles').update(patch).eq('id', user.value.id)
    if (error) throw error
    await fetchProfile()
  }

  return {
    session,
    profile,
    ready,
    user,
    isAuthenticated,
    displayName,
    initials,
    ensureReady,
    fetchProfile,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }
})
