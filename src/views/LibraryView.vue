<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import AutoComplete from 'primevue/autocomplete'
import Tag from 'primevue/tag'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { useLibraryStore, type LibraryDocumentInput } from '@/stores/library'
import type { LibraryDocument } from '@/types'

const toast = useToast()
const confirm = useConfirm()
const library = useLibraryStore()

onMounted(() => library.load())

const dialogVisible = ref(false)
const editing = ref<LibraryDocument | null>(null)
const saving = ref(false)
const form = reactive<LibraryDocumentInput>({ title: '', description: '', category: '' })
const errors = reactive<{ title?: string }>({})
const categorySuggestions = ref<string[]>([])

function searchCategories(event: { query: string }) {
  const q = event.query.toLowerCase()
  categorySuggestions.value = library.categories.filter((c) => c.toLowerCase().includes(q))
}

function openCreate() {
  editing.value = null
  form.title = ''
  form.description = ''
  form.category = ''
  errors.title = undefined
  dialogVisible.value = true
}

function openEdit(doc: LibraryDocument) {
  editing.value = doc
  form.title = doc.title
  form.description = doc.description
  form.category = doc.category
  errors.title = undefined
  dialogVisible.value = true
}

async function save() {
  errors.title = form.title.trim() ? undefined : 'Document title is required.'
  if (errors.title) return
  saving.value = true
  try {
    const input = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
    }
    if (editing.value) {
      await library.update(editing.value.id, input)
    } else {
      await library.create(input)
    }
    dialogVisible.value = false
    toast.add({ severity: 'success', summary: editing.value ? 'Document updated' : 'Document added', life: 3000 })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Save failed',
      detail: error instanceof Error ? error.message : undefined,
      life: 5000,
    })
  } finally {
    saving.value = false
  }
}

function confirmDelete(doc: LibraryDocument) {
  confirm.require({
    message: `Remove "${doc.title}" from your library? Existing requests are not affected.`,
    header: 'Remove document',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Remove', severity: 'danger' },
    accept: async () => {
      try {
        await library.remove(doc.id)
        toast.add({ severity: 'success', summary: 'Document removed', life: 3000 })
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Remove failed', detail: error instanceof Error ? error.message : undefined, life: 5000 })
      }
    },
  })
}
</script>

<template>
  <div class="library-page">
    <AppNavbar />

    <main class="library-page__main">
      <div class="library-header">
        <div>
          <h1 class="library-header__title">Document Library</h1>
          <p class="library-header__subtitle">
            Reusable document templates, grouped by category. Pick them in one click when creating a request.
          </p>
        </div>
        <Button label="Add Document" icon="pi pi-plus" @click="openCreate" />
      </div>

      <section v-if="!library.loading && library.documents.length === 0" class="bdg-card library-empty">
        <i class="pi pi-book" style="font-size: 2.5rem; color: #cbd5e1" />
        <h2>Your library is empty</h2>
        <p>
          Add the documents you request most often — tax returns, bank statements, IDs — and organize them into
          categories. They'll show up as one-click choices in the request wizard.
        </p>
        <Button label="Add your first document" icon="pi pi-plus" outlined @click="openCreate" />
      </section>

      <section v-for="group in library.grouped" :key="group.category" class="library-group">
        <div class="library-group__header">
          <h2><i class="pi pi-folder" /> {{ group.category }}</h2>
          <Tag :value="`${group.items.length} document${group.items.length === 1 ? '' : 's'}`" severity="secondary" />
        </div>
        <div class="bdg-card library-group__card">
          <div v-for="doc in group.items" :key="doc.id" class="library-item">
            <i class="pi pi-file library-item__icon" />
            <div class="library-item__body">
              <span class="library-item__title">{{ doc.title }}</span>
              <span v-if="doc.description" class="library-item__desc">{{ doc.description }}</span>
            </div>
            <div class="library-item__actions">
              <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" v-tooltip.top="'Edit'" @click="openEdit(doc)" />
              <Button icon="pi pi-trash" text rounded size="small" severity="danger" v-tooltip.top="'Remove'" @click="confirmDelete(doc)" />
            </div>
          </div>
        </div>
      </section>
    </main>

    <AppFooter />

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editing ? 'Edit Document' : 'Add Document'"
      :style="{ width: '30rem', maxWidth: '95vw' }"
      :dismissable-mask="!saving"
    >
      <div class="bdg-field">
        <label for="lib-title">Document title</label>
        <InputText id="lib-title" v-model="form.title" placeholder="e.g. 2025 Tax Returns" :invalid="!!errors.title" />
        <small v-if="errors.title" class="p-error">{{ errors.title }}</small>
      </div>
      <div class="bdg-field">
        <label for="lib-category">Category</label>
        <AutoComplete
          id="lib-category"
          v-model="form.category"
          :suggestions="categorySuggestions"
          dropdown
          placeholder="e.g. Financial Records"
          class="w-full"
          @complete="searchCategories"
        />
        <small class="library-hint">Documents with the same category can be added to a request all at once.</small>
      </div>
      <div class="bdg-field">
        <label for="lib-desc">Instructions for the client</label>
        <Textarea id="lib-desc" v-model="form.description" rows="2" auto-resize class="w-full" placeholder="e.g. Federal and State filings (1040)" />
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" text :disabled="saving" @click="dialogVisible = false" />
        <Button :label="editing ? 'Save Changes' : 'Add Document'" icon="pi pi-check" :loading="saving" @click="save" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.library-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.library-page__main {
  flex: 1;
  width: 100%;
  max-width: 880px;
  margin: 0 auto;
  padding: 1.5rem;
}
.library-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.library-header__title {
  margin: 0;
  font-size: 1.75rem;
}
.library-header__subtitle {
  margin: 0.25rem 0 0;
  color: #64748b;
  max-width: 34rem;
}
.library-empty {
  padding: 3rem 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
}
.library-empty h2 {
  margin: 0.5rem 0 0;
  color: var(--bdg-deep);
}
.library-empty p {
  margin: 0 0 1rem;
  max-width: 30rem;
}
.library-group {
  margin-bottom: 1.5rem;
}
.library-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.625rem;
}
.library-group__header h2 {
  margin: 0;
  font-size: 1.1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.library-group__header .pi {
  color: #64748b;
}
.library-group__card {
  padding: 0;
  overflow: hidden;
}
.library-item {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1rem 1.25rem;
}
.library-item + .library-item {
  border-top: 1px solid #f1f5f9;
}
.library-item__icon {
  color: #94a3b8;
  margin-top: 0.25rem;
}
.library-item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}
.library-item__title {
  font-weight: 600;
}
.library-item__desc {
  color: #64748b;
  font-size: 0.85rem;
}
.library-item__actions {
  display: flex;
  gap: 0.25rem;
}
.library-hint {
  color: #94a3b8;
  font-size: 0.8rem;
}
</style>
