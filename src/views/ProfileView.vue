<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const toast = useToast()

const editing = ref(false)
const saving = ref(false)
const form = reactive({ first_name: '', last_name: '', company: '' })
const errors = reactive<{ first_name?: string; last_name?: string }>({})

const memberSince = computed(() => {
  const created = auth.user?.created_at
  if (!created) return ''
  return new Date(created).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
})

function resetForm() {
  form.first_name = auth.profile?.first_name ?? ''
  form.last_name = auth.profile?.last_name ?? ''
  form.company = auth.profile?.company ?? ''
  errors.first_name = undefined
  errors.last_name = undefined
}

watch(() => auth.profile, resetForm, { immediate: true })

function startEdit() {
  resetForm()
  editing.value = true
}

function cancel() {
  resetForm()
  editing.value = false
}

async function save() {
  errors.first_name = form.first_name.trim() ? undefined : 'First name is required.'
  errors.last_name = form.last_name.trim() ? undefined : 'Last name is required.'
  if (errors.first_name || errors.last_name) return

  saving.value = true
  try {
    await auth.updateProfile({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      company: form.company.trim(),
    })
    editing.value = false
    toast.add({ severity: 'success', summary: 'Profile updated', life: 3000 })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Update failed',
      detail: error instanceof Error ? error.message : undefined,
      life: 5000,
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="profile-page">
    <AppNavbar />

    <main class="profile-page__main">
      <section class="profile-hero">
        <Avatar
          :label="auth.initials"
          shape="circle"
          class="profile-hero__avatar"
        />
        <div>
          <h1 class="profile-hero__name">{{ auth.displayName }}</h1>
          <p class="profile-hero__meta">
            {{ auth.profile?.company }}<span v-if="memberSince"> · Member since {{ memberSince }}</span>
          </p>
        </div>
      </section>

      <section class="bdg-card profile-card">
        <div class="profile-card__header">
          <h2 class="profile-card__title">Profile details</h2>
          <Button v-if="!editing" label="Edit" icon="pi pi-pencil" outlined @click="startEdit" />
        </div>

        <div class="formgrid grid">
          <div class="bdg-field col-12 md:col-6">
            <label for="firstName">First name</label>
            <InputText id="firstName" v-model="form.first_name" :disabled="!editing" :invalid="!!errors.first_name" />
            <small v-if="errors.first_name" class="p-error">{{ errors.first_name }}</small>
          </div>
          <div class="bdg-field col-12 md:col-6">
            <label for="lastName">Last name</label>
            <InputText id="lastName" v-model="form.last_name" :disabled="!editing" :invalid="!!errors.last_name" />
            <small v-if="errors.last_name" class="p-error">{{ errors.last_name }}</small>
          </div>
          <div class="bdg-field col-12 md:col-6">
            <label for="company">Company</label>
            <InputText id="company" v-model="form.company" :disabled="!editing" />
          </div>
          <div class="bdg-field col-12 md:col-6">
            <label for="email">Email address</label>
            <InputText id="email" :model-value="auth.profile?.email" disabled />
            <small style="color: #94a3b8">Email is managed by your login and cannot be changed here.</small>
          </div>
        </div>

        <div v-if="editing" class="profile-card__actions">
          <Button label="Cancel" severity="secondary" text :disabled="saving" @click="cancel" />
          <Button label="Save Changes" icon="pi pi-check" :loading="saving" @click="save" />
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.profile-page__main {
  flex: 1;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: 1.5rem;
}
.profile-hero {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.75rem;
  border-radius: 1.25rem;
  background: var(--bdg-gradient);
  color: #ffffff;
  margin-bottom: 1.25rem;
  box-shadow: var(--bdg-shadow-2);
}
.profile-hero__avatar {
  width: 4rem;
  height: 4rem;
  font-size: 1.5rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
  border: 2px solid rgba(255, 255, 255, 0.45);
}
.profile-hero__name {
  margin: 0;
  color: #ffffff;
  font-size: 1.5rem;
}
.profile-hero__meta {
  margin: 0.25rem 0 0;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.9rem;
}
.profile-card {
  padding: 1.75rem;
}
.profile-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}
.profile-card__title {
  margin: 0;
  font-size: 1.2rem;
}
.profile-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--bdg-border);
}
</style>
