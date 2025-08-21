<template>
  <div class="min-h-screen bg-gray-50">
    <TheMenubar :new="false" />
    <main class="pt-4 pb-4">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="card">
          <h2 class="text-2xl font-bold mb-4">Request Details</h2>
          <div v-if="request">
            <div class="mb-2"><strong>Name:</strong> {{ request.name }}</div>
            <div class="mb-2">
              <strong>Expected Date:</strong> {{ formatDate(request.expectedDate) }}
            </div>
            <div class="mb-2"><strong>Description:</strong> {{ request.desc }}</div>
            <div class="mb-2">
              <strong>Status:</strong> {{ requestStatusName(request.statusId) }}
            </div>
            <div class="mb-2">
              <strong>Client Emails:</strong> {{ displayClientEmails(request.clientContact) }}
            </div>
            <div class="mb-4">
              <strong>Documents:</strong>
              <DocumentsDatatable
                v-if="request && request.documents"
                :documents="request.documents"
                :canDelete="false"
              />
            </div>
          </div>
          <div v-else class="text-gray-500">Loading request...</div>
        </div>
      </div>
    </main>
    <TheFooter />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { requestsStore } from '@/stores/requests'
import { requestStatusStore } from '@/stores/requestStatus'
import TheMenubar from '@/components/TheMenubar.vue'
import TheFooter from '@/components/TheFooter.vue'
import DocumentsDatatable from '@/components/DocumentsDatatable.vue'

const route = useRoute()
const requestsStoreSession = requestsStore()
const request = ref(null)
const requestStatusStoreSession = requestStatusStore()

const requestStatus = ref(requestStatusStoreSession.requestStatus)

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
function requestStatusName(statusId) {
  const statusList = requestStatus.value
  if (!statusList || !Array.isArray(statusList)) return 'Unknown'
  const status = statusList.find((s) => s.id === statusId)
  return status ? status.name : 'Unknown'
}
function displayClientEmails(clientContact) {
  try {
    const emails = typeof clientContact === 'string' ? JSON.parse(clientContact) : clientContact
    return emails.map((e) => e.email).join(', ')
  } catch {
    return ''
  }
}
onMounted(async () => {
  request.value = await requestsStoreSession.fetchRequestByIdWithDocuments(route.params.id)
})
</script>
