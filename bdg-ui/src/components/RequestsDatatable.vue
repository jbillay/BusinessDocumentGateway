<template>
  <DataTable
    :value="requests"
    :loading="loading"
    dataKey="id"
    stripedRows
    :paginator="true"
    :rows="numberOfRows"
    :rowsPerPageOptions="[5, 10, 20, 50]"
    sortMode="multiple"
    class="w-full py-4 px-4"
    :expandedRows="expandedRows"
    @rowExpand="onRowExpand"
    @rowCollapse="onRowCollapse"
  >
    <template #empty> No request found. </template>
    <template #loading> Loading your requests. Please wait. </template>
    <Column expander />
    <Column field="name" header="Name">
      <template #body="{ data }">
        <a
          :href="`/request/${data.id}`"
          @click.prevent="$router.push({ name: 'request-detail', params: { id: data.id } })"
          class="text-blue-600 hover:underline cursor-pointer"
        >
          {{ data.name }}
        </a>
      </template>
    </Column>
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
    <Column header="Actions">
      <template #body="{ data }">
        <div class="flex gap-2">
          <Button
            icon="pi pi-check"
            severity="success"
            size="small"
            title="Mark as Completed"
            @click="markAsCompleted(data)"
          />
          <Button
            icon="pi pi-pencil"
            severity="info"
            size="small"
            title="Edit"
            @click="editRequest(data)"
          />
          <Button
            icon="pi pi-trash"
            severity="danger"
            size="small"
            title="Delete"
            @click="deleteRequest(data)"
          />
        </div>
      </template>
    </Column>
    <template #expansion="slotProps">
      <div class="p-4 bg-gray-50 border-t">
        <h4 class="font-semibold mb-2">Associated Documents</h4>
        <div v-if="slotProps.data.documents && slotProps.data.documents.length">
          <table class="min-w-full text-sm">
            <thead>
              <tr>
                <th class="text-left">Name</th>
                <th class="text-left">Mandatory</th>
                <th class="text-left">Specific Date</th>
                <th class="text-left">Description</th>
                <th class="text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="doc in slotProps.data.documents" :key="doc.id">
                <td>{{ doc.name }}</td>
                <td>{{ doc.mandatory ? 'Yes' : 'No' }}</td>
                <td>{{ formatDate(doc.expectedDate) }}</td>
                <td>{{ doc.desc }}</td>
                <td>
                  <span
                    class="px-2 py-1 text-xs font-semibold rounded-full"
                    :class="statusBadgeClass(doc.statusName)"
                  >
                    {{ doc.statusName }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-gray-500">No documents associated.</div>
      </div>
    </template>
    <ConfirmDialog />
  </DataTable>
</template>

<script setup>
// TODO: Add a popover if more than 1 email
import { DataTable, Column, Button, ConfirmDialog } from 'primevue'
import { requestsStore } from '@/stores/requests'
import { useToast } from 'primevue/usetoast'
import { ref, watchEffect, defineEmits } from 'vue'
import { useConfirm } from 'primevue/useconfirm'

const requestsStoreSession = requestsStore()
const toast = useToast()
const confirm = useConfirm()
const emit = defineEmits(['request-deleted'])

// Row expansion state
const expandedRows = ref([])

const onRowExpand = () => {}
const onRowCollapse = () => {}

const props = defineProps(['requests', 'requestStatus', 'loading'])

watchEffect(() => {})

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
    // Document Specific badges
    case 'Received':
      return 'bg-orange-100 text-orange-800'
    case 'Approved':
      return 'bg-blue-100 text-blue-800'
    case 'Rejected':
      return 'bg-red-100 text-red-800'
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

async function deleteRequest(request) {
  confirm.require({
    message: `Are you sure you want to delete the request "${request.name}" and all its documents?`,
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      const success = await requestsStoreSession.removeRequestAndDocuments(request.id)
      if (success) {
        toast.add({
          severity: 'success',
          summary: 'Request deleted',
          detail: `Request "${request.name}" and its documents have been deleted.`,
          life: 8000,
        })
        // Emit event to parent to update request list
        emit('request-deleted', request.id)
      } else {
        toast.add({
          severity: 'error',
          summary: 'Delete failed',
          detail: `Failed to delete request "${request.name}".`,
          life: 8000,
        })
      }
    },
    reject: () => {},
  })
}

function markAsCompleted(request) {
  // TODO: Implement mark as completed logic
  console.log('Mark as completed:', request)
}

function editRequest(request) {
  // TODO: Implement edit logic
  console.log('Edit request:', request)
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
