import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'

export const userSessionStore = defineStore('user', () => {
  const userSession = ref(
    useLocalStorage('user', {
      isAuthenticated: false,
      user: null,
      token: null,
    }),
  )

  function getLocalUser() {
    return userSession.value.user
  }

  function getUser() {
    if (!userSession.value || !userSession.value.user || !userSession.value.user.user_metadata) {
      console.warn('No user session found')
      return null
    }
    return userSession.value.user.user_metadata
  }

  function getUserInitials() {
    if (!userSession.value || !userSession.value.user || !userSession.value.user.user_metadata) {
      console.warn('No user session found')
      return null
    }
    const user = userSession.value.user.user_metadata
    if (!user || !user.firstName || !user.lastName) return ''
    return `${user.firstName.charAt(0).toUpperCase()}${user.lastName.charAt(0).toUpperCase()}`
  }

  function updateUserSession(session) {
    userSession.value = session
  }

  function isUserAuthenticated() {
    return userSession.value.isAuthenticated
  }

  return {
    userSession,
    updateUserSession,
    isUserAuthenticated,
    getUser,
    getUserInitials,
    getLocalUser,
  }
})
