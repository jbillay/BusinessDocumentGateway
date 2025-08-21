import { createClient } from '@supabase/supabase-js'
import { userSessionStore } from '../stores/userSession'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// setup client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ⬇ setup auth state listener ⬇
supabase.auth.onAuthStateChange((event, session) => {
  const userSession = userSessionStore()
  // for event INITIAL_SESSION / SIGNED_IN / PASSWORD_RECOVERY / TOKEN_REFRESHED / USER_UPDATED
  if (event != 'SIGNED_OUT') {
    if (session) {
      userSession.updateUserSession({
        isAuthenticated: true,
        user: session.user,
        token: session.access_token,
      })
    }
  } else {
    userSession.updateUserSession({
      isAuthenticated: false,
      user: null,
      token: null,
    })
  }
})

// expose supabase client
export default function useSupabase() {
  return { supabase }
}
