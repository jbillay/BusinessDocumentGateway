import { defineStore } from 'pinia'
import { ref } from 'vue'
import useSupabase from '../lib/supabase'
import { userSessionStore } from '../stores/userSession'
import { requestStatusStore } from '../stores/requestStatus'
import { documentsStore } from '../stores/documents'

export const requestsStore = defineStore('requests', () => {
  const { supabase } = useSupabase()
  const userSession = userSessionStore()
  const requestStatusStoreSession = requestStatusStore()
  const documentStoreSession = documentsStore()

  const requests = ref([])
  const user = ref(userSession.getLocalUser())
  const requestStatus = ref(requestStatusStoreSession.requestStatus)

  async function createNewRequest(requestInfo, requestDocuments) {
    const pendingStatusId = requestStatus.value.find((s) => s.name === 'Pending')
    try {
      const { data, error } = await supabase
        .from('requests')
        .insert([
          {
            name: requestInfo.value.name,
            clientContact: requestInfo.value.client_email,
            expectedDate: requestInfo.value.expected_date,
            desc: requestInfo.value.description,
            statusId: pendingStatusId.id,
            ownerId: user.value.id,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
      if (error) {
        console.error('Fail to create request', error)
      }
      if (data.length > 0) {
        const newRequest = data[0]
        await documentStoreSession.createNewDocuments(requestDocuments, newRequest.id)
        return newRequest
      }
    } catch (error) {
      console.error('Fail to create request', error)
    }
  }

  async function fetchUserRequests() {
    if (!userSession.isUserAuthenticated) {
      requests.value = []
      return
    }

    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('ownerId', user.value.id)
      if (error) {
        console.error('Fail to get request', error)
      }
      requests.value = data || []
      return requests.value
    } catch (error) {
      console.error('Fail to get request', error)
    }
  }

  async function fetchUserRequestsWithDocuments() {
    if (!userSession.isUserAuthenticated) {
      requests.value = []
      return
    }
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('ownerId', user.value.id)
      if (error) {
        console.error('Fail to get request', error)
      }
      requests.value = data || []
      if (requests.value.length) {
        const requestIdList = []
        requests.value.forEach((request) => {
          requestIdList.push(request.id)
        })
        const documentList = await documentStoreSession.fetchRequestsDocuments(requestIdList)
        console.log('Document list', documentList)
      }
      return requests.value
    } catch (error) {
      console.error('Fail to get request', error)
    }
  }

  // Setup real-time subscription for requests
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

  return { requests, fetchUserRequests, fetchUserRequestsWithDocuments, createNewRequest }
})
