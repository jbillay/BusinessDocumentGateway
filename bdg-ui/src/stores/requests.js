import { defineStore } from 'pinia'
import { ref } from 'vue'
import useSupabase from '../lib/supabase'
import { userSessionStore } from '../stores/userSession'
import { requestStatusStore } from '../stores/requestStatus'
import { documentStatusStore } from '../stores/documentStatus'
import { documentsStore } from '../stores/documents'

export const requestsStore = defineStore('requests', () => {
  // Restore missing reactive state
  const { supabase } = useSupabase()
  const userSession = userSessionStore()
  const requestStatusStoreSession = requestStatusStore()
  const documentStoreSession = documentsStore()
  const documentStatusStoreSession = documentStatusStore()

  const requests = ref([])
  const user = ref(userSession.getLocalUser())
  const requestStatus = ref(requestStatusStoreSession.requestStatus)

  async function fetchRequestByIdWithDocuments(requestId) {
    if (!userSession.isUserAuthenticated) {
      return null
    }
    try {
      // Fetch the request and ensure ownership
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .eq('ownerId', user.value.id)
        .single()
      if (error || !data) {
        console.error('Request not found or not owned by user', error)
        return null
      }
      // Fetch associated documents
      const documentList = await documentStoreSession.fetchRequestsDocuments([requestId])
      let documentStatusList = documentStatusStoreSession.documentStatus
      if (!documentStatusList || !documentStatusList.length) {
        documentStatusList = await documentStatusStoreSession.fecthDocumentStatus()
      }
      if (documentStatusList && documentStatusList.value) {
        documentStatusList = documentStatusList.value
      }
      const docs = (documentList.data || []).filter((doc) => doc.requestId === requestId)
      data.documents = docs.map((doc) => {
        const statusObj = documentStatusList.find((s) => s.id === doc.statusId)
        return {
          ...doc,
          statusName: statusObj ? statusObj.name : 'Unknown',
        }
      })
      return data
    } catch (error) {
      console.error('Fail to get request by id', error)
      return null
    }
  }

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
        // Map documents to each request
        if (documentList && documentList.data) {
          // Ensure document statuses are loaded
          let documentStatusList = documentStatusStoreSession.documentStatus
          if (!documentStatusList || !documentStatusList.length) {
            documentStatusList = await documentStatusStoreSession.fetchDocumentStatus()
          }
          // If still a ref, get .value
          if (documentStatusList && documentStatusList.value) {
            documentStatusList = documentStatusList.value
          }
          requests.value.forEach((request) => {
            const docs = documentList.data.filter((doc) => doc.requestId === request.id)
            // Add statusName to each document
            request.documents = docs.map((doc) => {
              const statusObj = documentStatusList.find((s) => s.id === doc.statusId)
              return {
                ...doc,
                statusName: statusObj ? statusObj.name : 'Unknown',
              }
            })
          })
        }
      }
      return requests.value
    } catch (error) {
      console.error('Fail to get request', error)
    }
  }

  // Setup real-time subscription for requests

  async function removeRequestAndDocuments(requestId) {
    try {
      // Remove all documents for this request
      await documentStoreSession.removeDocumentsByRequestId(requestId)
      // Remove the request itself
      const { error } = await supabase.from('requests').delete().eq('id', requestId)
      if (error) {
        console.error('Fail to delete request', requestId, error)
        return false
      }
      // Optionally update local state
      requests.value = requests.value.filter((r) => r.id !== requestId)
      return true
    } catch (error) {
      console.error('Fail to delete request and documents', requestId, error)
      return false
    }
  }

  return {
    requests,
    fetchUserRequests,
    fetchUserRequestsWithDocuments,
    createNewRequest,
    removeRequestAndDocuments,
    fetchRequestByIdWithDocuments,
  }
})
