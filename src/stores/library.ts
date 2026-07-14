import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { LibraryDocument } from '@/types'

export interface LibraryDocumentInput {
  title: string
  description: string
  category: string
}

export const useLibraryStore = defineStore('library', () => {
  const documents = ref<LibraryDocument[]>([])
  const loading = ref(false)
  const loaded = ref(false)

  const categories = computed(() =>
    [...new Set(documents.value.map((d) => d.category).filter(Boolean))].sort(),
  )

  /** Documents grouped by category, uncategorized entries last. */
  const grouped = computed(() => {
    const groups = new Map<string, LibraryDocument[]>()
    for (const doc of documents.value) {
      const key = doc.category || 'Other Documents'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(doc)
    }
    return [...groups.entries()].map(([category, items]) => ({ category, items }))
  })

  async function load(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('library_documents')
        .select('*')
        .order('category')
        .order('position')
        .order('created_at')
      if (error) throw error
      documents.value = data ?? []
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function create(input: LibraryDocumentInput): Promise<LibraryDocument> {
    const auth = useAuthStore()
    if (!auth.user) throw new Error('Not authenticated')
    const { data, error } = await supabase
      .from('library_documents')
      .insert({
        user_id: auth.user.id,
        title: input.title,
        description: input.description,
        category: input.category,
        position: documents.value.length,
      })
      .select()
      .single()
    if (error) throw error
    await load(true)
    return data
  }

  async function update(id: string, input: LibraryDocumentInput) {
    const { error } = await supabase.from('library_documents').update(input).eq('id', id)
    if (error) throw error
    await load(true)
  }

  async function remove(id: string) {
    const { error } = await supabase.from('library_documents').delete().eq('id', id)
    if (error) throw error
    documents.value = documents.value.filter((d) => d.id !== id)
  }

  return { documents, loading, loaded, categories, grouped, load, create, update, remove }
})
