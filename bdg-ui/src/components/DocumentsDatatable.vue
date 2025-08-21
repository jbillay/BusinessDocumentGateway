<template>
  <DataTable :value="documents" tableStyle="min-width: 50rem">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xl font-bold">Requested Documents</span>
      </div>
    </template>
    <Column field="name" header="Name"></Column>
    <Column field="mandatory" header="Mandatory"></Column>
    <Column field="specificDate" header="Specific Date"></Column>
    <Column field="desc" header="Description"></Column>
    <Column v-if="documents.some((doc) => doc.statusName)" header="Status">
      <template #body="slotProps">
        <span>{{ slotProps.data.statusName }}</span>
      </template>
    </Column>
    <Column v-if="canDelete" header="Actions" bodyStyle="text-align:center;">
      <template #body="slotProps">
        <Button
          icon="pi pi-trash"
          severity="danger"
          rounded
          text
          size="small"
          @click="$emit('remove-document', slotProps.index)"
          aria-label="Remove Document"
        />
      </template>
    </Column>
    <template #footer>
      In total there are
      {{ documents ? documents.length : 0 }} documents.
    </template>
  </DataTable>
</template>

<script setup>
import { DataTable, Column, Button } from 'primevue'
// eslint-disable-next-line no-unused-vars
const props = defineProps({
  documents: {
    type: Array,
    required: true,
  },
  canDelete: {
    type: Boolean,
    default: false,
  },
})
</script>
