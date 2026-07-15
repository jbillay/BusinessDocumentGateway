<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

/**
 * Reusable "moment of need" upgrade prompt: names the blocked action and
 * sends the user to /billing. Openers set a feature-specific title/message.
 */
const visible = defineModel<boolean>('visible', { required: true })
const props = withDefaults(
  defineProps<{
    title?: string
    message: string
  }>(),
  { title: 'Upgrade to Pro' },
)
const router = useRouter()

function goToBilling() {
  visible.value = false
  router.push({ name: 'billing' })
}
</script>

<template>
  <Dialog v-model:visible="visible" modal :header="props.title" :style="{ width: '26rem' }" :draggable="false">
    <div class="upgrade-dialog__body">
      <span class="upgrade-dialog__icon"><i class="pi pi-sparkles" /></span>
      <p class="upgrade-dialog__message">{{ props.message }}</p>
      <p class="upgrade-dialog__hint">Pro is $19/month — or $15/month billed annually.</p>
    </div>
    <template #footer>
      <Button label="Not now" text severity="secondary" @click="visible = false" />
      <Button label="See plans & upgrade" icon="pi pi-arrow-right" icon-pos="right" @click="goToBilling" />
    </template>
  </Dialog>
</template>

<style scoped>
.upgrade-dialog__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
  padding: 0.5rem 0.25rem 0;
}
.upgrade-dialog__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: #eff6ff;
  color: var(--bdg-blue, #3b82f6);
  font-size: 1.3rem;
  margin-bottom: 0.25rem;
}
.upgrade-dialog__message {
  margin: 0;
  color: var(--bdg-deep, #0f172a);
  font-weight: 500;
  line-height: 1.5;
}
.upgrade-dialog__hint {
  margin: 0 0 0.5rem;
  color: #64748b;
  font-size: 0.875rem;
}
</style>
