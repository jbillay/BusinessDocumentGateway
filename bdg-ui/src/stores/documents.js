import { defineStore } from 'pinia'
import { ref } from 'vue'
import useSupabase from '../lib/supabase'
import { documentStatusStore } from '../stores/documentStatus'

export const documentsStore = defineStore('documents', () => {
  const { supabase } = useSupabase()
  const documentStatusStoreSession = documentStatusStore()

  const requests = ref([])
  const documentStatus = ref(documentStatusStoreSession.documentStatus)

  async function createNewDocuments(requestDocuments, requestId) {
    if (documentStatus.value.length === 0) {
      documentStatus.value = await documentStatusStoreSession.fecthDocumentStatus()
    }
    const pendingStatusId = documentStatus.value.find((s) => s.name === 'Pending')
    let requestDocumentQuery = []
    requestDocuments.value.forEach((document) => {
      requestDocumentQuery.push({
        name: document.name,
        mandatory: document.mandatory,
        expectedDate: document.expectedDate,
        desc: document.desc,
        statusId: pendingStatusId.id,
        requestId: requestId,
      })
    })
    try {
      const { data, error } = await supabase.from('documents').insert(requestDocumentQuery).select()
      if (error) {
        console.error('Fail to create documents', error)
      }
      return data
    } catch (error) {
      console.error('Fail to create request', error)
    }
  }

  async function fetchRequestsDocuments(requestIdList) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select()
        .in('requestId', requestIdList)
      if (error) {
        console.error('Fail to get documents', error)
      }
      return { data: data, error: null }
    } catch (error) {
      console.error('Fail to get request', error)
      return { data: null, error: error }
    }
  }

  // Setup real-time subscription for documents
  /* const setupRealtimeSubscription = () => {
  const channel = supabase
    .channel('document_requests_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'document_requests',
        filter: `user_id=eq.${user.value.id}`,
      },
      (payload) => {
        console.log('Real-time update:', payload)
        refreshData() // Refresh data on changes
      },
    )
    .subscribe()

  // Cleanup on unmount
  onUnmounted(() => {
    supabase.removeChannel(channel)
  })
} */

  return { requests, fetchRequestsDocuments, createNewDocuments }
})
