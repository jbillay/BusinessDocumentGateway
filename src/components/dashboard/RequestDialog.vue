<script setup lang="ts">
import { reactive, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import type { DocumentRequest, RequestItemDraft, RequestPriority, RequestStatus } from '@/types'
import { STATUS_LABELS } from '@/types'
import type { RequestInput } from '@/stores/requests'

const props = defineProps<{
  visible: boolean
  /** When set, the dialog edits this request; otherwise it creates a new one. */
  request?: DocumentRequest | null
  saving?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [input: RequestInput]
}>()

const form = reactive<{
  name: string
  description: string
  priority: RequestPriority
  client_name: string
  client_company: string
  client_email: string
  client_phone: string
  expected_date: Date | null
  status: RequestStatus
  items: RequestItemDraft[]
}>({
  name: '',
  description: '',
  priority: 'normal',
  client_name: '',
  client_company: '',
  client_email: '',
  client_phone: '',
  expected_date: null,
  status: 'pending',
  items: [],
})
const errors = reactive<{ name?: string; client_email?: string }>({})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    errors.name = undefined
    errors.client_email = undefined
    if (props.request) {
      form.name = props.request.name
      form.description = props.request.description
      form.priority = props.request.priority
      form.client_name = props.request.client_name
      form.client_company = props.request.client_company
      form.client_email = props.request.client_email
      form.client_phone = props.request.client_phone
      form.expected_date = props.request.expected_date ? new Date(props.request.expected_date) : null
      form.status = props.request.status
      form.items = (props.request.request_items ?? []).map((i) => ({
        id: i.id,
        title: i.title,
        description: i.description,
        category: i.category,
        status: i.status,
      }))
    } else {
      form.name = ''
      form.description = ''
      form.priority = 'normal'
      form.client_name = ''
      form.client_company = ''
      form.client_email = ''
      form.client_phone = ''
      form.expected_date = null
      form.status = 'pending'
      form.items = [{ title: '', description: '' }]
    }
  },
)

const statusOptions = (Object.keys(STATUS_LABELS) as RequestStatus[]).map((value) => ({
  value,
  label: STATUS_LABELS[value],
}))

function addItem() {
  form.items.push({ title: '', description: '' })
}

function removeItem(index: number) {
  form.items.splice(index, 1)
}

function toLocalDateString(date: Date): string {
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10)
}

function submit() {
  errors.name = form.name.trim() ? undefined : 'Request name is required.'
  errors.client_email = !form.client_email.trim()
    ? 'Client email is required.'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.client_email)
      ? 'Enter a valid email address.'
      : undefined
  if (errors.name || errors.client_email) return

  emit('save', {
    name: form.name.trim(),
    description: form.description.trim(),
    priority: form.priority,
    client_name: form.client_name.trim(),
    client_company: form.client_company.trim(),
    client_email: form.client_email.trim(),
    client_phone: form.client_phone.trim(),
    expected_date: form.expected_date ? toLocalDateString(form.expected_date) : null,
    status: props.request ? form.status : undefined,
    items: form.items.filter((i) => i.title.trim()),
  })
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    modal
    :header="request ? 'Edit Request' : 'New Document Request'"
    :style="{ width: '34rem', maxWidth: '95vw' }"
    :dismissable-mask="!saving"
  >
    <div class="bdg-field">
      <label for="req-name">Request name</label>
      <InputText id="req-name" v-model="form.name" placeholder="e.g. Q3 Financial Audit Docs" :invalid="!!errors.name" />
      <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
    </div>

    <div class="bdg-field">
      <label for="req-desc">Description</label>
      <Textarea id="req-desc" v-model="form.description" rows="2" auto-resize placeholder="Briefly describe the purpose of this request..." class="w-full" />
    </div>

    <div class="bdg-field">
      <label>Priority</label>
      <SelectButton
        v-model="form.priority"
        :options="[
          { label: 'Normal', value: 'normal' },
          { label: 'High', value: 'high' },
        ]"
        option-label="label"
        option-value="value"
        :allow-empty="false"
      />
    </div>

    <div class="formgrid grid">
      <div class="bdg-field col-12 md:col-6">
        <label for="req-client">Client name</label>
        <InputText id="req-client" v-model="form.client_name" placeholder="e.g. Jane Doe" />
      </div>
      <div class="bdg-field col-12 md:col-6">
        <label for="req-email">Client email</label>
        <InputText id="req-email" v-model="form.client_email" type="email" placeholder="client@company.com" :invalid="!!errors.client_email" />
        <small v-if="errors.client_email" class="p-error">{{ errors.client_email }}</small>
      </div>
    </div>

    <div class="formgrid grid">
      <div class="bdg-field col-12 md:col-6">
        <label for="req-company">Client company</label>
        <InputText id="req-company" v-model="form.client_company" placeholder="e.g. Acme Corp" />
      </div>
      <div class="bdg-field col-12 md:col-6">
        <label for="req-phone">Client phone</label>
        <InputText id="req-phone" v-model="form.client_phone" placeholder="+1 (555) 000-0000" />
      </div>
    </div>

    <div class="formgrid grid">
      <div class="bdg-field col-12" :class="{ 'md:col-6': !!request }">
        <label for="req-date">Expected date</label>
        <DatePicker id="req-date" v-model="form.expected_date" date-format="M d, yy" show-icon icon-display="input" />
      </div>
      <div v-if="request" class="bdg-field col-12 md:col-6">
        <label for="req-status">Status</label>
        <Select id="req-status" v-model="form.status" :options="statusOptions" option-label="label" option-value="value" />
      </div>
    </div>

    <div class="mb-2 flex align-items-center justify-content-between">
      <span class="bdg-label-sm">Required documents</span>
      <Button label="Add document" icon="pi pi-plus" text size="small" @click="addItem" />
    </div>

    <div v-for="(item, index) in form.items" :key="item.id ?? index" class="item-row">
      <div class="flex-1">
        <InputText v-model="item.title" placeholder="Document title (e.g. 2022 Tax Returns)" class="w-full mb-2" />
        <Textarea v-model="item.description" placeholder="Instructions for the client (optional)" rows="1" auto-resize class="w-full" />
      </div>
      <Button
        icon="pi pi-trash"
        text
        rounded
        severity="danger"
        :disabled="!!item.status && item.status !== 'pending'"
        v-tooltip.left="!!item.status && item.status !== 'pending' ? 'Files already uploaded' : 'Remove document'"
        @click="removeItem(index)"
      />
    </div>

    <template #footer>
      <Button label="Cancel" severity="secondary" text :disabled="saving" @click="emit('update:visible', false)" />
      <Button :label="request ? 'Save Changes' : 'Create Request'" icon="pi pi-check" :loading="saving" @click="submit" />
    </template>
  </Dialog>
</template>

<style scoped>
.item-row {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--bdg-border);
  border-radius: 0.75rem;
  margin-bottom: 0.625rem;
  background: #f8fafc;
}
</style>
