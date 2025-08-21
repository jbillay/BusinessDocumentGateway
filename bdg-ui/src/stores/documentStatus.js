import { defineStore } from 'pinia'
import { ref } from 'vue'
import useSupabase from '../lib/supabase'
import { useLocalStorage } from '@vueuse/core'

export const documentStatusStore = defineStore('documentStatus', () => {
  const { supabase } = useSupabase()

  const documentStatus = ref(useLocalStorage('documentStatus', []))

  async function fecthDocumentStatus() {
    try {
      const { data } = await supabase.from('documentStatus').select('*')
      documentStatus.value = data || []
      return documentStatus.value
    } catch (error) {
      console.error('Error fetching document status:', error)
      throw new Error('Failed to fetch document status')
    }
  }

  return { documentStatus, fecthDocumentStatus }
})
