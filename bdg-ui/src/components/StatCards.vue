<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    <Card>
      <template #title>
        <div class="p-3 rounded-full bg-violet-100 justify-items-center">
          <p class="font-bold">Total Requests</p>
        </div>
      </template>
      <template #content>
        <div class="ml-4">
          <p class="text-2xl font-bold text-gray-900">{{ stats.total || 0 }}</p>
        </div>
      </template>
    </Card>

    <Card>
      <template #title>
        <div class="p-3 rounded-full bg-yellow-100 justify-items-center">
          <p class="font-bold">Pending Requests</p>
        </div>
      </template>
      <template #content>
        <div class="ml-4">
          <p class="text-2xl font-bold text-gray-900">{{ stats.pending || 0 }}</p>
        </div>
      </template>
    </Card>

    <Card>
      <template #title>
        <div class="p-3 rounded-full bg-green-100 justify-items-center">
          <p class="font-bold">Completed Requests</p>
        </div>
      </template>
      <template #content>
        <div class="ml-4">
          <p class="text-2xl font-bold text-gray-900">{{ stats.completed || 0 }}</p>
        </div>
      </template>
    </Card>

    <Card>
      <template #title>
        <div class="p-3 rounded-full bg-red-100 justify-items-center">
          <p class="font-bold">Overdue Requests</p>
        </div>
      </template>
      <template #content>
        <p class="text-2xl font-bold text-gray-900">{{ stats.overdue || 0 }}</p>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { computed, watchEffect } from 'vue'
import { Card } from 'primevue'

const props = defineProps(['requests', 'requestStatus'])

watchEffect(() => {})

// Stats computed from requests
const stats = computed(() => {
  if (!props.requests.length) {
    return { total: 0, pending: 0, completed: 0, overdue: 0 }
  }
  let pending = 0
  let completed = 0
  let overdue = 0
  const total = props.requests.length
  props.requests.forEach((request) => {
    const status = props.requestStatus.find((s) => s.id === request.statusId)
    if (status) {
      if (status.name === 'Pending') pending++
      else if (status.name === 'Completed') completed++
      else {
        const today = new Date()
        const expectedDate = new Date(request.expectedDate)

        if (expectedDate < today && status.name !== 'Completed') overdue++
      }
    }
  })
  return { total, pending, completed, overdue }
})
</script>
