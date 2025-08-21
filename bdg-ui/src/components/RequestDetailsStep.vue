<template>
  <div class="flex flex-col">
    <div
      class="border-2 border-dashed border-surface-200 dark:border-surface-700 rounded flex-auto flex justify-center items-center font-medium"
    >
      <Form class="flex flex-col gap-4 w-full sm:w-56">
        <div class="flex flex-col pt-4">
          <FloatLabel variant="on">
            <label for="requestName"> Request Name </label>
            <InputText
              id="requestName"
              :value="newRequest.name"
              @input="$emit('update:newRequest', { ...newRequest, name: $event.target.value })"
              placeholder="Enter request name"
              aria-label="Request Name"
            />
            <Message v-if="errors && errors.name" severity="error" size="small" variant="simple">{{
              errors.name || ''
            }}</Message>
          </FloatLabel>
        </div>
        <div class="flex flex-col pt-4">
          <FloatLabel variant="on">
            <label for="expectedDate"> Expected Closure Date </label>
            <DatePicker
              id="expectedDate"
              name="expectedDate"
              :modelValue="newRequest.expected_date"
              @update:modelValue="
                $emit('update:newRequest', { ...newRequest, expected_date: $event })
              "
              showIcon
              fluid
              iconDisplay="Expected Date"
              showButtonBar
              placeholder="Enter Expected Date"
              aria-label="Expected Closure Date"
            />
            <Message v-if="errors.expected_date" severity="error" size="small" variant="simple">{{
              errors.expected_date
            }}</Message>
          </FloatLabel>
        </div>
        <Fieldset legend="Client Emails" class="pt-4">
          <Chip
            v-for="clientEmail in newRequest.client_email"
            :key="clientEmail.email"
            :label="clientEmail.email"
            @remove="removeClientEmail(clientEmail.email)"
            removable
          >
            <template #removeicon="{ removeCallback, keydownCallback }">
              <i class="pi pi-minus-circle" @click="removeCallback" @keydown="keydownCallback" />
            </template>
          </Chip>
          <Message v-if="errors.client_email" severity="error" size="small" variant="simple">{{
            errors.client_email
          }}</Message>
        </Fieldset>
        <div>
          <FloatLabel variant="on">
            <label for="clientEmail"> Add client email </label>
            <InputText
              id="clientEmail"
              :value="clientEmail"
              @input="$emit('update:clientEmail', $event.target.value)"
              placeholder="Enter a client email"
              aria-label="Add client email"
            />
          </FloatLabel>
          <Message
            v-if="errors && errors.clientEmailInput"
            severity="error"
            size="small"
            variant="simple"
            >{{ errors.clientEmailInput || '' }}</Message
          >
          <Button
            label="Add Email"
            icon="pi pi-email"
            class="p-button p-button-secondary p-button-sm mt-2"
            @click="insertEmailToChip()"
          />
        </div>
        <div class="flex flex-col pt-4">
          <FloatLabel variant="on">
            <label for="requestDescription"> Request Description </label>
            <Textarea
              id="requestDescription"
              :value="newRequest.description"
              @input="
                $emit('update:newRequest', { ...newRequest, description: $event.target.value })
              "
              rows="5"
              placeholder="Enter request description"
              aria-label="Request Description"
            />
            <Message v-if="errors.description" severity="error" size="small" variant="simple">{{
              errors.description
            }}</Message>
          </FloatLabel>
        </div>
      </Form>
    </div>
  </div>
</template>

<script setup>
import { Form } from '@primevue/forms'
import {
  FloatLabel,
  InputText,
  Message,
  DatePicker,
  Fieldset,
  Chip,
  Button,
  Textarea,
} from 'primevue'

// eslint-disable-next-line no-unused-vars
const props = defineProps({
  newRequest: Object,
  clientEmail: String,
  errors: Object,
  insertEmailToChip: Function,
  removeClientEmail: Function,
})
</script>
