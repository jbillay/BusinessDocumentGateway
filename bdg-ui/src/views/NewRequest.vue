<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Fixed Navbar -->
    <TheMenubar :new="false" />

    <!-- Main Content -->
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
                <div class="flex flex-col">
                  <div
                    class="border-2 border-dashed border-surface-200 dark:border-surface-700 rounded flex-auto flex justify-center items-center font-medium"
                  >
                    <Form v-slot="$formRequestDetail" class="flex flex-col gap-4 w-full sm:w-56">
                      <div class="flex flex-col pt-4">
                        <FloatLabel variant="on">
                          <label for="requestName"> Request Name </label>
                          <InputText
                            id="requestName"
                            v-model="newRequest.name"
                            placeholder="Enter request name"
                          />
                          <Message
                            v-if="$formRequestDetail.username?.invalid"
                            severity="error"
                            size="small"
                            variant="simple"
                            >{{ $formRequestDetail.username.error?.message }}</Message
                          >
                        </FloatLabel>
                      </div>
                      <div class="flex flex-col pt-4">
                        <FloatLabel variant="on">
                          <label for="expectedDate"> Expected Closure Date </label>
                          <DatePicker
                            id="expectedDate"
                            name="expectedDate"
                            v-model="newRequest.expected_date"
                            showIcon
                            fluid
                            iconDisplay="Expected Date"
                            showButtonBar
                            placeholder="Enter Expected Date"
                          />
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
                            <i
                              class="pi pi-minus-circle"
                              @click="removeCallback"
                              @keydown="keydownCallback"
                            />
                          </template>
                        </Chip>
                      </Fieldset>
                      <div>
                        <FloatLabel variant="on">
                          <label for="clientEmail"> Add client email </label>
                          <InputText
                            id="clientEmail"
                            v-model="clientEmail"
                            placeholder="Enter a client email"
                          />
                        </FloatLabel>
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
                            v-model="newRequest.description"
                            rows="5"
                            placeholder="Enter request description"
                          />
                        </FloatLabel>
                      </div>
                    </Form>
                  </div>
                </div>
                <div class="flex pt-6 justify-end">
                  <Button label="Next" icon="pi pi-arrow-right" @click="activateCallback('2')" />
                </div>
              </StepPanel>
              <StepPanel v-slot="{ activateCallback }" value="2">
                <div class="flex flex-col">
                  <div
                    class="border-2 border-dashed border-surface-200 dark:border-surface-700 rounded justify-center items-center font-medium"
                  >
                    <DataTable :value="requestedDocuments" tableStyle="min-width: 50rem">
                      <template #header>
                        <div class="flex flex-wrap items-center justify-between gap-2">
                          <span class="text-xl font-bold">Requested Documents</span>
                        </div>
                      </template>
                      <Column field="name" header="Name"></Column>
                      <Column field="mandatory" header="Mandatory"></Column>
                      <Column field="specificDate" header="Specific Date"></Column>
                      <Column field="desc" header="Description"></Column>
                      <template #footer>
                        In total there are
                        {{ requestedDocuments ? requestedDocuments.length : 0 }} documents.
                      </template>
                    </DataTable>
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
                            />
                          </FloatLabel>
                        </div>
                        <div class="flex flex-col pt-4">
                          <label for="mandatoryDocument"> Mandatory </label>
                          <ToggleSwitch name="mandatory" id="mandatory" fluid>
                            <template #handle="{ checked }">
                              <i
                                :class="[
                                  '!text-xs pi',
                                  { 'pi-check': checked, 'pi-times': !checked },
                                ]"
                              />
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
                            />
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
                      <DataTable :value="requestedDocuments" tableStyle="min-width: 50rem">
                        <Column field="name" header="Name"></Column>
                        <Column field="mandatory" header="Mandatory"></Column>
                        <Column field="specificDate" header="Specific Date"></Column>
                        <Column field="desc" header="Description"></Column>
                        <template #footer>
                          In total there are
                          {{ requestedDocuments ? requestedDocuments.length : 0 }} documents.
                        </template>
                      </DataTable>
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
                  <Button label="Send Request" iconPos="right" @click="sendRequest()" />
                </div>
              </StepPanel>
            </StepPanels>
          </Stepper>
          <ProgressSpinner v-if="creating" />
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
  Chip,
  Fieldset,
  Textarea,
  DataTable,
  Column,
  Divider,
  ToggleSwitch,
  Panel,
  Fluid,
  ProgressSpinner,
} from 'primevue'
import { Form } from '@primevue/forms'
import { ref } from 'vue'
import TheMenubar from '../components/TheMenubar.vue'
import TheFooter from '../components/TheFooter.vue'
import { useRouter } from 'vue-router'
import { requestsStore } from '@/stores/requests'
import { useToast } from 'primevue/usetoast'

const requestsStoreSession = requestsStore()
const router = useRouter()
const toast = useToast()

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

const insertEmailToChip = () => {
  if (clientEmail.value) {
    newRequest.value.client_email.push({ email: clientEmail.value })
    clientEmail.value = ''
  }
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
  if (e.states) {
    const mandatoryStatus = e.states.mandatory.value ? e.states.mandatory.value : false
    requestedDocuments.value.push({
      name: e.states.name.value,
      mandatory: mandatoryStatus,
      specificDate: e.states.specificDate.value,
      desc: e.states.desc.value,
    })
    e.reset()
  }
}

const sendRequest = async () => {
  // Logic to send the request
  creating.value = true
  try {
    await requestsStoreSession.createNewRequest(newRequest, requestedDocuments)
    toast.add({
      title: 'Success',
      description: 'Request successfully sent !',
      color: 'green',
    })
    router.push({ name: 'home' })
  } catch (e) {
    console.error('Error on sending request', e)
    toast.add({
      title: 'Error',
      description: 'Request not successfully sent :(',
      color: 'red',
    })
  } finally {
    creating.value = false
  }
}
</script>
