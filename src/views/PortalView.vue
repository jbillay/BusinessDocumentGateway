<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import BrandLogo from '@/components/brand/BrandLogo.vue'
import { brandingUrl, FILES_BUCKET, supabase } from '@/lib/supabase'
import type { PortalBranding, PortalGate, PortalItem, PortalRequest } from '@/types'
import { formatBytes, itemReceived } from '@/types'

const route = useRoute()
const toast = useToast()

const token = route.params.token as string
const request = ref<PortalRequest | null>(null)
const branding = ref<PortalBranding | null>(null)
/** Free-plan owners advertise us on their portals (the growth loop). */
const showBadge = ref(false)
const badgeUrl = `${window.location.origin}/pricing?utm_source=portal_badge&utm_medium=referral`
const loading = ref(true)
const notFound = ref(false)
const expired = ref(false)
/** Who to contact for a fresh link, provided with the expired payload. */
const expiredContact = ref<{ name: string; email: string; company: string } | null>(null)
const pinRequired = ref(false)
const wrongPin = ref(false)
const pinInput = ref('')
const unlocking = ref(false)
/** PIN that unlocked the portal; re-sent on every reload of the payload. */
const enteredPin = ref<string | null>(null)
const submitted = ref(false)
const uploadingItemId = ref<string | null>(null)
const submitting = ref(false)
const dragActive = ref(false)

const fileInput = ref<HTMLInputElement | null>(null)
const pendingItemForPicker = ref<PortalItem | null>(null)

const ACCEPTED = '.pdf,.docx,.jpg,.jpeg,.png'
const MAX_SIZE = 50 * 1024 * 1024

const items = computed(() => request.value?.items ?? [])
const uploadedCount = computed(() => items.value.filter((i) => itemReceived(i.status)).length)
const pendingCount = computed(() => items.value.length - uploadedCount.value)
const progressPct = computed(() =>
  items.value.length === 0 ? 0 : Math.round((uploadedCount.value / items.value.length) * 100),
)
const inReview = computed(() => request.value?.status === 'in_review')
const rejectedCount = computed(() => items.value.filter((i) => i.status === 'rejected').length)
/** Submitting needs at least one freshly uploaded (not yet reviewed) document. */
const canSubmit = computed(() => items.value.some((i) => i.status === 'uploaded'))

/** Days until the expected date, colour-coded blue → orange → red. */
const dueBadge = computed(() => {
  const date = request.value?.expected_date
  if (!date || request.value?.status === 'completed') return null
  const days = Math.ceil((new Date(date + 'T23:59:59').getTime() - Date.now()) / 86400000)
  const tone = days > 7 ? 'blue' : days >= 3 ? 'orange' : 'red'
  const label =
    days < 0
      ? `Overdue by ${-days} day${days === -1 ? '' : 's'}`
      : days === 0
        ? 'Due today'
        : `${days} day${days === 1 ? '' : 's'} left`
  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  return { label, tone, dateLabel }
})

async function load() {
  loading.value = true
  try {
    const { data, error } = await supabase.rpc('get_portal_request', {
      p_token: token,
      p_pin: enteredPin.value,
    })
    if (error) throw error
    if (!data) {
      notFound.value = true
      return
    }
    const payload = data as Partial<PortalRequest> & PortalGate
    branding.value = payload.branding ?? null
    showBadge.value = payload.show_badge ?? false
    if (payload.link_expired) {
      expired.value = true
      expiredContact.value = {
        name: payload.owner_name ?? '',
        email: payload.owner_email ?? '',
        company: payload.company ?? '',
      }
      return
    }
    if (payload.pin_required) {
      pinRequired.value = true
      wrongPin.value = !!payload.wrong_pin
      return
    }
    pinRequired.value = false
    request.value = payload as PortalRequest
    if (request.value.status === 'completed') submitted.value = true
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function unlock() {
  const pin = pinInput.value.trim()
  if (!pin) return
  unlocking.value = true
  enteredPin.value = pin
  try {
    await load()
  } finally {
    unlocking.value = false
  }
}

function emailRequestor() {
  if (!expiredContact.value?.email) return
  window.location.href = `mailto:${expiredContact.value.email}?subject=${encodeURIComponent('New upload link needed')}`
}

const logoUrl = computed(() => brandingUrl(branding.value?.logo_path))
/** Branding colors cascade into the existing CSS through the bdg custom properties. */
const brandStyle = computed(() =>
  branding.value
    ? { '--bdg-deep': branding.value.primary_color, '--bdg-blue': branding.value.accent_color }
    : {},
)
const submitStyle = computed(() =>
  branding.value
    ? { background: branding.value.primary_color, borderColor: branding.value.primary_color }
    : {},
)

function pickFilesFor(item: PortalItem) {
  pendingItemForPicker.value = item
  fileInput.value?.click()
}

async function onFilesPicked(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  const item = pendingItemForPicker.value
  if (!item || files.length === 0) return
  await uploadFiles(item, files)
}

async function onDrop(event: DragEvent) {
  dragActive.value = false
  const files = Array.from(event.dataTransfer?.files ?? [])
  if (files.length === 0) return
  const target = items.value.find((i) => i.status === 'pending' || i.status === 'rejected')
  if (!target) {
    toast.add({ severity: 'info', summary: 'All documents uploaded', detail: 'There are no pending documents.', life: 4000 })
    return
  }
  await uploadFiles(target, files)
}

async function uploadFiles(item: PortalItem, files: File[]) {
  const oversized = files.find((f) => f.size > MAX_SIZE)
  if (oversized) {
    toast.add({ severity: 'error', summary: 'File too large', detail: `${oversized.name} exceeds the 50 MB limit.`, life: 5000 })
    return
  }
  uploadingItemId.value = item.id
  try {
    if (item.status === 'rejected') {
      // A new upload replaces the rejected files.
      const { error: clearError } = await supabase.rpc('portal_clear_item', { p_token: token, p_item_id: item.id })
      if (clearError) throw clearError
    }
    for (const file of files) {
      const safeName = file.name.replace(/[^\w.\- ]+/g, '_')
      const path = `portal/${token}/${item.id}/${Date.now()}_${safeName}`
      const { error: storageError } = await supabase.storage.from(FILES_BUCKET).upload(path, file)
      if (storageError) throw storageError
      const { error: rpcError } = await supabase.rpc('portal_add_file', {
        p_token: token,
        p_item_id: item.id,
        p_file_name: file.name,
        p_file_size: file.size,
        p_storage_path: path,
      })
      if (rpcError) throw rpcError
    }
    await load()
    toast.add({ severity: 'success', summary: 'Uploaded', detail: `${files.length} file${files.length > 1 ? 's' : ''} added to "${item.title}".`, life: 4000 })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Upload failed',
      detail: error instanceof Error ? error.message : 'Please try again.',
      life: 6000,
    })
  } finally {
    uploadingItemId.value = null
  }
}

async function removeItemFiles(item: PortalItem) {
  try {
    const { error } = await supabase.rpc('portal_clear_item', { p_token: token, p_item_id: item.id })
    if (error) throw error
    await load()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Remove failed', detail: error instanceof Error ? error.message : undefined, life: 5000 })
  }
}

async function submit() {
  submitting.value = true
  try {
    const { error } = await supabase.rpc('portal_submit', { p_token: token })
    if (error) throw error
    await load()
    toast.add({ severity: 'success', summary: 'Documents submitted', detail: 'Thank you! Your documents are now being reviewed.', life: 5000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Submit failed', detail: error instanceof Error ? error.message : undefined, life: 5000 })
  } finally {
    submitting.value = false
  }
}

function itemFileIcon(name: string): string {
  return /\.(jpe?g|png)$/i.test(name) ? 'pi pi-image' : 'pi pi-file'
}

function itemTag(item: PortalItem): { label: string; severity: 'secondary' | 'info' | 'success' | 'danger' } {
  switch (item.status) {
    case 'uploaded':
      return inReview.value ? { label: 'Under review', severity: 'info' } : { label: 'Uploaded', severity: 'info' }
    case 'approved':
      return { label: 'Approved', severity: 'success' }
    case 'rejected':
      return { label: 'Rejected', severity: 'danger' }
    default:
      return { label: 'Pending', severity: 'secondary' }
  }
}
</script>

<template>
  <div class="portal" :style="brandStyle">
    <header class="portal__header bdg-glass">
      <img v-if="logoUrl" :src="logoUrl" class="portal__logo" alt="Company logo" />
      <BrandLogo v-else :size="26" />
      <span class="portal__badge">
        Secure Upload Portal
        <i class="pi pi-lock" />
      </span>
    </header>

    <main class="portal__main">
      <div v-if="loading" class="portal__center">
        <i class="pi pi-spinner pi-spin" style="font-size: 2rem; color: var(--bdg-blue)" />
      </div>

      <div v-else-if="notFound" class="portal__center bdg-card portal__message-card">
        <i class="pi pi-exclamation-circle" style="font-size: 2.5rem; color: #ba1a1a" />
        <h2>Link not found</h2>
        <p>This upload link is invalid or has been removed. Please contact the person who sent it to you.</p>
      </div>

      <div v-else-if="expired" class="portal__center bdg-card portal__message-card">
        <i class="pi pi-clock" style="font-size: 2.5rem; color: #b45309" />
        <h2>This link has expired</h2>
        <p>
          For your security, upload links are only valid for a limited time.
          Please contact
          <strong>{{ expiredContact?.name || expiredContact?.company || 'the person who sent you this link' }}</strong>
          <template v-if="expiredContact?.company && expiredContact?.name"> at {{ expiredContact.company }}</template>
          to request a new secure link.
        </p>
        <Button
          v-if="expiredContact?.email"
          :label="`Email ${expiredContact.name || expiredContact.email}`"
          icon="pi pi-envelope"
          outlined
          @click="emailRequestor"
        />
      </div>

      <div v-else-if="pinRequired" class="portal__center bdg-card portal__message-card">
        <i class="pi pi-lock" style="font-size: 2.5rem; color: var(--bdg-blue)" />
        <h2>This portal is protected</h2>
        <p>Enter the access code you received to view and upload your documents.</p>
        <form class="portal__pin-form" @submit.prevent="unlock">
          <InputText
            v-model="pinInput"
            type="password"
            placeholder="Access code"
            autofocus
            :invalid="wrongPin"
            autocomplete="off"
          />
          <Button type="submit" label="Continue" :loading="unlocking" :disabled="!pinInput.trim()" />
        </form>
        <small v-if="wrongPin" class="portal__pin-error">Incorrect code. Please try again.</small>
      </div>

      <template v-else-if="request">
        <div class="portal__welcome">
          <h1>{{ branding?.headline || 'Secure Document Upload' }}</h1>
          <p v-if="branding?.welcome_message" class="portal__welcome-message">{{ branding.welcome_message }}</p>
          <p>
            <span v-if="request.client_name">Welcome, <span class="portal__name">{{ request.client_name.split(' ')[0] }}</span>. </span>
            <strong>{{ request.company || request.owner_name || 'BDG' }}</strong> is requesting documents for your
            <strong>{{ request.name }}</strong>.
          </p>
          <div v-if="dueBadge" class="portal__due" :class="`portal__due--${dueBadge.tone}`">
            <i class="pi pi-clock" />
            <strong>{{ dueBadge.label }}</strong>
            <span class="portal__due-date">· due {{ dueBadge.dateLabel }}</span>
          </div>
        </div>

        <div v-if="submitted" class="bdg-card portal__message-card portal__center">
          <i class="pi pi-check-circle" style="font-size: 2.5rem; color: #059669" />
          <h2>All done!</h2>
          <p>Your documents have been submitted securely. You can close this page.</p>
          <Button label="Review my uploads" text @click="submitted = false" />
        </div>

        <template v-else>
          <div v-if="inReview" class="bdg-card portal__review">
            <i class="pi pi-eye" />
            <div>
              <h3>Your documents are being reviewed</h3>
              <p>
                Nothing more to do for now — you'll be notified if any document needs to be uploaded again.
                Documents cannot be changed while the review is in progress.
              </p>
            </div>
          </div>

          <div v-else-if="rejectedCount > 0" class="bdg-card portal__rejected-note">
            <i class="pi pi-exclamation-triangle" />
            <div>
              <h3>{{ rejectedCount }} document{{ rejectedCount === 1 ? ' was' : 's were' }} rejected</h3>
              <p>
                Please upload a new version of each rejected document below, then submit again.
                Approved documents are locked and don't need to be resent.
              </p>
            </div>
          </div>

          <div class="portal__progress">
            <span class="bdg-label-sm">Upload progress</span>
            <span class="portal__progress-count"><strong>{{ uploadedCount }}</strong> / {{ items.length }}</span>
          </div>
          <ProgressBar :value="progressPct" :show-value="false" style="height: 8px" class="mb-4" />

          <div
            v-if="!inReview"
            class="portal__dropzone"
            :class="{ 'portal__dropzone--active': dragActive }"
            @dragover.prevent="dragActive = true"
            @dragleave.prevent="dragActive = false"
            @drop.prevent="onDrop"
          >
            <span class="portal__dropzone-icon"><i class="pi pi-cloud-upload" /></span>
            <h3>Drag &amp; drop files here</h3>
            <p>They will be attached to your next pending document below.</p>
            <span class="bdg-label-sm">Supports PDF, DOCX, JPG, PNG (max 50MB)</span>
          </div>

          <section class="bdg-card portal__list">
            <div class="portal__list-header">
              <h2>Required Documents</h2>
              <Tag v-if="pendingCount > 0" :value="`${pendingCount} Pending`" severity="secondary" />
              <Tag v-else value="All uploaded" severity="success" />
            </div>

            <div
              v-for="(item, index) in items"
              :key="item.id"
              class="portal__item"
              :class="{ 'portal__item--rejected': item.status === 'rejected' && !inReview }"
            >
              <span
                class="portal__item-status"
                :class="{
                  'portal__item-status--done': itemReceived(item.status),
                  'portal__item-status--rejected': item.status === 'rejected',
                }"
              >
                <i v-if="itemReceived(item.status)" class="pi pi-check" />
                <i v-else-if="item.status === 'rejected'" class="pi pi-times" />
                <template v-else>{{ index + 1 }}</template>
              </span>
              <div class="portal__item-body">
                <div class="portal__item-title">
                  {{ item.title }}
                  <Tag :value="itemTag(item).label" :severity="itemTag(item).severity" class="portal__item-tag" />
                </div>
                <p v-if="item.description" class="portal__item-desc">{{ item.description }}</p>
                <p v-if="item.status === 'rejected' && !inReview" class="portal__item-rejected-hint">
                  Please upload a new version of this document.
                </p>
                <ul v-if="item.files.length" class="portal__files">
                  <li v-for="file in item.files" :key="file.id">
                    <i :class="itemFileIcon(file.file_name)" />
                    {{ file.file_name }} ({{ formatBytes(file.file_size) }})
                  </li>
                </ul>
              </div>
              <div v-if="!inReview" class="portal__item-action">
                <Button
                  v-if="item.status === 'pending' || item.status === 'rejected'"
                  :label="item.status === 'rejected' ? 'Upload new' : 'Upload'"
                  icon="pi pi-upload"
                  outlined
                  :severity="item.status === 'rejected' ? 'danger' : undefined"
                  :loading="uploadingItemId === item.id"
                  @click="pickFilesFor(item)"
                />
                <Button
                  v-else-if="item.status === 'uploaded'"
                  label="Remove"
                  icon="pi pi-trash"
                  text
                  severity="secondary"
                  @click="removeItemFiles(item)"
                />
                <span v-else class="portal__item-locked"><i class="pi pi-lock" /> Approved</span>
              </div>
            </div>
          </section>

          <section v-if="!inReview" class="bdg-card portal__submit">
            <div>
              <h3>Ready to submit?</h3>
              <p v-if="!canSubmit">Upload at least one document to enable submission.</p>
              <p v-else-if="pendingCount > 0">You have {{ pendingCount }} document{{ pendingCount > 1 ? 's' : '' }} pending, but you can submit what you have now.</p>
              <p v-else>Everything is uploaded — send it over for review!</p>
            </div>
            <Button
              label="Submit Documents"
              icon="pi pi-send"
              icon-pos="right"
              severity="contrast"
              :loading="submitting"
              :disabled="!canSubmit"
              :style="submitStyle"
              @click="submit"
            />
          </section>
        </template>
      </template>
    </main>

    <footer v-if="showBadge && !loading" class="portal__powered">
      <a :href="badgeUrl" target="_blank" rel="noopener">
        <i class="pi pi-bolt" /> Powered by <strong>Business Document Gateway</strong> — collect documents from your
        clients
      </a>
    </footer>

    <input ref="fileInput" type="file" multiple :accept="ACCEPTED" class="hidden" @change="onFilesPicked" />
  </div>
</template>

<style scoped>
.portal {
  min-height: 100vh;
  background: #faf7f8;
  display: flex;
  flex-direction: column;
}
.portal__powered {
  text-align: center;
  padding: 1rem 1.5rem 1.5rem;
  margin-top: auto;
}
.portal__powered a {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #94a3b8;
  font-size: 0.8rem;
  text-decoration: none;
  flex-wrap: wrap;
  justify-content: center;
}
.portal__powered a:hover {
  color: #64748b;
}
.portal__powered strong {
  color: #64748b;
  font-weight: 600;
}
.portal__powered .pi {
  font-size: 0.75rem;
}
.portal__header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.5rem;
}
.portal__logo {
  max-height: 2rem;
  max-width: 45%;
  object-fit: contain;
}
.portal__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #475569;
  font-size: 0.9rem;
}
.portal__pin-form {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}
.portal__pin-error {
  color: #ba1a1a;
  margin-top: 0.5rem;
}
.portal__main {
  max-width: 46rem;
  margin: 0 auto;
  padding: 2.5rem 1.25rem 4rem;
}
.portal__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
  padding: 3rem 1.5rem;
}
.portal__message-card p {
  color: #64748b;
  max-width: 26rem;
}
.portal__welcome {
  text-align: center;
  margin-bottom: 2rem;
}
.portal__welcome h1 {
  font-size: 2.25rem;
  margin: 0 0 0.75rem;
}
.portal__name {
  color: var(--bdg-blue);
}
.portal__welcome p {
  color: #475569;
  max-width: 34rem;
  margin: 0 auto;
  line-height: 1.6;
}
.portal__welcome .portal__welcome-message {
  margin-bottom: 0.75rem;
}
.portal__due {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.5rem 1.125rem;
  border-radius: 999px;
  font-size: 1rem;
  border: 1px solid transparent;
}
.portal__due strong {
  font-size: 1.05rem;
}
.portal__due-date {
  opacity: 0.8;
}
.portal__due--blue {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}
.portal__due--orange {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #c2410c;
}
.portal__due--red {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}
.portal__review,
.portal__rejected-note {
  display: flex;
  gap: 0.875rem;
  align-items: flex-start;
  padding: 1.125rem 1.25rem;
  margin-bottom: 1.5rem;
}
.portal__review {
  border: 1px solid #bfdbfe;
  background: #eff6ff;
}
.portal__review .pi {
  color: #1d4ed8;
  font-size: 1.25rem;
  margin-top: 0.2rem;
}
.portal__review h3,
.portal__rejected-note h3 {
  margin: 0 0 0.25rem;
  font-size: 1.05rem;
}
.portal__review p,
.portal__rejected-note p {
  margin: 0;
  color: #1e40af;
  font-size: 0.875rem;
}
.portal__rejected-note {
  border: 1px solid #fecaca;
  background: #fef2f2;
}
.portal__rejected-note .pi {
  color: #b91c1c;
  font-size: 1.25rem;
  margin-top: 0.2rem;
}
.portal__rejected-note p {
  color: #991b1b;
}
.portal__progress {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.portal__progress-count {
  color: #94a3b8;
}
.portal__progress-count strong {
  color: var(--bdg-deep);
  font-size: 1.375rem;
}
.portal__dropzone {
  border-radius: 1.25rem;
  background: #f1f3f5;
  border: 2px dashed transparent;
  text-align: center;
  padding: 2.5rem 1.5rem;
  margin-bottom: 1.5rem;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.portal__dropzone--active {
  border-color: var(--bdg-blue);
  background: #eff6ff;
}
.portal__dropzone-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: #e0e7ff;
  color: var(--bdg-blue);
  font-size: 1.4rem;
  margin-bottom: 0.75rem;
}
.portal__dropzone h3 {
  margin: 0 0 0.375rem;
  font-size: 1.25rem;
}
.portal__dropzone p {
  margin: 0 0 0.875rem;
  color: #64748b;
  font-size: 0.9rem;
}
.portal__list {
  padding: 0;
  overflow: hidden;
  margin-bottom: 1.5rem;
}
.portal__list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--bdg-border);
}
.portal__list-header h2 {
  margin: 0;
  font-size: 1.25rem;
}
.portal__item {
  display: flex;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  align-items: flex-start;
}
.portal__item + .portal__item {
  border-top: 1px solid #f1f5f9;
}
.portal__item-status {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--bdg-border);
  color: #94a3b8;
  font-size: 0.875rem;
  margin-top: 0.125rem;
}
.portal__item-status--done {
  background: #cffafe;
  border-color: transparent;
  color: #0891b2;
}
.portal__item-status--rejected {
  background: #fee2e2;
  border-color: transparent;
  color: #b91c1c;
}
.portal__item--rejected {
  background: #fef2f2;
}
.portal__item-rejected-hint {
  margin: 0.25rem 0 0;
  color: #b91c1c;
  font-size: 0.85rem;
  font-weight: 500;
}
.portal__item-locked {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: #047857;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  margin-top: 0.5rem;
}
.portal__item-body {
  flex: 1;
  min-width: 0;
}
.portal__item-title {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
}
.portal__item-tag {
  font-size: 0.7rem;
}
.portal__item-desc {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.875rem;
}
.portal__files {
  list-style: none;
  margin: 0.625rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.portal__files li {
  font-size: 0.8rem;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.portal__submit {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1.5rem;
}
.portal__submit h3 {
  margin: 0 0 0.25rem;
}
.portal__submit p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}
.hidden {
  display: none;
}
@media (max-width: 560px) {
  .portal__welcome h1 {
    font-size: 1.6rem;
  }
  .portal__item {
    flex-wrap: wrap;
  }
  .portal__item-action {
    width: 100%;
  }
}
</style>
