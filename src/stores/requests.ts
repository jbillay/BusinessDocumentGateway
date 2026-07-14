import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { RealtimeChannel } from '@supabase/supabase-js'
import JSZip from 'jszip'
import { FILES_BUCKET, supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { DocumentRequest, RequestItemDraft, RequestPriority, RequestStatus, UploadedFile } from '@/types'
import { STATUS_LABELS } from '@/types'

export interface RequestInput {
  name: string
  description: string
  priority: RequestPriority
  client_name: string
  client_company: string
  client_email: string
  client_phone: string
  expected_date: string | null
  status?: RequestStatus
  /** Per-request portal security; omit to leave unchanged on update. */
  portal_pin?: string | null
  expires_at?: string | null
  items: RequestItemDraft[]
}

const REQUEST_SELECT = '*, request_items(*, uploaded_files(*))'

export const useRequestsStore = defineStore('requests', () => {
  const requests = ref<DocumentRequest[]>([])
  const loading = ref(false)

  let channel: RealtimeChannel | null = null
  let refetchTimer: ReturnType<typeof setTimeout> | null = null

  const stats = computed(() => ({
    pending: requests.value.filter((r) => r.status === 'pending').length,
    completed: requests.value.filter((r) => r.status === 'completed').length,
    awaitingClient: requests.value.filter((r) => r.status === 'awaiting_client').length,
    expired: requests.value.filter((r) => r.status === 'expired').length,
  }))

  const storageBytes = computed(() =>
    requests.value
      .flatMap((r) => r.request_items ?? [])
      .flatMap((i) => i.uploaded_files ?? [])
      .reduce((sum, f) => sum + (f.file_size ?? 0), 0),
  )

  async function fetchAll() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('document_requests')
        .select(REQUEST_SELECT)
        .order('created_at', { ascending: false })
      if (error) throw error
      for (const request of data ?? []) {
        request.request_items?.sort((a: { position: number }, b: { position: number }) => a.position - b.position)
      }
      requests.value = data ?? []
    } finally {
      loading.value = false
    }
  }

  async function createRequest(input: RequestInput): Promise<DocumentRequest> {
    const auth = useAuthStore()
    const { data: request, error } = await supabase
      .from('document_requests')
      .insert({
        user_id: auth.user!.id,
        name: input.name,
        description: input.description,
        priority: input.priority,
        client_name: input.client_name,
        client_company: input.client_company,
        client_email: input.client_email,
        client_phone: input.client_phone,
        expected_date: input.expected_date,
        portal_pin: input.portal_pin ?? null,
        expires_at: input.expires_at ?? null,
      })
      .select()
      .single()
    if (error) throw error

    if (input.items.length > 0) {
      const { error: itemsError } = await supabase.from('request_items').insert(
        input.items.map((item, index) => ({
          request_id: request.id,
          title: item.title,
          description: item.description,
          category: item.category ?? '',
          position: index,
        })),
      )
      if (itemsError) throw itemsError
    }

    await logActivity(request.id, 'created', `New request created: ${input.name}`)
    await fetchAll()
    return request
  }

  async function updateRequest(id: string, input: RequestInput) {
    const { error } = await supabase
      .from('document_requests')
      .update({
        name: input.name,
        description: input.description,
        priority: input.priority,
        client_name: input.client_name,
        client_company: input.client_company,
        client_email: input.client_email,
        client_phone: input.client_phone,
        expected_date: input.expected_date,
        ...(input.status ? { status: input.status } : {}),
        ...(input.portal_pin !== undefined ? { portal_pin: input.portal_pin } : {}),
        ...(input.expires_at !== undefined ? { expires_at: input.expires_at } : {}),
      })
      .eq('id', id)
    if (error) throw error

    // Reconcile checklist items: delete removed, update kept, insert new.
    const existing = requests.value.find((r) => r.id === id)?.request_items ?? []
    const keptIds = new Set(input.items.filter((i) => i.id).map((i) => i.id))
    const removed = existing.filter((i) => !keptIds.has(i.id)).map((i) => i.id)
    if (removed.length > 0) {
      const { error: delError } = await supabase.from('request_items').delete().in('id', removed)
      if (delError) throw delError
    }
    for (const [index, item] of input.items.entries()) {
      if (item.id) {
        const { error: upError } = await supabase
          .from('request_items')
          .update({ title: item.title, description: item.description, position: index })
          .eq('id', item.id)
        if (upError) throw upError
      } else {
        const { error: insError } = await supabase.from('request_items').insert({
          request_id: id,
          title: item.title,
          description: item.description,
          category: item.category ?? '',
          position: index,
        })
        if (insError) throw insError
      }
    }
    await fetchAll()
  }

  /** Quick status change (e.g. mark completed from the detail page) with an activity trail. */
  async function setStatus(id: string, status: RequestStatus) {
    const { error } = await supabase.from('document_requests').update({ status }).eq('id', id)
    if (error) throw error
    const name = requests.value.find((r) => r.id === id)?.name ?? 'Request'
    await logActivity(
      id,
      status === 'completed' ? 'completed' : 'info',
      `${name} marked as ${STATUS_LABELS[status]}`,
    )
    await fetchAll()
  }

  async function deleteRequest(id: string) {
    const { error } = await supabase.from('document_requests').delete().eq('id', id)
    if (error) throw error
    requests.value = requests.value.filter((r) => r.id !== id)
  }

  /** Invokes the send-email edge function; it logs the activity event itself. */
  async function sendEmail(
    type: 'request_created' | 'reminder' | 'completed' | 'link_regenerated' | 'documents_rejected',
    requestId: string,
  ) {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { type, request_id: requestId },
    })
    if (error) throw error
    return data as { sent: boolean; to: string }
  }

  /** Sends a reminder email to the client through the edge function. */
  async function sendReminder(request: DocumentRequest) {
    return sendEmail('reminder', request.id)
  }

  async function logActivity(requestId: string | null, type: string, message: string) {
    const auth = useAuthStore()
    if (!auth.user) return
    const { error } = await supabase
      .from('activity_events')
      .insert({ user_id: auth.user.id, request_id: requestId, type, message })
    if (error) throw error
  }

  /** Creates a short-lived signed URL for one file and triggers the download. */
  async function downloadFile(file: UploadedFile) {
    const { data, error } = await supabase.storage
      .from(FILES_BUCKET)
      .createSignedUrl(file.storage_path, 120, { download: file.file_name })
    if (error) throw error
    const link = document.createElement('a')
    link.href = data.signedUrl
    link.download = file.file_name
    link.click()
  }

  /** Downloads every uploaded file of a request as a single ZIP, grouped by document. */
  async function downloadFiles(request: DocumentRequest): Promise<number> {
    const items = (request.request_items ?? []).filter((i) => (i.uploaded_files ?? []).length > 0)
    const total = items.reduce((sum, i) => sum + i.uploaded_files.length, 0)
    if (total === 0) return 0

    const zip = new JSZip()
    const sanitize = (name: string) => name.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'document'
    for (const item of items) {
      const folder = zip.folder(sanitize(item.title))!
      const usedNames = new Set<string>()
      for (const file of item.uploaded_files) {
        const { data, error } = await supabase.storage.from(FILES_BUCKET).download(file.storage_path)
        if (error) throw error
        let name = sanitize(file.file_name)
        for (let n = 2; usedNames.has(name); n++) {
          name = sanitize(file.file_name).replace(/(\.[^.]*)?$/, ` (${n})$1`)
        }
        usedNames.add(name)
        folder.file(name, data)
      }
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${sanitize(request.name)}.zip`
    link.click()
    URL.revokeObjectURL(url)
    return total
  }

  /** Records the requestor's review decision for one document. */
  async function reviewItem(itemId: string, decision: 'approved' | 'rejected') {
    const { error } = await supabase.from('request_items').update({ status: decision }).eq('id', itemId)
    if (error) throw error
    await fetchAll()
  }

  /**
   * Closes the review: everything approved → completed; otherwise the request
   * returns to the client (pending) and rejections are emailed to them.
   */
  async function finishReview(
    request: DocumentRequest,
  ): Promise<{ outcome: 'completed' | 'returned'; rejectedCount: number; emailSent: boolean }> {
    const items = request.request_items ?? []
    if (items.some((i) => i.status === 'uploaded')) {
      throw new Error('Approve or reject every submitted document first.')
    }
    if (items.length > 0 && items.every((i) => i.status === 'approved')) {
      await setStatus(request.id, 'completed')
      return { outcome: 'completed', rejectedCount: 0, emailSent: false }
    }

    const rejectedCount = items.filter((i) => i.status === 'rejected').length
    const { error } = await supabase.from('document_requests').update({ status: 'pending' }).eq('id', request.id)
    if (error) throw error
    await logActivity(
      request.id,
      'info',
      `${request.name} returned to client (${rejectedCount} document${rejectedCount === 1 ? '' : 's'} rejected)`,
    )
    let emailSent = false
    if (rejectedCount > 0) {
      try {
        await sendEmail('documents_rejected', request.id)
        emailSent = true
      } catch {
        emailSent = false
      }
    }
    await fetchAll()
    return { outcome: 'returned', rejectedCount, emailSent }
  }

  function portalLink(request: DocumentRequest): string {
    return `${window.location.origin}/portal/${request.portal_token}`
  }

  /** Updates only the portal security fields without touching the checklist. */
  async function updateSecurity(id: string, patch: { portal_pin?: string | null; expires_at?: string | null }) {
    const { error } = await supabase.from('document_requests').update(patch).eq('id', id)
    if (error) throw error
    await fetchAll()
  }

  /**
   * Issues a fresh portal token (the old link dies) with a new expiry; null/0 days = never expires.
   * Returns whether the new link was also emailed to the client.
   */
  async function regeneratePortalLink(id: string, expiryDays: number | null): Promise<{ emailSent: boolean }> {
    const { error } = await supabase.rpc('regenerate_portal_link', {
      p_request_id: id,
      p_expiry_days: expiryDays && expiryDays > 0 ? expiryDays : null,
    })
    if (error) throw error
    await fetchAll()
    try {
      await sendEmail('link_regenerated', id)
      return { emailSent: true }
    } catch {
      return { emailSent: false }
    }
  }

  /** Live-refresh the table when requests, items, or files change server-side. */
  function subscribe() {
    if (channel) return
    const scheduleRefetch = () => {
      if (refetchTimer) clearTimeout(refetchTimer)
      refetchTimer = setTimeout(() => fetchAll(), 250)
    }
    channel = supabase
      .channel('dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'document_requests' }, scheduleRefetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'request_items' }, scheduleRefetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'uploaded_files' }, scheduleRefetch)
      .subscribe()
  }

  function unsubscribe() {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
  }

  return {
    requests,
    loading,
    stats,
    storageBytes,
    fetchAll,
    createRequest,
    updateRequest,
    setStatus,
    deleteRequest,
    sendEmail,
    sendReminder,
    downloadFile,
    downloadFiles,
    reviewItem,
    finishReview,
    portalLink,
    updateSecurity,
    regeneratePortalLink,
    subscribe,
    unsubscribe,
  }
})
