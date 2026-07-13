<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Height of the mark in px */
    size?: number
    /** Show the wordmark next to the mark */
    wordmark?: boolean
    /** Wordmark color (defaults to deep blue) */
    color?: string
  }>(),
  { size: 32, wordmark: true, color: '#0F172A' },
)
</script>

<template>
  <span class="brand-logo">
    <svg :width="size" :height="size" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="bdg-gradient" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stop-color="#4A56B0" />
          <stop offset="0.55" stop-color="#3B82F6" />
          <stop offset="1" stop-color="#5FB8B0" />
        </linearGradient>
      </defs>
      <g fill="url(#bdg-gradient)">
        <rect x="3" y="11" width="4.5" height="10" rx="2.25" />
        <rect x="9.5" y="8" width="4.5" height="16" rx="2.25" />
        <rect x="16" y="5.5" width="4.5" height="21" rx="2.25" />
        <rect x="22.5" y="3" width="4.5" height="26" rx="2.25" />
      </g>
    </svg>
    <span v-if="wordmark" class="brand-logo__text" :style="{ color }">
      Business Document <span class="brand-logo__accent">Gateway</span>
    </span>
  </span>
</template>

<style scoped>
.brand-logo {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  line-height: 1;
}
.brand-logo__text {
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: -0.02em;
  white-space: nowrap;
}
.brand-logo__accent {
  background: linear-gradient(120deg, #4a56b0, #3b82f6 55%, #06b6d4);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
</style>
