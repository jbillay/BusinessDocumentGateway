import { defineStore } from 'pinia'
import { ref } from 'vue'
import useSupabase from '../lib/supabase'
import { useLocalStorage } from '@vueuse/core'

export const requestStatusStore = defineStore('requestStatus', () => {
  const { supabase } = useSupabase()

  const requestStatus = ref(useLocalStorage('requestStatus', []))

  async function fecthRequestStatus() {
    try {
      const { data } = await supabase.from('requestStatus').select('*')
      requestStatus.value = data || []
      return requestStatus.value
    } catch (error) {
      console.error('Error fetching status requests:', error)
      throw new Error('Failed to fetch request status')
    }
  }

  return { requestStatus, fecthRequestStatus }
})
