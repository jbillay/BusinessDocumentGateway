<template>
  <div class="auth-gradient">
    <div class="flex items-center justify-center min-h-screen">
      <Card>
        <template #title> Thanks for registering! </template>
        <template #content>
          Please confirm your email to finishing registering:
          {{ $route.query.email }}
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import Card from 'primevue/card'
</script>
