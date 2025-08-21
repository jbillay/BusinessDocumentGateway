<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Fixed Navbar -->
    <TheMenubar :new="false" />

    <!-- Main content-->
    <main class="pt-4 pb-4">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="card flex justify-center">
          <Stepper value="1" linear class="basis-[50rem]">
            <StepList>
              <Step value="1">Request Details</Step>
              <Step value="2">Request Documents</Step>
              <Step value="3">Review & Sending</Step>
            </StepList>
            <StepPanels>
              <StepPanel v-slot="{ activateCallback }" value="1">
                <RequestDetailsStep
                  :newRequest="newRequest"
                  :clientEmail="clientEmail"
                  :errors="errors"
                  :insertEmailToChip="insertEmailToChip"
                  :removeClientEmail="removeClientEmail"
                  @update:newRequest="(val) => (newRequest = val)"
                  @update:clientEmail="(val) => (clientEmail = val)"
                />
                <div class="flex pt-6 justify-end">
                  <Button label="Next" icon="pi pi-arrow-right" @click="activateCallback('2')" />
                </div>
              </StepPanel>
              <StepPanel v-slot="{ activateCallback }" value="2">
                <div class="flex flex-col">
                  <div
                    class="border-2 border-dashed border-surface-200 dark:border-surface-700 rounded justify-center items-center font-medium"
                  >
                    <DocumentsDatatable
                      :documents="requestedDocuments"
                      :canDelete="true"
                      @remove-document="removeDocument"
                    />
                    <Divider />
                    <div class="flex flex-auto justify-center items-center">
                      <Form
                        class="flex flex-col gap-4 w-full sm:w-56"
                        @submit="addDocumentToDatatable"
                      >
                        <div class="flex flex-col pt-4">
                          <FloatLabel variant="on">
                            <label for="documentName"> Name </label>
                            <InputText
                              name="name"
                              id="documentName"
                              placeholder="Enter request name"
                              fluid
                              aria-label="Document Name"
                            />
                            <Message
                              v-if="errors.document.name"
                              severity="error"
                              size="small"
                              variant="simple"
                              >{{ errors.document.name }}</Message
                            >
                          </FloatLabel>
                        </div>
                        <div class="flex flex-col pt-4">
                          <label for="mandatoryDocument"> Mandatory </label>
                          <ToggleSwitch name="mandatory" id="mandatory" fluid>
                            <template #handle>
                              <i />
                            </template>
                          </ToggleSwitch>
                        </div>
                        <div class="flex flex-col pt-4">
                          <FloatLabel variant="on">
                            <label for="specificExpectedDate"> Specific Expected Date </label>
                            <DatePicker
                              name="specificDate"
                              id="specificExpectedDate"
                              showIcon
                              fluid
                              iconDisplay="Expected Date"
                              showButtonBar
                              placeholder="Enter Expected Date"
                              aria-label="Specific Expected Date"
                            />
                            <Message
                              v-if="errors.document.specificDate"
                              severity="error"
                              size="small"
                              variant="simple"
                              >{{ errors.document.specificDate }}</Message
                            >
                          </FloatLabel>
                        </div>
                        <div class="flex flex-col pt-4">
                          <FloatLabel variant="on">
                            <label for="documentDescription"> Description </label>
                            <Textarea
                              name="desc"
                              id="documentDescription"
                              rows="5"
                              placeholder="Enter document description"
                              fluid
                              aria-label="Document Description"
                            />
                          </FloatLabel>
                        </div>
                        <Button
                          type="submit"
                          severity="secondary"
                          label="Add document to the list"
                        />
                      </Form>
                    </div>
                  </div>
                  <div class="flex pt-6 justify-between">
                    <Button
                      label="Back"
                      severity="secondary"
                      icon="pi pi-arrow-left"
                      @click="activateCallback('1')"
                    />
                    <Button
                      label="Next"
                      icon="pi pi-arrow-right"
                      iconPos="right"
                      @click="activateCallback('3')"
                    />
                  </div>
                </div>
              </StepPanel>
              <StepPanel v-slot="{ activateCallback }" value="3">
                <div class="flex flex-col">
                  <div
                    class="border-2 border-dashed border-surface-200 dark:border-surface-700 rounded justify-center items-center"
                  >
                    <Panel>
                      <div class="flex items-center gap-2">
                        <span class="font-bold font-large">Request Information</span>
                      </div>
                      <Fluid>
                        <div class="grid grid-cols-2 gap-4 items-center justify-items-center">
                          <div><label for="requestName">Request Name</label></div>
                          <div>
                            <InputText
                              class="col-span-full"
                              id="requestName"
                              type="text"
                              v-model="newRequest.name"
                              disabled
                            />
                          </div>
                          <div><label for="expectedDate">Expected Closure Date</label></div>
                          <div>
                            <InputText
                              id="expectedDate"
                              name="expectedDate"
                              type="text"
                              v-model="newRequest.expected_date"
                              disabled
                            />
                          </div>
                          <div><label for="clientEmails">Client Email(s)</label></div>
                          <div>
                            <InputText
                              id="clientEmails"
                              type="text"
                              :value="displayClientEmails(newRequest.client_email)"
                              disabled
                            />
                          </div>
                          <div><label for="requestDesc">Request Description</label></div>
                          <div>
                            <Textarea
                              id="requestDesc"
                              type="text"
                              v-model="newRequest.description"
                              disabled
                            />
                          </div>
                        </div>
                      </Fluid>
                    </Panel>
                    <Panel>
                      <div class="flex items-center gap-2">
                        <span class="font-bold font-large">Requested Documents</span>
                      </div>
                      <DocumentsDatatable :documents="requestedDocuments" :canDelete="false" />
                    </Panel>
                  </div>
                </div>
                <div class="flex pt-6 justify-between">
                  <Button
                    label="Back"
                    severity="secondary"
                    icon="pi pi-arrow-left"
                    @click="activateCallback('2')"
                  />
                  <Button label="Send Request" iconPos="right" @click="confirmSendRequest()" />
                  <ConfirmDialog></ConfirmDialog>
                </div>
              </StepPanel>
            </StepPanels>
          </Stepper>
          <ProgressSpinner v-if="creating" />
          <Toast />
        </div>
      </div>
    </main>
    <!-- Footer -->
    <TheFooter />
  </div>
</template>

<script setup>
import {
  Step,
  Stepper,
  StepPanel,
  StepPanels,
  StepList,
  Button,
  FloatLabel,
  DatePicker,
  InputText,
  Message,
  Textarea,
  Divider,
  Toast,
  ToggleSwitch,
  Panel,
  Fluid,
  ProgressSpinner,
  ConfirmDialog,
} from 'primevue'
import { Form } from '@primevue/forms'
import { ref } from 'vue'
import TheMenubar from '@/components/TheMenubar.vue'
import TheFooter from '@/components/TheFooter.vue'
import DocumentsDatatable from '@/components/DocumentsDatatable.vue'
import RequestDetailsStep from '../components/RequestDetailsStep.vue'
import { useRouter } from 'vue-router'
import { requestsStore } from '@/stores/requests'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const requestsStoreSession = requestsStore()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const creating = ref(false)
// New request form
const newRequest = ref({
  name: '',
  client_email: [],
  expected_date: '',
  description: '',
})
const clientEmail = ref('')
const requestedDocuments = ref([])

// Confirmation dialog before sending request
const confirmSendRequest = () => {
  confirm.require({
    message: 'Are you sure you want to send this request?',
    header: 'Confirm Send',
    icon: 'pi pi-exclamation-triangle',
    accept: sendRequest,
    reject: () => {},
  })
}

// Validation state
const errors = ref({
  name: '',
  expected_date: '',
  client_email: '',
  clientEmailInput: '',
  description: '',
  document: {
    name: '',
    specificDate: '',
    desc: '',
  },
})

const insertEmailToChip = () => {
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!clientEmail.value) {
    errors.value.clientEmailInput = 'Email is required.'
    return
  }
  if (!emailRegex.test(clientEmail.value)) {
    errors.value.clientEmailInput = 'Invalid email format.'
    return
  }
  if (newRequest.value.client_email.some((e) => e.email === clientEmail.value)) {
    errors.value.clientEmailInput = 'Email already added.'
    return
  }
  newRequest.value.client_email.push({ email: clientEmail.value })
  clientEmail.value = ''
  errors.value.clientEmailInput = ''
}

const removeClientEmail = (email) => {
  const index = newRequest.value.client_email.findIndex((emailList) => emailList.email === email)
  newRequest.value.client_email.splice(index, 1)
}

const displayClientEmails = (emailList) => {
  const emailString = emailList.map((itm) => itm.email).join(', ')
  return emailString
}

const addDocumentToDatatable = (e) => {
  errors.value.document.name = ''
  errors.value.document.specificDate = ''
  // Validate document name
  if (!e.states.name.value) {
    errors.value.document.name = 'Document name is required.'
    return
  }
  // Validate specific date (optional, but if present, must be valid)
  // Add more date validation if needed
  requestedDocuments.value.push({
    name: e.states.name.value,
    mandatory: e.states.mandatory.value ? e.states.mandatory.value : false,
    specificDate: e.states.specificDate.value,
    desc: e.states.desc.value,
  })
  e.reset()
}

const removeDocument = (index) => {
  requestedDocuments.value.splice(index, 1)
}

const sendRequest = async () => {
  // Validate all required fields before sending
  errors.value.name = newRequest.value.name ? '' : 'Request name is required.'
  errors.value.expected_date = newRequest.value.expected_date ? '' : 'Expected date is required.'
  errors.value.client_email = newRequest.value.client_email.length
    ? ''
    : 'At least one client email is required.'
  if (errors.value.name || errors.value.expected_date || errors.value.client_email) {
    // Gather all error messages
    const errorMessages = []
    if (errors.value.name) errorMessages.push(errors.value.name)
    if (errors.value.expected_date) errorMessages.push(errors.value.expected_date)
    if (errors.value.client_email) errorMessages.push(errors.value.client_email)
    if (errors.value.clientEmailInput) errorMessages.push(errors.value.clientEmailInput)
    if (errors.value.description) errorMessages.push(errors.value.description)
    // Document errors
    if (errors.value.document) {
      Object.values(errors.value.document).forEach((msg) => {
        if (msg) errorMessages.push(msg)
      })
    }
    const allErrors = errorMessages.join('\n')
    console.log('Form submission errors:', allErrors)
    toast.add({
      severity: 'error',
      summary: 'Error in the form submission',
      detail: allErrors,
      life: 8000,
    })
    return
  }
  creating.value = true
  try {
    await requestsStoreSession.createNewRequest(newRequest, requestedDocuments)
    toast.add({
      severity: 'success',
      summary: 'Success in sending request',
      detail: 'Request successfully sent !',
      life: 8000,
    })
    router.push({ name: 'home' })
  } catch (e) {
    console.error('Error on sending request', e)
    toast.add({
      severity: 'error',
      summary: 'Error in sending request',
      detail: 'Request not successfully sent :(',
      life: 8000,
    })
  } finally {
    creating.value = false
  }
}
</script>
