<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { FilterMatchMode } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import MultiSelect from 'primevue/multiselect'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import RequestDialog from '@/components/dashboard/RequestDialog.vue'
import ActivityPanel from '@/components/dashboard/ActivityPanel.vue'
import { useRequestsStore, type RequestInput } from '@/stores/requests'
import { useActivityStore } from '@/stores/activity'
import { useAuthStore } from '@/stores/auth'
import { useBillingStore } from '@/stores/billing'
import type { DocumentRequest, RequestStatus } from '@/types'
import { STATUS_LABELS, STATUS_SEVERITIES, formatBytes, requestProgress } from '@/types'

const requestsStore = useRequestsStore()
const activityStore = useActivityStore()
const auth = useAuthStore()
const billing = useBillingStore()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const dialogVisible = ref(false)
const editing = ref<DocumentRequest | null>(null)
const saving = ref(false)

const filters = ref({
  global: { value: null as string | null, matchMode: FilterMatchMode.CONTAINS },
  status: { value: null as RequestStatus[] | null, matchMode: FilterMatchMode.IN },
})

const statusOptions = (Object.keys(STATUS_LABELS) as RequestStatus[]).map((value) => ({
  value,
  label: STATUS_LABELS[value],
}))

const storageUsed = computed(() => {
  const gb = requestsStore.storageBytes / (1024 * 1024 * 1024)
  return gb >= 0.01 ? `${gb.toFixed(2)} GB` : formatBytes(requestsStore.storageBytes)
})
/** Plan-aware storage cap for the stat hint; falls back while entitlements load. */
const storageCap = computed(() =>
  billing.storage.limit !== null ? `/ ${formatBytes(billing.storage.limit)}` : undefined,
)

onMounted(async () => {
  billing.load()
  await Promise.all([requestsStore.fetchAll(), activityStore.fetch()])
  requestsStore.subscribe()
  activityStore.subscribe()
})

onUnmounted(() => {
  requestsStore.unsubscribe()
  activityStore.unsubscribe()
})

function openDetail(request: DocumentRequest) {
  router.push({ name: 'request-detail', params: { id: request.id } })
}

function openCreate() {
  router.push({ name: 'request-new' })
}

function openEdit(request: DocumentRequest) {
  editing.value = request
  dialogVisible.value = true
}

async function save(input: RequestInput) {
  saving.value = true
  try {
    if (editing.value) {
      await requestsStore.updateRequest(editing.value.id, input)
      toast.add({ severity: 'success', summary: 'Request updated', life: 3000 })
    } else {
      const request = await requestsStore.createRequest(input)
      const link = `${window.location.origin}/portal/${request.portal_token}`
      await navigator.clipboard.writeText(link).catch(() => {})
      toast.add({
        severity: 'success',
        summary: 'Request created',
        detail: 'The client portal link was copied to your clipboard.',
        life: 5000,
      })
    }
    dialogVisible.value = false
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Save failed',
      detail: error instanceof Error ? error.message : 'Please try again.',
      life: 5000,
    })
  } finally {
    saving.value = false
  }
}

function confirmDelete(request: DocumentRequest) {
  confirm.require({
    message: `Delete "${request.name}"? Uploaded files and history will be removed.`,
    header: 'Delete request',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Delete', severity: 'danger' },
    accept: async () => {
      try {
        await requestsStore.deleteRequest(request.id)
        toast.add({ severity: 'success', summary: 'Request deleted', life: 3000 })
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Delete failed',
          detail: error instanceof Error ? error.message : undefined,
          life: 5000,
        })
      }
    },
  })
}

async function download(request: DocumentRequest) {
  try {
    const count = await requestsStore.downloadFiles(request)
    if (count === 0) {
      toast.add({ severity: 'info', summary: 'No files yet', detail: 'The client has not uploaded any documents.', life: 4000 })
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Download failed',
      detail: error instanceof Error ? error.message : undefined,
      life: 5000,
    })
  }
}

async function copyPortalLink(request: DocumentRequest) {
  await navigator.clipboard.writeText(requestsStore.portalLink(request))
  toast.add({ severity: 'success', summary: 'Portal link copied', detail: 'Share it with your client.', life: 3000 })
}

function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function lastActivity(request: DocumentRequest): string {
  const seconds = Math.floor((Date.now() - new Date(request.updated_at).getTime()) / 1000)
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))} mins ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hrs ago`
  const days = Math.floor(seconds / 86400)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}
</script>

<template>
  <div class="dashboard">
    <AppNavbar />

    <main class="dashboard__main">
      <div class="dashboard__content">
        <div class="dashboard__header">
          <div>
            <h1 class="dashboard__title">Overview</h1>
            <p class="dashboard__subtitle">Welcome back, {{ auth.profile?.first_name || 'there' }}. Here's what's happening today.</p>
          </div>
          <Button label="Create New Request" icon="pi pi-plus" @click="openCreate" />
        </div>

        <!-- Storage soft wall (task 016): persistent from 80%, explicit at 100%. -->
        <div v-if="billing.storage.nearLimit" class="dashboard__storage-banner" :class="{ 'is-full': billing.storage.atLimit }">
          <i :class="billing.storage.atLimit ? 'pi pi-exclamation-circle' : 'pi pi-exclamation-triangle'" />
          <span v-if="billing.storage.atLimit">
            Your storage is full — new requests are paused. Client uploads to existing requests keep working. Free
            space by deleting completed requests, or upgrade for more room.
          </span>
          <span v-else>
            You've used {{ Math.round(billing.storage.ratio * 100) }}% of your
            {{ formatBytes(billing.storage.limit ?? 0) }} storage.
          </span>
          <Button label="View plan" size="small" text @click="router.push({ name: 'billing' })" />
        </div>

        <div class="dashboard__stats">
          <StatCard label="Pending Requests" :value="String(requestsStore.stats.pending)" icon="pi pi-hourglass" />
          <StatCard label="Completed" :value="String(requestsStore.stats.completed)" icon="pi pi-check-circle" hint-class="positive" />
          <StatCard
            label="Awaiting Client"
            :value="String(requestsStore.stats.awaitingClient)"
            icon="pi pi-user"
            :hint="requestsStore.stats.awaitingClient > 0 ? 'Needs attention' : undefined"
            hint-class="attention"
          />
          <StatCard label="Storage" :value="storageUsed" icon="pi pi-cloud" :hint="storageCap" />
        </div>

        <section class="bdg-card dashboard__table-card">
          <div class="dashboard__table-header">
            <h2 class="dashboard__table-title">Recent Requests</h2>
            <div class="dashboard__table-tools">
              <IconField>
                <InputIcon class="pi pi-search" />
                <InputText v-model="filters.global.value" placeholder="Search by name or email..." />
              </IconField>
              <MultiSelect
                v-model="filters.status.value"
                :options="statusOptions"
                option-label="label"
                option-value="value"
                placeholder="Filter by status"
                :show-toggle-all="false"
                style="min-width: 11rem"
              />
            </div>
          </div>

          <DataTable
            v-model:filters="filters"
            :value="requestsStore.requests"
            :loading="requestsStore.loading"
            :global-filter-fields="['name', 'client_email', 'client_name', 'client_company']"
            data-key="id"
            paginator
            :rows="8"
            :row-hover="true"
            @row-click="openDetail($event.data)"
          >
            <template #empty>
              <div class="dashboard__empty">
                <i class="pi pi-inbox" style="font-size: 2rem; color: #cbd5e1" />
                <p>No document requests yet. Create your first one to get started.</p>
                <Button label="Create New Request" icon="pi pi-plus" outlined @click="openCreate" />
              </div>
            </template>

            <Column field="client_name" header="Client" sortable>
              <template #body="{ data }">
                <span class="font-semibold">{{ data.client_company || data.client_name || data.client_email }}</span>
              </template>
            </Column>
            <Column field="name" header="Request Name" sortable>
              <template #body="{ data }">
                <router-link
                  :to="{ name: 'request-detail', params: { id: data.id } }"
                  class="dashboard__request-link"
                  @click.stop
                >
                  <i class="pi pi-file" style="color: #94a3b8" />
                  {{ data.name }}
                </router-link>
              </template>
            </Column>
            <Column field="expected_date" header="Expected Date" sortable>
              <template #body="{ data }">
                <span class="flex align-items-center gap-2">
                  <i class="pi pi-calendar" style="color: #94a3b8" />
                  {{ formatDate(data.expected_date) }}
                </span>
              </template>
            </Column>
            <Column field="status" header="Status" sortable :show-filter-menu="false">
              <template #body="{ data }">
                <Tag :value="STATUS_LABELS[data.status as RequestStatus]" :severity="STATUS_SEVERITIES[data.status as RequestStatus]" />
              </template>
            </Column>
            <Column field="client_email" header="Client Email">
              <template #body="{ data }">
                <span class="flex align-items-center gap-2 text-sm">
                  <i class="pi pi-envelope" style="color: #94a3b8" />
                  {{ data.client_email }}
                </span>
              </template>
            </Column>
            <Column header="Progress" style="min-width: 10rem">
              <template #body="{ data }">
                <div class="flex align-items-center gap-2">
                  <ProgressBar :value="requestProgress(data)" :show-value="false" style="height: 8px; flex: 1" />
                  <span class="text-sm" style="min-width: 2.5rem; text-align: right">{{ requestProgress(data) }}%</span>
                </div>
              </template>
            </Column>
            <Column field="updated_at" header="Last Activity" sortable>
              <template #body="{ data }">
                <span class="text-sm" style="color: #64748b">{{ lastActivity(data) }}</span>
              </template>
            </Column>
            <Column header="" style="width: 12rem">
              <template #body="{ data }">
                <div class="flex gap-1 justify-content-end" @click.stop>
                  <Button icon="pi pi-pencil" text rounded severity="secondary" v-tooltip.top="'Edit request'" @click="openEdit(data)" />
                  <Button icon="pi pi-link" text rounded severity="secondary" v-tooltip.top="'Copy portal link'" @click="copyPortalLink(data)" />
                  <Button icon="pi pi-download" text rounded severity="secondary" v-tooltip.top="'Download documents'" @click="download(data)" />
                  <Button icon="pi pi-trash" text rounded severity="danger" v-tooltip.top="'Delete request'" @click="confirmDelete(data)" />
                </div>
              </template>
            </Column>
          </DataTable>
        </section>
      </div>

      <ActivityPanel />
    </main>

    <AppFooter />

    <RequestDialog v-model:visible="dialogVisible" :request="editing" :saving="saving" @save="save" />
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.dashboard__main {
  flex: 1;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.5rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 21rem;
  gap: 1.25rem;
  align-items: start;
}
.dashboard__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}
.dashboard__storage-banner {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid #fde68a;
  background: #fffbeb;
  color: #92400e;
  font-size: 0.9rem;
  flex-wrap: wrap;
}
.dashboard__storage-banner.is-full {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}
.dashboard__storage-banner span {
  flex: 1;
  min-width: 14rem;
  line-height: 1.45;
}
.dashboard__title {
  margin: 0;
  font-size: 2rem;
}
.dashboard__subtitle {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.925rem;
}
.dashboard__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.dashboard__table-card {
  padding: 1.25rem;
  overflow: hidden;
}
.dashboard__table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.dashboard__table-title {
  margin: 0;
  font-size: 1.2rem;
}
.dashboard__table-tools {
  display: flex;
  gap: 0.625rem;
  flex-wrap: wrap;
}
.dashboard__request-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--bdg-deep);
  text-decoration: none;
  font-weight: 500;
}
.dashboard__request-link:hover {
  color: var(--bdg-blue);
  text-decoration: underline;
}
.dashboard__empty {
  text-align: center;
  padding: 2.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: #64748b;
}
@media (max-width: 1100px) {
  .dashboard__main {
    grid-template-columns: 1fr;
  }
  .dashboard__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 560px) {
  .dashboard__stats {
    grid-template-columns: 1fr;
  }
}
</style>
