<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import SelectButton from 'primevue/selectbutton'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import Tag from 'primevue/tag'
import BrandLogo from '@/components/brand/BrandLogo.vue'
import { useRequestsStore } from '@/stores/requests'
import { useLibraryStore } from '@/stores/library'
import type { RequestPriority } from '@/types'
import { LINK_EXPIRY_OPTIONS } from '@/types'

interface ChecklistEntry {
  category: string
  title: string
  description: string
  selected: boolean
  custom?: boolean
}

const router = useRouter()
const toast = useToast()
const requestsStore = useRequestsStore()
const library = useLibraryStore()

const STEPS = [
  { label: 'Basics', title: 'General Info' },
  { label: 'Client', title: 'Client Details' },
  { label: 'Checklist', title: 'Document Checklist' },
  { label: 'Review', title: 'Review & Send' },
]
const step = ref(0)
const sending = ref(false)

const basics = reactive({
  name: '',
  description: '',
  due: null as Date | null,
  priority: 'normal' as RequestPriority,
})
const client = reactive({ name: '', company: '', email: '', phone: '' })
/** Per-request portal security: optional PIN and link expiry (0 = never). */
const security = reactive({ pinEnabled: false, pin: '', expiryDays: 0 })
const errors = reactive<{ name?: string; clientName?: string; clientEmail?: string; items?: string; pin?: string }>({})

function generatePin() {
  security.pin = String(Math.floor(100000 + Math.random() * 900000))
}

const expiryLabel = computed(
  () => LINK_EXPIRY_OPTIONS.find((o) => o.value === security.expiryDays)?.label ?? 'Never',
)

// Checklist choices come from the user's document library; custom one-offs can be added on top.
const entries = ref<ChecklistEntry[]>([])

onMounted(async () => {
  await library.load()
  entries.value = [
    ...library.documents.map((doc) => ({
      category: doc.category,
      title: doc.title,
      description: doc.description,
      selected: false,
    })),
    ...entries.value.filter((e) => e.custom),
  ]
})

const customForm = reactive({ open: false, title: '', description: '', category: '', saveToLibrary: false })

const selectedEntries = computed(() => entries.value.filter((e) => e.selected))
const groupedSelected = computed(() => {
  const groups = new Map<string, ChecklistEntry[]>()
  for (const entry of selectedEntries.value) {
    const key = entry.category || 'Other Documents'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(entry)
  }
  return [...groups.entries()].map(([category, items]) => ({ category, items }))
})
const groupedAll = computed(() => {
  const groups = new Map<string, ChecklistEntry[]>()
  for (const entry of entries.value) {
    const key = entry.category || 'Other Documents'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(entry)
  }
  return [...groups.entries()].map(([category, items]) => ({ category, items }))
})

const clientInitials = computed(() => {
  const parts = client.name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('')
})

const dueLabel = computed(() =>
  basics.due
    ? basics.due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'No due date',
)

function validateStep(index: number): boolean {
  if (index === 0) {
    errors.name = basics.name.trim() ? undefined : 'Request name is required.'
    errors.pin = security.pinEnabled && !security.pin.trim() ? 'Set an access code or turn protection off.' : undefined
    return !errors.name && !errors.pin
  }
  if (index === 1) {
    errors.clientName = client.name.trim() ? undefined : 'Full name is required.'
    errors.clientEmail = !client.email.trim()
      ? 'Email address is required.'
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)
        ? 'Enter a valid email address.'
        : undefined
    return !errors.clientName && !errors.clientEmail
  }
  if (index === 2) {
    errors.items = selectedEntries.value.length > 0 ? undefined : 'Select at least one document.'
    return !errors.items
  }
  return true
}

function next() {
  if (!validateStep(step.value)) return
  step.value = Math.min(step.value + 1, STEPS.length - 1)
}

function back() {
  step.value = Math.max(step.value - 1, 0)
}

function goTo(index: number) {
  // Allow jumping back freely; jumping forward re-validates each step in between.
  if (index <= step.value) {
    step.value = index
    return
  }
  for (let i = step.value; i < index; i++) {
    if (!validateStep(i)) {
      step.value = i
      return
    }
  }
  step.value = index
}

async function addCustomDocument() {
  if (!customForm.title.trim()) return
  const entry = {
    category: customForm.category.trim() || 'Additional Documents',
    title: customForm.title.trim(),
    description: customForm.description.trim(),
    selected: true,
    custom: true,
  }
  entries.value.push(entry)
  if (customForm.saveToLibrary) {
    try {
      await library.create({ title: entry.title, description: entry.description, category: customForm.category.trim() })
      toast.add({ severity: 'success', summary: 'Saved to library', detail: `"${entry.title}" is now reusable.`, life: 3000 })
    } catch {
      toast.add({ severity: 'warn', summary: 'Could not save to library', detail: 'The document was still added to this request.', life: 4000 })
    }
  }
  customForm.title = ''
  customForm.description = ''
  customForm.category = ''
  customForm.saveToLibrary = false
  customForm.open = false
  errors.items = undefined
}

/** Per-category bulk selection for the checklist step. */
function groupSelected(group: { items: ChecklistEntry[] }): boolean {
  return group.items.every((i) => i.selected)
}

function toggleGroup(group: { items: ChecklistEntry[] }, value: boolean) {
  for (const item of group.items) item.selected = value
  if (value) errors.items = undefined
}

function removeCustom(entry: ChecklistEntry) {
  entries.value = entries.value.filter((e) => e !== entry)
}

function toLocalDateString(date: Date): string {
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10)
}

async function send() {
  sending.value = true
  try {
    const request = await requestsStore.createRequest({
      name: basics.name.trim(),
      description: basics.description.trim(),
      priority: basics.priority,
      client_name: client.name.trim(),
      client_company: client.company.trim(),
      client_email: client.email.trim(),
      client_phone: client.phone.trim(),
      expected_date: basics.due ? toLocalDateString(basics.due) : null,
      portal_pin: security.pinEnabled ? security.pin.trim() : null,
      expires_at:
        security.expiryDays > 0
          ? new Date(Date.now() + security.expiryDays * 86400000).toISOString()
          : null,
      items: selectedEntries.value.map((e) => ({
        title: e.title,
        description: e.description,
        category: e.category,
      })),
    })
    const link = `${window.location.origin}/portal/${request.portal_token}`
    await navigator.clipboard.writeText(link).catch(() => {})
    let emailNote = ''
    try {
      const result = await requestsStore.sendEmail('request_created', request.id)
      emailNote = ` The client was notified at ${result.to}.`
    } catch {
      emailNote = ' The notification email could not be sent — share the copied link manually.'
    }
    toast.add({
      severity: 'success',
      summary: 'Request sent',
      detail: `The client portal link was copied to your clipboard.${emailNote}`,
      life: 6000,
    })
    router.push({ name: 'dashboard' })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Send failed',
      detail: error instanceof Error ? error.message : 'Please try again.',
      life: 5000,
    })
  } finally {
    sending.value = false
  }
}

function cancel() {
  router.push({ name: 'dashboard' })
}
</script>

<template>
  <div class="wizard">
    <header class="wizard__header bdg-glass">
      <BrandLogo :size="26" />
      <Button label="Cancel" icon="pi pi-times" text severity="secondary" @click="cancel" />
    </header>

    <main class="wizard__main">
      <div class="wizard__intro">
        <h1>Create New Request</h1>
        <p>Gather documents from your clients efficiently.</p>
      </div>

      <nav class="stepper" aria-label="Progress">
        <template v-for="(s, index) in STEPS" :key="s.label">
          <button
            class="stepper__step"
            :class="{
              'stepper__step--active': index === step,
              'stepper__step--done': index < step,
            }"
            type="button"
            @click="goTo(index)"
          >
            <span class="stepper__circle">
              <i v-if="index < step" class="pi pi-check" />
              <template v-else>{{ index + 1 }}</template>
            </span>
            <span class="stepper__label">{{ s.label }}</span>
          </button>
          <span v-if="index < STEPS.length - 1" class="stepper__line" :class="{ 'stepper__line--done': index < step }" />
        </template>
      </nav>

      <!-- Step 1: General Info -->
      <section v-if="step === 0" class="bdg-card wizard__card">
        <div class="bdg-field">
          <label for="wiz-name">Request Name</label>
          <InputText id="wiz-name" v-model="basics.name" placeholder="e.g., Q3 Financial Audit Docs" :invalid="!!errors.name" />
          <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
        </div>
        <div class="bdg-field">
          <label for="wiz-desc">Description <span class="wizard__optional">(Optional)</span></label>
          <Textarea id="wiz-desc" v-model="basics.description" rows="4" auto-resize placeholder="Briefly describe the purpose of this request..." class="w-full" />
        </div>
        <div class="formgrid grid">
          <div class="bdg-field col-12 md:col-6">
            <label for="wiz-due">Due Date</label>
            <DatePicker id="wiz-due" v-model="basics.due" date-format="M d, yy" show-icon icon-display="input" :min-date="new Date()" />
          </div>
          <div class="bdg-field col-12 md:col-6">
            <label>Priority</label>
            <SelectButton
              v-model="basics.priority"
              :options="[
                { label: 'Normal', value: 'normal' },
                { label: 'High', value: 'high' },
              ]"
              option-label="label"
              option-value="value"
              :allow-empty="false"
            />
          </div>
        </div>

        <div class="security-block">
          <span class="bdg-label-sm"><i class="pi pi-lock" /> Portal security</span>
          <div class="security-row">
            <div>
              <div class="security-row__title">Access code</div>
              <div class="security-row__desc">Require a code to open this request's upload portal.</div>
            </div>
            <ToggleSwitch v-model="security.pinEnabled" aria-label="Require access code" />
          </div>
          <div v-if="security.pinEnabled" class="bdg-field security-pin">
            <label for="wiz-pin">Access code for this request</label>
            <div class="security-pin__row">
              <InputText id="wiz-pin" v-model="security.pin" placeholder="e.g. 482913" maxlength="64" :invalid="!!errors.pin" />
              <Button label="Generate" icon="pi pi-sync" outlined severity="secondary" @click="generatePin" />
            </div>
            <small v-if="errors.pin" class="p-error">{{ errors.pin }}</small>
            <small v-else class="wizard__hint">Share this code with your client — only they should know it.</small>
          </div>
          <div class="security-row">
            <div>
              <div class="security-row__title">Link expiry</div>
              <div class="security-row__desc">Automatically disable the portal link after a set duration.</div>
            </div>
            <Select
              v-model="security.expiryDays"
              :options="LINK_EXPIRY_OPTIONS"
              option-label="label"
              option-value="value"
              class="security-expiry"
              aria-label="Link expiry"
            />
          </div>
        </div>
      </section>

      <!-- Step 2: Client Details -->
      <section v-else-if="step === 1" class="bdg-card wizard__card">
        <h2 class="wizard__card-title">Client Details</h2>
        <p class="wizard__card-subtitle">Who is this document request for? We'll use this to personalize their portal.</p>
        <div class="formgrid grid">
          <div class="bdg-field col-12 md:col-6">
            <label for="wiz-client-name">Full Name <span class="wizard__required">*</span></label>
            <InputText id="wiz-client-name" v-model="client.name" placeholder="e.g. Jane Doe" :invalid="!!errors.clientName" />
            <small v-if="errors.clientName" class="p-error">{{ errors.clientName }}</small>
          </div>
          <div class="bdg-field col-12 md:col-6">
            <label for="wiz-client-company">Company Name <span class="wizard__optional">(Optional)</span></label>
            <InputText id="wiz-client-company" v-model="client.company" placeholder="e.g. Acme Corp" />
          </div>
        </div>
        <div class="bdg-field">
          <label for="wiz-client-email">Email Address <span class="wizard__required">*</span></label>
          <InputText id="wiz-client-email" v-model="client.email" type="email" placeholder="jane.doe@example.com" :invalid="!!errors.clientEmail" />
          <small v-if="errors.clientEmail" class="p-error">{{ errors.clientEmail }}</small>
          <small v-else class="wizard__hint">We'll send the secure upload link to this address.</small>
        </div>
        <div class="bdg-field">
          <label for="wiz-client-phone">Phone Number <span class="wizard__optional">(Optional)</span></label>
          <InputText id="wiz-client-phone" v-model="client.phone" placeholder="+1 (555) 000-0000" />
        </div>
      </section>

      <!-- Step 3: Document Checklist -->
      <section v-else-if="step === 2" class="wizard__checklist">
        <h2 class="wizard__card-title">Document Checklist</h2>
        <p class="wizard__card-subtitle">
          Pick documents from your library — tick a category to add all of its documents at once — or add custom requests.
        </p>
        <small v-if="errors.items" class="p-error block mb-3">{{ errors.items }}</small>

        <div v-if="!library.loading && library.documents.length === 0" class="bdg-card checklist-empty">
          <i class="pi pi-book" />
          <p>
            Your <router-link :to="{ name: 'library' }">document library</router-link> is empty. Documents you save
            there appear here for every new request — or add custom documents below.
          </p>
        </div>

        <div v-for="group in groupedAll" :key="group.category" class="checklist-group">
          <div class="checklist-group__header">
            <label class="checklist-group__select">
              <Checkbox :model-value="groupSelected(group)" binary @update:model-value="toggleGroup(group, $event)" />
              <h3>{{ group.category }}</h3>
            </label>
            <Tag :value="`${group.items.filter((i) => i.selected).length} Required`" severity="secondary" />
          </div>
          <label v-for="entry in group.items" :key="entry.title" class="bdg-card checklist-item" :class="{ 'checklist-item--off': !entry.selected }">
            <Checkbox v-model="entry.selected" binary />
            <span class="checklist-item__text">
              <span class="checklist-item__title">{{ entry.title }}</span>
              <span class="checklist-item__desc">{{ entry.description }}</span>
            </span>
            <Button
              v-if="entry.custom"
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              v-tooltip.left="'Remove custom document'"
              @click.prevent="removeCustom(entry)"
            />
          </label>
        </div>

        <div v-if="!customForm.open" class="checklist-add" role="button" tabindex="0" @click="customForm.open = true" @keydown.enter="customForm.open = true">
          <i class="pi pi-plus" /> Add Custom Document
        </div>
        <div v-else class="bdg-card checklist-custom">
          <div class="formgrid grid">
            <div class="bdg-field col-12 md:col-6">
              <label for="wiz-custom-title">Document title</label>
              <InputText id="wiz-custom-title" v-model="customForm.title" placeholder="e.g. Articles of Incorporation" />
            </div>
            <div class="bdg-field col-12 md:col-6">
              <label for="wiz-custom-cat">Category</label>
              <InputText id="wiz-custom-cat" v-model="customForm.category" placeholder="e.g. Identity & Compliance" />
            </div>
          </div>
          <div class="bdg-field">
            <label for="wiz-custom-desc">Instructions for the client</label>
            <Textarea id="wiz-custom-desc" v-model="customForm.description" rows="1" auto-resize class="w-full" />
          </div>
          <label class="checklist-save-lib">
            <Checkbox v-model="customForm.saveToLibrary" binary />
            <span>Also save to my document library for future requests</span>
          </label>
          <div class="flex gap-2 justify-content-end">
            <Button label="Cancel" text severity="secondary" size="small" @click="customForm.open = false" />
            <Button label="Add Document" icon="pi pi-plus" size="small" :disabled="!customForm.title.trim()" @click="addCustomDocument" />
          </div>
        </div>
      </section>

      <!-- Step 4: Review -->
      <section v-else class="wizard__review">
        <div class="wizard__review-side">
          <div class="bdg-card review-card">
            <div class="review-card__header">
              <span class="review-card__heading"><i class="pi pi-file" /> Request Basics</span>
              <Button icon="pi pi-pencil" text rounded size="small" v-tooltip.top="'Edit basics'" @click="goTo(0)" />
            </div>
            <span class="bdg-label-sm">Request name</span>
            <p class="review-card__value">{{ basics.name }}</p>
            <template v-if="basics.description">
              <span class="bdg-label-sm">Description</span>
              <p class="review-card__value review-card__value--muted">{{ basics.description }}</p>
            </template>
            <div class="review-card__row">
              <div>
                <span class="bdg-label-sm">Priority</span>
                <div class="mt-1">
                  <Tag :value="basics.priority === 'high' ? 'High' : 'Normal'" :severity="basics.priority === 'high' ? 'danger' : 'secondary'" :icon="basics.priority === 'high' ? 'pi pi-flag' : undefined" />
                </div>
              </div>
              <div>
                <span class="bdg-label-sm">Due date</span>
                <p class="review-card__value mt-1"><i class="pi pi-calendar mr-1" style="color: #94a3b8" />{{ dueLabel }}</p>
              </div>
            </div>
            <div class="review-card__row">
              <div>
                <span class="bdg-label-sm">Access code</span>
                <p class="review-card__value mt-1">
                  <i class="pi pi-lock mr-1" style="color: #94a3b8" />{{ security.pinEnabled ? security.pin : 'None' }}
                </p>
              </div>
              <div>
                <span class="bdg-label-sm">Link expiry</span>
                <p class="review-card__value mt-1"><i class="pi pi-clock mr-1" style="color: #94a3b8" />{{ expiryLabel }}</p>
              </div>
            </div>
          </div>

          <div class="bdg-card review-card">
            <div class="review-card__header">
              <span class="review-card__heading"><i class="pi pi-user" /> Client Details</span>
              <Button icon="pi pi-pencil" text rounded size="small" v-tooltip.top="'Edit client'" @click="goTo(1)" />
            </div>
            <div class="review-card__client">
              <Avatar :label="clientInitials" shape="circle" style="background: #e0e7ff; color: #3b82f6; font-weight: 600" />
              <div>
                <p class="review-card__value mb-0">{{ client.name }}</p>
                <span class="review-card__muted">{{ client.email }}</span>
              </div>
            </div>
            <template v-if="client.company">
              <span class="bdg-label-sm">Company</span>
              <p class="review-card__value"><i class="pi pi-building mr-1" style="color: #94a3b8" />{{ client.company }}</p>
            </template>
            <template v-if="client.phone">
              <span class="bdg-label-sm">Phone</span>
              <p class="review-card__value"><i class="pi pi-phone mr-1" style="color: #94a3b8" />{{ client.phone }}</p>
            </template>
          </div>
        </div>

        <div class="bdg-card review-checklist">
          <div class="review-card__header">
            <div>
              <span class="review-card__heading"><i class="pi pi-check-square" /> Document Checklist</span>
              <p class="review-card__muted mt-1 mb-0">
                {{ selectedEntries.length }} document{{ selectedEntries.length === 1 ? '' : 's' }} requested across
                {{ groupedSelected.length }} categor{{ groupedSelected.length === 1 ? 'y' : 'ies' }}
              </p>
            </div>
            <Button label="Edit" icon="pi pi-pencil" outlined size="small" @click="goTo(2)" />
          </div>
          <div v-for="group in groupedSelected" :key="group.category" class="review-group">
            <div class="review-group__header">
              <i class="pi pi-folder" /> {{ group.category }}
            </div>
            <div v-for="entry in group.items" :key="entry.title" class="review-group__item">
              <i class="pi pi-file" />
              <div>
                <p class="review-card__value mb-0">{{ entry.title }}</p>
                <span class="review-card__muted">{{ entry.description }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer class="wizard__footer">
        <Button
          v-if="step > 0"
          :label="`Back to ${STEPS[step - 1]!.label}`"
          icon="pi pi-arrow-left"
          outlined
          severity="secondary"
          @click="back"
        />
        <span v-else />
        <Button
          v-if="step < 3"
          :label="`Continue to ${STEPS[step + 1]!.label}`"
          icon="pi pi-arrow-right"
          icon-pos="right"
          @click="next"
        />
        <Button v-else label="Send Request" icon="pi pi-send" icon-pos="right" :loading="sending" @click="send" />
      </footer>
    </main>
  </div>
</template>

<style scoped>
.wizard {
  min-height: 100vh;
  background: var(--bdg-canvas);
  display: flex;
  flex-direction: column;
}
.wizard__header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 1.5rem;
}
.wizard__main {
  width: 100%;
  max-width: 60rem;
  margin: 0 auto;
  padding: 2rem 1.25rem 3rem;
  flex: 1;
}
.wizard__intro {
  text-align: center;
  margin-bottom: 1.75rem;
}
.wizard__intro h1 {
  margin: 0 0 0.375rem;
  font-size: 2rem;
}
.wizard__intro p {
  margin: 0;
  color: #64748b;
}

/* Stepper */
.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
}
.stepper__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
}
.stepper__circle {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
  color: #64748b;
  font-weight: 600;
  transition: all 0.2s ease;
}
.stepper__label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #94a3b8;
}
.stepper__step--active .stepper__circle {
  background: var(--bdg-blue);
  color: #fff;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}
.stepper__step--active .stepper__label {
  color: var(--bdg-blue);
}
.stepper__step--done .stepper__circle {
  background: var(--bdg-blue);
  color: #fff;
}
.stepper__step--done .stepper__label {
  color: var(--bdg-deep);
}
.stepper__line {
  width: clamp(2rem, 8vw, 7rem);
  height: 2px;
  background: #e2e8f0;
  margin-bottom: 1.25rem;
}
.stepper__line--done {
  background: var(--bdg-blue);
}

.wizard__card {
  padding: 2rem;
}
.security-block {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--bdg-border);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.security-block > .bdg-label-sm .pi {
  margin-right: 0.35rem;
}
.security-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.875rem 1rem;
  border: 1px solid var(--bdg-border);
  border-radius: 0.875rem;
}
.security-row__title {
  font-weight: 600;
}
.security-row__desc {
  color: #64748b;
  font-size: 0.85rem;
  margin-top: 0.125rem;
}
.security-pin {
  margin: 0;
  padding: 0 0.25rem;
}
.security-pin__row {
  display: flex;
  gap: 0.5rem;
}
.security-pin__row .p-inputtext {
  flex: 1;
}
.security-expiry {
  min-width: 8rem;
}
.wizard__card-title {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
}
.wizard__card-subtitle {
  margin: 0 0 1.5rem;
  color: #64748b;
}
.wizard__optional {
  color: #94a3b8;
  font-weight: 400;
  font-size: 0.8rem;
}
.wizard__required {
  color: #ba1a1a;
}
.wizard__hint {
  color: #64748b;
  font-size: 0.8rem;
}

/* Checklist step */
.checklist-group {
  margin-bottom: 1.5rem;
}
.checklist-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--bdg-border);
  margin-bottom: 0.75rem;
}
.checklist-group__header h3 {
  margin: 0;
  font-size: 1.15rem;
}
.checklist-group__select {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  cursor: pointer;
}
.checklist-empty {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
  color: #64748b;
}
.checklist-empty .pi {
  font-size: 1.25rem;
  color: #94a3b8;
}
.checklist-empty p {
  margin: 0;
  font-size: 0.9rem;
}
.checklist-empty a {
  color: var(--bdg-blue);
  font-weight: 600;
}
.checklist-save-lib {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  cursor: pointer;
  margin-bottom: 0.875rem;
  font-size: 0.875rem;
  color: #475569;
}
.checklist-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.25rem;
  margin-bottom: 0.625rem;
  cursor: pointer;
  border-radius: 0.875rem;
}
.checklist-item--off {
  opacity: 0.55;
}
.checklist-item__text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
}
.checklist-item__title {
  font-weight: 600;
}
.checklist-item__desc {
  font-size: 0.85rem;
  color: #64748b;
}
.checklist-add {
  border: 2px dashed #cbd5e1;
  border-radius: 0.875rem;
  padding: 1rem;
  text-align: center;
  color: var(--bdg-blue);
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.checklist-add:hover {
  border-color: var(--bdg-blue);
  background: #eff6ff;
}
.checklist-custom {
  padding: 1.25rem;
}

/* Review step */
.wizard__review {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr);
  gap: 1.25rem;
  align-items: start;
}
.wizard__review-side {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.review-card,
.review-checklist {
  padding: 1.5rem;
}
.review-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid var(--bdg-border);
  margin-bottom: 1rem;
}
.review-card__heading {
  font-weight: 600;
  font-size: 1.05rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.review-card__heading .pi {
  color: var(--bdg-blue);
}
.review-card__value {
  margin: 0.125rem 0 0.875rem;
  font-weight: 500;
}
.review-card__value--muted {
  font-weight: 400;
  color: #475569;
}
.review-card__muted {
  color: #64748b;
  font-size: 0.85rem;
}
.review-card__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.review-card__client {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.review-group {
  border: 1px solid var(--bdg-border);
  border-radius: 0.875rem;
  overflow: hidden;
  margin-bottom: 0.875rem;
}
.review-group__header {
  background: #f1f5f9;
  padding: 0.75rem 1.125rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.review-group__header .pi {
  color: #64748b;
}
.review-group__item {
  display: flex;
  gap: 0.75rem;
  padding: 0.875rem 1.125rem;
  align-items: flex-start;
}
.review-group__item + .review-group__item {
  border-top: 1px solid #f1f5f9;
}
.review-group__item .pi {
  color: #94a3b8;
  margin-top: 0.2rem;
}

.wizard__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--bdg-border);
}

@media (max-width: 860px) {
  .wizard__review {
    grid-template-columns: 1fr;
  }
  .stepper__line {
    width: 1.25rem;
  }
}
</style>
