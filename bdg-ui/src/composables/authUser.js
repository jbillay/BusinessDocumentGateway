import { ref } from 'vue'
import useSupabase from '../lib/supabase'
import { userSessionStore } from '../stores/userSession'

const user = ref(null)

export default function useAuthUser() {
  const { supabase } = useSupabase()
  const userSession = userSessionStore()

  /**
   * Login with email and password
   */
  const login = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // update the user session store with the logged in user
    userSession.updateUserSession({
      isAuthenticated: true,
      user: data.user,
      token: data.session?.access_token,
    })
    return user
  }

  /**
   * Logout
   */
  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return null
  }

  /**
   * Check if the user is logged in or not
   */
  const isLoggedIn = () => {
    console.log('Checking if user is logged in:', userSession.isUserAuthenticated())
    return userSession.isUserAuthenticated()
  }

  /**
   * Register
   */
  const register = async ({ email, password, ...meta }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: meta,
        redirectTo: `${window.location.origin}/me?fromEmail=registrationConfirmation`,
      },
    })
    if (data.user.identities.length) {
      console.log('Registering user:', data)
    } else {
      throw new Error('User already registered. Please login instead.')
    }
    if (error) throw error
    return data.user ? data.user : null
  }

  /**
   * Update user email, password, or meta data
   */
  const update = async (data) => {
    const { user, error } = await supabase.auth.update(data)
    if (error) throw error
    return user
  }

  /**
   * Send user an email to reset their password
   * (ie. support "Forgot Password?")
   */
  const sendPasswordRestEmail = async (email) => {
    const { user, error } = await supabase.auth.api.resetPasswordForEmail(email)
    if (error) throw error
    return user
  }

  return {
    user,
    login,
    isLoggedIn,
    logout,
    register,
    update,
    sendPasswordRestEmail,
  }
}
