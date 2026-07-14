<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import type { RealtimeChannel } from '@supabase/supabase-js'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'
import Avatar from 'primevue/avatar'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import RequestDialog from '@/components/dashboard/RequestDialog.vue'
import { supabase } from '@/lib/supabase'
import { useRequestsStore, type RequestInput } from '@/stores/requests'
import type { ActivityEvent, RequestStatus, UploadedFile } from '@/types'
import { LINK_EXPIRY_OPTIONS, STATUS_LABELS, STATUS_SEVERITIES, formatBytes, linkExpired, requestProgress } from '@/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const requestsStore = useRequestsStore()

const requestId = computed(() => String(route.params.id))
const request = computed(() => requestsStore.requests.find((r) => r.id === requestId.value) ?? null)
const loaded = ref(false)

const dialogVisible = ref(false)
const saving = ref(false)
const events = ref<ActivityEvent[]>([])
let eventsChannel: RealtimeChannel | null = null

onMounted(async () => {
  if (requestsStore.requests.length === 0) await requestsStore.fetchAll()
  requestsStore.subscribe()
  loaded.value = true
  await fetchEvents()
  subscribeEvents()
})

onUnmounted(() => {
  requestsStore.unsubscribe()
  if (eventsChannel) {
    supabase.removeChannel(eventsChannel)
    eventsChannel = null
  }
})

async function fetchEvents() {
  const { data, error } = await supabase
    .from('activity_events')
    .select('*')
    .eq('request_id', requestId.value)
    .order('created_at', { ascending: false })
    .limit(30)
  if (!error) events.value = data ?? []
}

/** Live-append activity rows (uploads, reminders) while the page is open. */
function subscribeEvents() {
  eventsChannel = supabase
    .channel(`request-activity-${requestId.value}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'activity_events', filter: `request_id=eq.${requestId.value}` },
      (payload) => {
        events.value = [payload.new as ActivityEvent, ...events.value]
      },
    )
    .subscribe()
}

const progress = computed(() => (request.value ? requestProgress(request.value) : 0))
const items = computed(() => request.value?.request_items ?? [])
const uploadedCount = computed(() => items.value.filter((i) => i.status === 'uploaded').length)
const allFiles = computed(() => items.value.flatMap((i) => i.uploaded_files ?? []))
const requestBytes = computed(() => allFiles.value.reduce((sum, f) => sum + (f.file_size ?? 0), 0))

const clientInitials = computed(() => {
  const parts = (request.value?.client_name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('')
})

const dueInfo = computed(() => {
  const req = request.value
  if (!req?.expected_date) return null
  const due = new Date(req.expected_date + 'T23:59:59')
  const days = Math.ceil((due.getTime() - Date.now()) / 86400000)
  if (req.status === 'completed') return { label: 'Completed', severity: 'success' as const }
  if (days < 0) return { label: `Overdue by ${-days} day${days === -1 ? '' : 's'}`, severity: 'danger' as const }
  if (days === 0) return { label: 'Due today', severity: 'warn' as const }
  return { label: `${days} day${days === 1 ? '' : 's'} left`, severity: days <= 3 ? ('warn' as const) : ('info' as const) }
})

const portalLink = computed(() => (request.value ? requestsStore.portalLink(request.value) : ''))
const isExpired = computed(() => (request.value ? linkExpired(request.value) : false))
const expiryText = computed(() => {
  const at = request.value?.expires_at
  if (!at) return 'Never expires'
  const label = new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  return isExpired.value ? `Expired ${label}` : `Expires ${label}`
})

/* Per-request security editing */
const securityDialog = ref(false)
const securityForm = reactive({ pinEnabled: false, pin: '', expiryDays: -1 as number })
const securitySaving = ref(false)
const SECURITY_EXPIRY_OPTIONS = [{ label: 'Keep current expiry', value: -1 }, ...LINK_EXPIRY_OPTIONS]

function openSecurityDialog() {
  const req = request.value
  if (!req) return
  securityForm.pinEnabled = !!req.portal_pin
  securityForm.pin = req.portal_pin ?? ''
  securityForm.expiryDays = -1
  securityDialog.value = true
}

function generatePin() {
  securityForm.pin = String(Math.floor(100000 + Math.random() * 900000))
}

async function saveSecurity() {
  const req = request.value
  if (!req) return
  if (securityForm.pinEnabled && !securityForm.pin.trim()) return
  securitySaving.value = true
  try {
    await requestsStore.updateSecurity(req.id, {
      portal_pin: securityForm.pinEnabled ? securityForm.pin.trim() : null,
      ...(securityForm.expiryDays === -1
        ? {}
        : {
            expires_at:
              securityForm.expiryDays > 0
                ? new Date(Date.now() + securityForm.expiryDays * 86400000).toISOString()
                : null,
          }),
    })
    securityDialog.value = false
    toast.add({ severity: 'success', summary: 'Portal security updated', life: 3000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Update failed', detail: error instanceof Error ? error.message : undefined, life: 5000 })
  } finally {
    securitySaving.value = false
  }
}

/* New-link generation (old link stops working) */
const regenDialog = ref(false)
const regenDays = ref(30)
const regenerating = ref(false)

async function regenerateLink() {
  const req = request.value
  if (!req) return
  regenerating.value = true
  try {
    const { emailSent } = await requestsStore.regeneratePortalLink(req.id, regenDays.value)
    regenDialog.value = false
    toast.add({
      severity: 'success',
      summary: 'New link generated',
      detail: emailSent
        ? 'The old link no longer works. The new link was emailed to your client.'
        : 'The old link no longer works. The email could not be sent — copy the new link and share it manually.',
      life: 6000,
    })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Generation failed', detail: error instanceof Error ? error.message : undefined, life: 5000 })
  } finally {
    regenerating.value = false
  }
}

async function copyPin() {
  if (!request.value?.portal_pin) return
  await navigator.clipboard.writeText(request.value.portal_pin)
  toast.add({ severity: 'success', summary: 'Access code copied', life: 2500 })
}

function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}

const dotColors: Record<string, string> = {
  upload: '#3b82f6',
  completed: '#10b981',
  reminder: '#94a3b8',
  created: '#06b6d4',
  info: '#94a3b8',
}

async function save(input: RequestInput) {
  if (!request.value) return
  saving.value = true
  try {
    await requestsStore.updateRequest(request.value.id, input)
    dialogVisible.value = false
    toast.add({ severity: 'success', summary: 'Request updated', life: 3000 })
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

async function copyPortalLink() {
  await navigator.clipboard.writeText(portalLink.value)
  toast.add({ severity: 'success', summary: 'Portal link copied', detail: 'Share it with your client.', life: 3000 })
}

function openPortal() {
  window.open(portalLink.value, '_blank', 'noopener')
}

async function remind() {
  if (!request.value) return
  try {
    const result = await requestsStore.sendReminder(request.value)
    toast.add({
      severity: 'success',
      summary: 'Reminder sent',
      detail: `A reminder email was sent to ${result.to}.`,
      life: 4000,
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Reminder failed',
      detail: error instanceof Error ? error.message : 'The email could not be delivered.',
      life: 5000,
    })
  }
}

async function downloadAll() {
  if (!request.value) return
  try {
    const count = await requestsStore.downloadFiles(request.value)
    if (count === 0) {
      toast.add({ severity: 'info', summary: 'No files yet', detail: 'The client has not uploaded any documents.', life: 4000 })
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Download failed', detail: error instanceof Error ? error.message : undefined, life: 5000 })
  }
}

async function downloadOne(file: UploadedFile) {
  try {
    await requestsStore.downloadFile(file)
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Download failed', detail: error instanceof Error ? error.message : undefined, life: 5000 })
  }
}

async function setStatus(status: RequestStatus) {
  if (!request.value) return
  try {
    await requestsStore.setStatus(request.value.id, status)
    toast.add({ severity: 'success', summary: `Marked as ${STATUS_LABELS[status]}`, life: 3000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Update failed', detail: error instanceof Error ? error.message : undefined, life: 5000 })
  }
}

function confirmDelete() {
  const req = request.value
  if (!req) return
  confirm.require({
    message: `Delete "${req.name}"? Uploaded files and history will be removed.`,
    header: 'Delete request',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Delete', severity: 'danger' },
    accept: async () => {
      try {
        await requestsStore.deleteRequest(req.id)
        toast.add({ severity: 'success', summary: 'Request deleted', life: 3000 })
        router.push({ name: 'dashboard' })
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
</script>

<template>
  <div class="detail">
    <AppNavbar />

    <main class="detail__main">
      <router-link :to="{ name: 'dashboard' }" class="detail__back">
        <i class="pi pi-arrow-left" /> Back to Dashboard
      </router-link>

      <!-- Not found / deleted -->
      <section v-if="loaded && !request" class="bdg-card detail__notfound">
        <i class="pi pi-inbox" style="font-size: 2.5rem; color: #cbd5e1" />
        <h2>Request not found</h2>
        <p>This request may have been deleted, or the link is incorrect.</p>
        <Button label="Back to Dashboard" icon="pi pi-arrow-left" outlined @click="router.push({ name: 'dashboard' })" />
      </section>

      <template v-else-if="request">
        <!-- Header -->
        <header class="bdg-card detail__header">
          <div class="detail__header-info">
            <div class="detail__title-row">
              <h1 class="detail__title">{{ request.name }}</h1>
              <Tag :value="STATUS_LABELS[request.status]" :severity="STATUS_SEVERITIES[request.status]" />
              <Tag v-if="request.priority === 'high'" value="High Priority" severity="danger" icon="pi pi-flag" />
              <Tag v-if="dueInfo" :value="dueInfo.label" :severity="dueInfo.severity" icon="pi pi-clock" />
              <Tag v-if="isExpired" value="Link Expired" severity="danger" icon="pi pi-link" />
            </div>
            <p v-if="request.description" class="detail__description">{{ request.description }}</p>
            <p class="detail__meta">
              ID: {{ request.id.slice(0, 8).toUpperCase() }} · Created {{ formatDateTime(request.created_at) }} · Last
              activity {{ timeAgo(request.updated_at) }}
            </p>
          </div>
          <div class="detail__actions">
            <Button label="Edit" icon="pi pi-pencil" severity="secondary" outlined @click="dialogVisible = true" />
            <Button label="Remind" icon="pi pi-bell" severity="secondary" outlined @click="remind" />
            <Button label="Copy Link" icon="pi pi-link" severity="secondary" outlined @click="copyPortalLink" />
            <Button label="Download All" icon="pi pi-download" severity="secondary" outlined :disabled="allFiles.length === 0" @click="downloadAll" />
            <Button
              v-if="request.status !== 'completed'"
              label="Mark Completed"
              icon="pi pi-check"
              severity="success"
              @click="setStatus('completed')"
            />
            <Button v-else label="Reopen" icon="pi pi-refresh" severity="secondary" @click="setStatus('pending')" />
            <Button icon="pi pi-trash" severity="danger" text rounded v-tooltip.top="'Delete request'" @click="confirmDelete" />
          </div>
        </header>

        <!-- Expired-link banner -->
        <section v-if="isExpired" class="bdg-card detail__expired">
          <i class="pi pi-clock detail__expired-icon" />
          <div class="detail__expired-text">
            <strong>The portal link has expired.</strong>
            <p>Your client can no longer open it. Generate a new secure link and share it with them — the old one stays dead.</p>
          </div>
          <Button label="Generate New Link" icon="pi pi-refresh" severity="warn" @click="regenDialog = true" />
        </section>

        <div class="detail__grid">
          <div class="detail__col-main">
            <!-- Progress -->
            <section class="bdg-card detail__card">
              <div class="detail__card-header">
                <h2 class="detail__card-title"><i class="pi pi-chart-line" /> Progress</h2>
                <span class="detail__progress-count">{{ uploadedCount }} of {{ items.length }} documents received</span>
              </div>
              <div class="detail__progress-row">
                <ProgressBar :value="progress" :show-value="false" style="height: 10px; flex: 1" />
                <span class="detail__progress-pct">{{ progress }}%</span>
              </div>
              <div class="detail__progress-facts">
                <span><i class="pi pi-calendar" /> Due {{ formatDate(request.expected_date) }}</span>
                <span><i class="pi pi-file" /> {{ allFiles.length }} file{{ allFiles.length === 1 ? '' : 's' }} uploaded</span>
                <span><i class="pi pi-cloud" /> {{ formatBytes(requestBytes) }} stored</span>
              </div>
            </section>

            <!-- Document checklist -->
            <section class="bdg-card detail__card">
              <div class="detail__card-header">
                <h2 class="detail__card-title"><i class="pi pi-check-square" /> Requested Documents</h2>
                <Button label="Edit checklist" icon="pi pi-pencil" text size="small" @click="dialogVisible = true" />
              </div>

              <p v-if="items.length === 0" class="detail__empty-text">
                No documents on this request yet. Use "Edit checklist" to add some.
              </p>

              <div v-for="item in items" :key="item.id" class="doc-item">
                <div class="doc-item__status" :class="{ 'doc-item__status--done': item.status === 'uploaded' }">
                  <i :class="item.status === 'uploaded' ? 'pi pi-check' : 'pi pi-hourglass'" />
                </div>
                <div class="doc-item__body">
                  <div class="doc-item__head">
                    <span class="doc-item__title">{{ item.title }}</span>
                    <Tag
                      :value="item.status === 'uploaded' ? 'Received' : 'Waiting for client'"
                      :severity="item.status === 'uploaded' ? 'success' : 'warn'"
                    />
                  </div>
                  <p v-if="item.description" class="doc-item__desc">{{ item.description }}</p>

                  <ul v-if="(item.uploaded_files ?? []).length > 0" class="doc-files">
                    <li v-for="file in item.uploaded_files" :key="file.id" class="doc-file">
                      <i class="pi pi-paperclip" />
                      <span class="doc-file__name">{{ file.file_name }}</span>
                      <span class="doc-file__meta">{{ formatBytes(file.file_size) }} · {{ timeAgo(file.created_at) }}</span>
                      <Button
                        icon="pi pi-download"
                        text
                        rounded
                        size="small"
                        severity="secondary"
                        v-tooltip.top="'Download file'"
                        @click="downloadOne(file)"
                      />
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </div>

          <aside class="detail__col-side">
            <!-- Client -->
            <section class="bdg-card detail__card">
              <span class="bdg-label-sm">Client</span>
              <div class="client-row">
                <Avatar :label="clientInitials" shape="circle" size="large" style="background: #e0e7ff; color: #3b82f6; font-weight: 600" />
                <div>
                  <p class="client-row__name">{{ request.client_name || '—' }}</p>
                  <span v-if="request.client_company" class="client-row__company">{{ request.client_company }}</span>
                </div>
              </div>
              <ul class="client-contacts">
                <li>
                  <i class="pi pi-envelope" />
                  <a :href="`mailto:${request.client_email}`">{{ request.client_email }}</a>
                </li>
                <li v-if="request.client_phone">
                  <i class="pi pi-phone" />
                  <a :href="`tel:${request.client_phone}`">{{ request.client_phone }}</a>
                </li>
              </ul>
            </section>

            <!-- Portal link -->
            <section class="bdg-card detail__card">
              <span class="bdg-label-sm">Client portal</span>
              <p class="portal-hint">Your client uploads documents through this secure link — no account needed.</p>
              <div class="portal-link">
                <i class="pi pi-lock" />
                <span class="portal-link__url">{{ portalLink }}</span>
              </div>
              <div class="portal-actions">
                <Button label="Copy" icon="pi pi-copy" size="small" outlined severity="secondary" class="flex-1" :disabled="isExpired" @click="copyPortalLink" />
                <Button label="Preview" icon="pi pi-external-link" size="small" outlined severity="secondary" class="flex-1" :disabled="isExpired" @click="openPortal" />
              </div>

              <div class="portal-security">
                <div class="portal-security__row">
                  <span class="portal-security__label"><i class="pi pi-key" /> Access code</span>
                  <span v-if="request.portal_pin" class="portal-security__value">
                    <code>{{ request.portal_pin }}</code>
                    <Button icon="pi pi-copy" text rounded size="small" severity="secondary" v-tooltip.top="'Copy code'" @click="copyPin" />
                  </span>
                  <span v-else class="portal-security__value portal-security__value--muted">None</span>
                </div>
                <div class="portal-security__row">
                  <span class="portal-security__label"><i class="pi pi-clock" /> Link expiry</span>
                  <span class="portal-security__value" :class="{ 'portal-security__value--danger': isExpired }">{{ expiryText }}</span>
                </div>
                <div class="portal-actions">
                  <Button label="Security" icon="pi pi-lock" size="small" text severity="secondary" class="flex-1" @click="openSecurityDialog" />
                  <Button label="New link" icon="pi pi-refresh" size="small" text severity="secondary" class="flex-1" @click="regenDialog = true" />
                </div>
              </div>
            </section>

            <!-- Activity for this request -->
            <section class="bdg-card detail__card">
              <span class="bdg-label-sm">Request activity</span>
              <ul class="activity-list">
                <li v-if="events.length === 0" class="activity-empty">No activity yet.</li>
                <li v-for="event in events" :key="event.id" class="activity-item">
                  <span class="activity-dot" :style="{ background: dotColors[event.type] ?? '#94a3b8' }" />
                  <div>
                    <p class="activity-message">{{ event.message }}</p>
                    <span class="activity-time">{{ timeAgo(event.created_at) }}</span>
                  </div>
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </template>
    </main>

    <AppFooter />

    <RequestDialog v-model:visible="dialogVisible" :request="request" :saving="saving" @save="save" />

    <!-- Per-request portal security -->
    <Dialog v-model:visible="securityDialog" modal header="Portal Security" :style="{ width: '26rem', maxWidth: '95vw' }">
      <div class="secdlg-row">
        <div>
          <div class="secdlg-row__title">Access code</div>
          <div class="secdlg-row__desc">Require a code to open this request's portal.</div>
        </div>
        <ToggleSwitch v-model="securityForm.pinEnabled" aria-label="Require access code" />
      </div>
      <div v-if="securityForm.pinEnabled" class="bdg-field">
        <label for="sec-pin">Access code</label>
        <div class="secdlg-pin">
          <InputText id="sec-pin" v-model="securityForm.pin" placeholder="e.g. 482913" maxlength="64" />
          <Button label="Generate" icon="pi pi-sync" outlined severity="secondary" @click="generatePin" />
        </div>
      </div>
      <div class="bdg-field">
        <label for="sec-expiry">Link expiry</label>
        <Select
          id="sec-expiry"
          v-model="securityForm.expiryDays"
          :options="SECURITY_EXPIRY_OPTIONS"
          option-label="label"
          option-value="value"
          class="w-full"
        />
        <small class="secdlg-hint">Durations are counted from now; the link itself stays the same.</small>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" text :disabled="securitySaving" @click="securityDialog = false" />
        <Button
          label="Save"
          icon="pi pi-check"
          :loading="securitySaving"
          :disabled="securityForm.pinEnabled && !securityForm.pin.trim()"
          @click="saveSecurity"
        />
      </template>
    </Dialog>

    <!-- New portal link -->
    <Dialog v-model:visible="regenDialog" modal header="Generate New Link" :style="{ width: '26rem', maxWidth: '95vw' }">
      <p class="secdlg-warning">
        <i class="pi pi-exclamation-triangle" />
        The current link stops working immediately. The new link is emailed to your client automatically.
      </p>
      <div class="bdg-field">
        <label for="regen-expiry">New link is valid for</label>
        <Select
          id="regen-expiry"
          v-model="regenDays"
          :options="LINK_EXPIRY_OPTIONS"
          option-label="label"
          option-value="value"
          class="w-full"
        />
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" text :disabled="regenerating" @click="regenDialog = false" />
        <Button label="Generate New Link" icon="pi pi-refresh" :loading="regenerating" @click="regenerateLink" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.detail {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.detail__main {
  flex: 1;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.5rem;
}
.detail__back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  transition: color 0.15s ease;
}
.detail__back:hover {
  color: var(--bdg-blue);
}
.detail__notfound {
  padding: 3rem 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
}
.detail__notfound h2 {
  margin: 0.5rem 0 0;
}
.detail__notfound p {
  margin: 0 0 1rem;
}

/* Header */
.detail__header {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  gap: 1.25rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}
.detail__header-info {
  min-width: 16rem;
  flex: 1;
}
.detail__title-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
}
.detail__title {
  margin: 0;
  font-size: 1.65rem;
}
.detail__description {
  margin: 0.5rem 0 0;
  color: #475569;
  max-width: 44rem;
}
.detail__meta {
  margin: 0.5rem 0 0;
  color: #94a3b8;
  font-size: 0.8rem;
}
.detail__actions {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Expired-link banner */
.detail__expired {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
  border: 1px solid #fcd34d;
  background: #fffbeb;
}
.detail__expired-icon {
  font-size: 1.5rem;
  color: #b45309;
}
.detail__expired-text {
  flex: 1;
  min-width: 14rem;
}
.detail__expired-text p {
  margin: 0.25rem 0 0;
  color: #92400e;
  font-size: 0.875rem;
}

/* Layout */
.detail__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 21rem;
  gap: 1.25rem;
  align-items: start;
}
.detail__col-main,
.detail__col-side {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
}
.detail__card {
  padding: 1.25rem;
}
.detail__card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.detail__card-title {
  margin: 0;
  font-size: 1.1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.detail__card-title .pi {
  color: var(--bdg-blue);
}
.detail__empty-text {
  margin: 0;
  color: #94a3b8;
  font-size: 0.9rem;
}

/* Progress card */
.detail__progress-count {
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
}
.detail__progress-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.detail__progress-pct {
  font-weight: 700;
  min-width: 3rem;
  text-align: right;
}
.detail__progress-facts {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
  color: #64748b;
  font-size: 0.85rem;
}
.detail__progress-facts .pi {
  color: #94a3b8;
  margin-right: 0.375rem;
}

/* Document checklist */
.doc-item {
  display: flex;
  gap: 0.875rem;
  padding: 1rem 0;
  border-top: 1px solid #f1f5f9;
}
.doc-item:last-child {
  padding-bottom: 0;
}
.doc-item__status {
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fef3c7;
  color: #b45309;
}
.doc-item__status--done {
  background: #d1fae5;
  color: #047857;
}
.doc-item__body {
  flex: 1;
  min-width: 0;
}
.doc-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.doc-item__title {
  font-weight: 600;
}
.doc-item__desc {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.85rem;
}
.doc-files {
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.doc-file {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  background: #f8fafc;
  border: 1px solid var(--bdg-border);
  border-radius: 0.625rem;
  padding: 0.375rem 0.375rem 0.375rem 0.75rem;
  font-size: 0.85rem;
}
.doc-file .pi-paperclip {
  color: #94a3b8;
}
.doc-file__name {
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.doc-file__meta {
  color: #94a3b8;
  white-space: nowrap;
}

/* Client card */
.client-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0.75rem 0 1rem;
}
.client-row__name {
  margin: 0;
  font-weight: 600;
}
.client-row__company {
  color: #64748b;
  font-size: 0.85rem;
}
.client-contacts {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.client-contacts li {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 0.875rem;
}
.client-contacts .pi {
  color: #94a3b8;
}
.client-contacts a {
  color: var(--bdg-blue);
  text-decoration: none;
  overflow-wrap: anywhere;
}
.client-contacts a:hover {
  text-decoration: underline;
}

/* Portal card */
.portal-hint {
  margin: 0.5rem 0 0.75rem;
  color: #64748b;
  font-size: 0.825rem;
}
.portal-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  border: 1px solid var(--bdg-border);
  border-radius: 0.625rem;
  padding: 0.55rem 0.75rem;
  font-size: 0.8rem;
  margin-bottom: 0.75rem;
}
.portal-link .pi {
  color: #94a3b8;
  flex-shrink: 0;
}
.portal-link__url {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #475569;
  font-family: monospace;
}
.portal-actions {
  display: flex;
  gap: 0.5rem;
}
.portal-security {
  margin-top: 0.875rem;
  padding-top: 0.875rem;
  border-top: 1px solid var(--bdg-border);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.portal-security__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.85rem;
}
.portal-security__label {
  color: #64748b;
}
.portal-security__label .pi {
  color: #94a3b8;
  margin-right: 0.375rem;
  font-size: 0.8rem;
}
.portal-security__value {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 500;
}
.portal-security__value code {
  background: #f1f5f9;
  border-radius: 0.375rem;
  padding: 0.125rem 0.5rem;
  font-size: 0.8rem;
}
.portal-security__value--muted {
  color: #94a3b8;
  font-weight: 400;
}
.portal-security__value--danger {
  color: #b91c1c;
}

/* Security dialogs */
.secdlg-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.875rem 1rem;
  border: 1px solid var(--bdg-border);
  border-radius: 0.875rem;
  margin-bottom: 1rem;
}
.secdlg-row__title {
  font-weight: 600;
}
.secdlg-row__desc {
  color: #64748b;
  font-size: 0.85rem;
}
.secdlg-pin {
  display: flex;
  gap: 0.5rem;
}
.secdlg-pin .p-inputtext {
  flex: 1;
}
.secdlg-hint {
  color: #94a3b8;
  font-size: 0.8rem;
}
.secdlg-warning {
  display: flex;
  gap: 0.625rem;
  align-items: flex-start;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 0.75rem;
  padding: 0.875rem 1rem;
  color: #92400e;
  font-size: 0.875rem;
  margin: 0 0 1rem;
}
.secdlg-warning .pi {
  color: #b45309;
  margin-top: 0.125rem;
}

/* Activity timeline (mirrors the dashboard panel) */
.activity-list {
  list-style: none;
  margin: 0.875rem 0 0;
  padding: 0;
  position: relative;
}
.activity-item {
  display: flex;
  gap: 0.75rem;
  padding-bottom: 1.125rem;
  position: relative;
}
.activity-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 14px;
  bottom: 0;
  width: 2px;
  background: var(--bdg-border);
}
.activity-dot {
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 4px;
  z-index: 1;
}
.activity-message {
  margin: 0;
  font-size: 0.875rem;
  color: var(--bdg-deep);
  line-height: 1.4;
}
.activity-time {
  font-size: 0.75rem;
  color: #94a3b8;
}
.activity-empty {
  color: #94a3b8;
  font-size: 0.875rem;
  padding: 0.5rem 0;
}

@media (max-width: 1100px) {
  .detail__grid {
    grid-template-columns: 1fr;
  }
}
</style>
