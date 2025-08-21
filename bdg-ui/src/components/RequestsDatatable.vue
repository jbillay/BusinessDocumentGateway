<template>
  <DataTable
    :value="requests"
    :loading="loading"
    :selection="selectedRequests"
    :selectAll="selectAll"
    dataKey="id"
    stripedRows
    :paginator="true"
    :rows="numberOfRows"
    :rowsPerPageOptions="[5, 10, 20, 50]"
    sortMode="multiple"
    class="w-full py-4 px-4"
  >
    <template #empty> No request found. </template>
    <template #loading> Loading your requests. Please wait. </template>
    <Column selectionMode="multiple" />
    <Column field="name" header="Name" />
    <Column dataType="date" header="Expected Date">
      <template #body="{ data }">
        {{ formatDate(data.expectedDate) }}
      </template>
    </Column>
    <!-- Status Column with Badge -->
    <Column header="Status">
      <template #body="slotProps">
        <span
          class="px-2 py-1 text-xs font-semibold rounded-full"
          :class="statusBadgeClass(statusLabel(slotProps.data.statusId))"
        >
          {{ statusLabel(slotProps.data.statusId) }}
        </span>
      </template>
    </Column>

    <!-- Client Email -->
    <Column header="Client Email">
      <template #body="{ data }">
        <span v-html="displayClientEmails(data.clientContact)"></span> </template
    ></Column>
    <Column header="Due Date">
      <template #body="{ data }">
        <span v-html="getDateStatus(data.expectedDate)"></span>
      </template>
    </Column>
    <template #footer> In total there are {{ requests ? requests.length : 0 }} requests. </template>
  </DataTable>
</template>

<script setup>
// TODO: Add a popover if more than 1 email
import { DataTable, Column } from 'primevue'
import { ref, watchEffect } from 'vue'

const props = defineProps(['requests', 'requestStatus', 'loading'])

watchEffect(() => {})

const selectedRequests = ref([]) // For multi-select in DataTable
const selectAll = ref(false) // For select all functionality
const numberOfRows = ref(5) // Default number of rows per page

const statusLabel = (statusId) => {
  const status = props.requestStatus.find((s) => s.id === statusId)
  return status ? status.name : 'Unknown'
}
// Function to style status badges
const statusBadgeClass = (status) => {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'In Progress':
      return 'bg-blue-100 text-blue-800'
    case 'Completed':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const displayClientEmails = (clientEmailString) => {
  const clientEmailList = JSON.parse(clientEmailString)
  if (clientEmailList.length === 1) {
    return clientEmailList[0].email
  } else if (clientEmailList.length > 1) {
    return `${clientEmailList.length} emails`
  }
}

// Methods
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const getDateStatus = (dateString) => {
  const today = new Date()
  const date = new Date(dateString)
  const diffTime = date - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return `<p class="text-red-800">${Math.abs(diffDays)} days overdue</p>`
  if (diffDays === 0) return '<p class="text-orange-800">Due today</p>'
  if (diffDays === 1) return '<p>Due tomorrow</p>'
  return `<p>${diffDays} days remaining</p>`
}
</script>
