<script setup lang="ts">
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
</script>

<template>
  <Toast position="top-right" />
  <ConfirmDialog />
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in" :duration="200">
      <component :is="Component" />
    </transition>
  </router-view>
</template>
