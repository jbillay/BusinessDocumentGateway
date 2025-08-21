<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Fixed Navbar -->
    <TheMenubar :new="true" />

    <!-- Main Content -->
    <main class="pt-4 pb-4">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Document Requests</h1>
          <p class="mt-2 text-gray-600">Manage and track all your document collection requests</p>
        </div>

        <!-- Stats Cards -->
        <StatCards :requests="requests" :requestStatus="requestStatus" />

        <!-- Filters and Search -->
        <div class="mb-6 flex flex-col sm:flex-row gap-4">
          <div class="flex-1 justify-end">
            <IconField>
              <InputIcon>
                <i class="pi pi-search" />
              </InputIcon>
              <InputText v-model="searchQuery" placeholder="Search requests" />
            </IconField>
          </div>
          <div class="flex gap-2">
            <Select
              v-model="statusFilter"
              :options="statusOptions"
              optionLabel="label"
              placeholder="Status"
              size="md"
            />
          </div>
        </div>

        <!-- Document Requests Table -->
        <Card>
          <template #header>
            <div class="flex justify-between items-center py-4 px-4">
              <h3 class="text-lg font-semibold text-gray-900">Recent Requests</h3>
              <Button
                label="Refresh"
                icon="pi pi-refresh"
                variant="ghost"
                size="sm"
                @click="refreshData"
                :loading="loading"
              />
            </div>
          </template>
          <template #content>
            <RequestsDatatable
              :requests="filteredRequests"
              :requestStatus="requestStatus"
              :loading="loading"
              @request-deleted="onRequestDeleted"
            />
          </template>
        </Card>
      </div>
    </main>

    <TheFooter />
  </div>
</template>

<script setup>
// TODO: Add actions for the request - edit & Mark as Completed
// TODO: Fix defect UI search
import { InputText, Select, Card, Button, InputIcon, IconField } from 'primevue'
import TheMenubar from '../components/TheMenubar.vue'
import TheFooter from '../components/TheFooter.vue'
import StatCards from '@/components/StatCards.vue'
import RequestsDatatable from '@/components/RequestsDatatable.vue'
import { ref, computed, onMounted } from 'vue'
import { requestsStore } from '@/stores/requests'
import { requestStatusStore } from '@/stores/requestStatus'
import { documentStatusStore } from '@/stores/documentStatus'

const requestsStoreSession = requestsStore()
const requestStatusStoreSession = requestStatusStore()
const documentStatusStoreSession = documentStatusStore()

// Reactive data
const requests = ref(requestsStoreSession.requests)
const requestStatus = ref(requestStatusStoreSession.requestStatus)
const documentStatus = ref(documentStatusStoreSession.requestStatus)
const loading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('')

// TODO: Review the status mapping
const statusOptions = [
  { label: 'All Status', value: null },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Overdue', value: 'overdue' },
]

const statusLabel = (statusId) => {
  const status = requestStatus.value.find((s) => s.id === statusId)
  return status ? status.name : 'Unknown'
}

// Computed filtered requests
const filteredRequests = computed(() => {
  let filtered = requests.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (request) =>
        request.name.toLowerCase().includes(query) ||
        (Array.isArray(request.client_email)
          ? request.client_email.some((e) => e.email && e.email.toLowerCase().includes(query))
          : false),
    )
  }
  if (statusFilter.value && statusFilter.value.value) {
    // TODO: Add the overdue filter (status does not exit need to be calculated on the fly)
    if (statusFilter.value.label === 'Overdue') {
      const today = new Date()
      filtered = filtered.filter((request) => new Date(request.expectedDate) < today)
    } else {
      filtered = filtered.filter(
        (request) => statusLabel(request.statusId) === statusFilter.value.label,
      )
    }
  }
  return filtered
})

// Remove request from requests list when deleted
function onRequestDeleted(requestId) {
  const idx = requests.value.findIndex((r) => r.id === requestId)
  if (idx !== -1) requests.value.splice(idx, 1)
}

const refreshData = async () => {
  loading.value = true
  await requestsStoreSession.fetchUserRequests()
  loading.value = false
}

// Initialize data on mount
onMounted(async () => {
  loading.value = true
  requestStatus.value = await requestStatusStoreSession.fecthRequestStatus()
  documentStatus.value = await documentStatusStoreSession.fecthDocumentStatus()
  requests.value = await requestsStoreSession.fetchUserRequestsWithDocuments()
  // requestsStoreSession.setupRealtimeSubscription()
  loading.value = false
})
</script>
