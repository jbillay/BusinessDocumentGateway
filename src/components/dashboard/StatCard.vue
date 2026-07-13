<script setup lang="ts">
defineProps<{
  label: string
  value: string
  icon: string
  hint?: string
  hintClass?: string
}>()
</script>

<template>
  <div class="stat-card bdg-card bdg-card--hover">
    <div class="stat-card__top">
      <span class="bdg-label-sm">{{ label }}</span>
      <i :class="icon" class="stat-card__icon" />
    </div>
    <div class="stat-card__bottom">
      <span class="stat-card__value">{{ value }}</span>
      <span v-if="hint" class="stat-card__hint" :class="hintClass">{{ hint }}</span>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.stat-card {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
}
.stat-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.stat-card__icon {
  color: #94a3b8;
  font-size: 1.1rem;
}
.stat-card__bottom {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.stat-card__value {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--bdg-deep);
}
.stat-card__hint {
  font-size: 0.8rem;
  color: #64748b;
}
.stat-card__hint.positive {
  color: #059669;
}
.stat-card__hint.attention {
  color: #d97706;
}
</style>
