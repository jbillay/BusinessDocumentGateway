<script setup lang="ts">
import Button from 'primevue/button'
import { useActivityStore } from '@/stores/activity'

const activity = useActivityStore()

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

const dotColors: Record<string, string> = {
  upload: '#3b82f6',
  completed: '#10b981',
  reminder: '#94a3b8',
  created: '#06b6d4',
  info: '#94a3b8',
}
</script>

<template>
  <aside class="activity-panel">
    <section class="bdg-card activity-card">
      <span class="bdg-label-sm">Global activity log</span>
      <ul class="activity-list">
        <li v-if="activity.events.length === 0" class="activity-empty">No activity yet.</li>
        <li v-for="event in activity.events" :key="event.id" class="activity-item">
          <span class="activity-dot" :style="{ background: dotColors[event.type] ?? '#94a3b8' }" />
          <div>
            <p class="activity-message">{{ event.message }}</p>
            <span class="activity-time">{{ timeAgo(event.created_at) }}</span>
          </div>
        </li>
      </ul>
      <Button
        v-if="activity.hasMore"
        label="Load More Events"
        severity="secondary"
        outlined
        size="small"
        class="w-full"
        :loading="activity.loading"
        @click="activity.fetch(false)"
      />
    </section>
  </aside>
</template>

<style scoped>
.activity-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.activity-card {
  padding: 1.25rem;
}
.activity-list {
  list-style: none;
  margin: 0.875rem 0;
  padding: 0;
  position: relative;
}
.activity-item {
  display: flex;
  gap: 0.75rem;
  padding-bottom: 1.125rem;
  position: relative;
}
.activity-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 14px;
  bottom: 0;
  width: 2px;
  background: var(--bdg-border);
}
.activity-dot {
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 4px;
  z-index: 1;
}
.activity-message {
  margin: 0;
  font-size: 0.875rem;
  color: var(--bdg-deep);
  line-height: 1.4;
}
.activity-time {
  font-size: 0.75rem;
  color: #94a3b8;
}
.activity-empty {
  color: #94a3b8;
  font-size: 0.875rem;
  padding: 0.5rem 0;
}
</style>
