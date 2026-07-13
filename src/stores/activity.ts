import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { ActivityEvent } from '@/types'

const PAGE_SIZE = 8

export const useActivityStore = defineStore('activity', () => {
  const events = ref<ActivityEvent[]>([])
  const hasMore = ref(false)
  const loading = ref(false)

  let channel: RealtimeChannel | null = null

  async function fetch(reset = true) {
    loading.value = true
    try {
      const from = reset ? 0 : events.value.length
      const { data, error } = await supabase
        .from('activity_events')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1)
      if (error) throw error
      const page = data ?? []
      events.value = reset ? page : [...events.value, ...page]
      hasMore.value = page.length === PAGE_SIZE
    } finally {
      loading.value = false
    }
  }

  function subscribe() {
    const auth = useAuthStore()
    if (channel || !auth.user) return
    channel = supabase
      .channel('activity-live')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_events',
          filter: `user_id=eq.${auth.user.id}`,
        },
        (payload) => {
          events.value = [payload.new as ActivityEvent, ...events.value]
        },
      )
      .subscribe()
  }

  function unsubscribe() {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
  }

  return { events, hasMore, loading, fetch, subscribe, unsubscribe }
})
