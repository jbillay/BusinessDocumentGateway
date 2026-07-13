<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import BrandLogo from '@/components/brand/BrandLogo.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()

const form = reactive({
  firstName: '',
  lastName: '',
  company: '',
  email: '',
  password: '',
  confirm: '',
})
const errors = reactive<Partial<Record<keyof typeof form, string>>>({})
const submitting = ref(false)
const awaitingConfirmation = ref(false)

function validate(): boolean {
  errors.firstName = form.firstName ? undefined : 'First name is required.'
  errors.lastName = form.lastName ? undefined : 'Last name is required.'
  errors.company = form.company ? undefined : 'Company is required.'
  errors.email = !form.email
    ? 'Email is required.'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      ? 'Enter a valid email address.'
      : undefined
  errors.password = !form.password
    ? 'Password is required.'
    : form.password.length < 8
      ? 'Password must be at least 8 characters.'
      : undefined
  errors.confirm = form.confirm !== form.password ? 'Passwords do not match.' : undefined
  return Object.values(errors).every((e) => !e)
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  try {
    const loggedIn = await auth.signUp({
      firstName: form.firstName,
      lastName: form.lastName,
      company: form.company,
      email: form.email,
      password: form.password,
    })
    if (loggedIn) {
      router.push({ name: 'dashboard' })
    } else {
      awaitingConfirmation.value = true
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Registration failed',
      detail: error instanceof Error ? error.message : 'Please try again.',
      life: 5000,
    })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="bdg-auth-bg">
    <div class="auth-card bdg-card">
      <div class="auth-card__brand">
        <BrandLogo :size="40" :wordmark="false" />
        <h2 class="auth-card__title">Create your account</h2>
        <p class="auth-card__subtitle">Start collecting documents securely in minutes.</p>
      </div>

      <Message v-if="awaitingConfirmation" severity="success" class="mb-4">
        Almost there! Check <strong>{{ form.email }}</strong> for a confirmation link, then sign in.
      </Message>

      <form v-else @submit.prevent="submit" novalidate>
        <div class="formgrid grid">
          <div class="bdg-field col-12 md:col-6">
            <label for="firstName">First name</label>
            <InputText id="firstName" v-model.trim="form.firstName" :invalid="!!errors.firstName" autocomplete="given-name" />
            <small v-if="errors.firstName" class="p-error">{{ errors.firstName }}</small>
          </div>
          <div class="bdg-field col-12 md:col-6">
            <label for="lastName">Last name</label>
            <InputText id="lastName" v-model.trim="form.lastName" :invalid="!!errors.lastName" autocomplete="family-name" />
            <small v-if="errors.lastName" class="p-error">{{ errors.lastName }}</small>
          </div>
        </div>

        <div class="bdg-field">
          <label for="company">Company</label>
          <InputText id="company" v-model.trim="form.company" :invalid="!!errors.company" autocomplete="organization" />
          <small v-if="errors.company" class="p-error">{{ errors.company }}</small>
        </div>

        <div class="bdg-field">
          <label for="email">Email address</label>
          <InputText id="email" v-model.trim="form.email" type="email" placeholder="name@company.com" :invalid="!!errors.email" autocomplete="email" />
          <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
        </div>

        <div class="bdg-field">
          <label for="password">Password</label>
          <Password
            v-model="form.password"
            input-id="password"
            toggle-mask
            :invalid="!!errors.password"
            prompt-label="Choose a password"
            weak-label="Weak"
            medium-label="Medium"
            strong-label="Strong"
            :input-props="{ autocomplete: 'new-password' }"
          />
          <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
        </div>

        <div class="bdg-field">
          <label for="confirm">Confirm password</label>
          <Password
            v-model="form.confirm"
            input-id="confirm"
            :feedback="false"
            toggle-mask
            :invalid="!!errors.confirm"
            :input-props="{ autocomplete: 'new-password' }"
          />
          <small v-if="errors.confirm" class="p-error">{{ errors.confirm }}</small>
        </div>

        <Button type="submit" label="Create Account" icon="pi pi-arrow-right" icon-pos="right" class="w-full" :loading="submitting" />
      </form>

      <div class="auth-card__divider" />
      <p class="auth-card__footer">
        Already have an account?
        <router-link :to="{ name: 'login' }" class="auth-card__link font-semibold">Sign in</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-card {
  width: 100%;
  max-width: 30rem;
  padding: 2.25rem 2rem;
}
.auth-card__brand {
  text-align: center;
  margin-bottom: 1.75rem;
}
.auth-card__title {
  margin: 0.875rem 0 0.25rem;
  font-size: 1.5rem;
}
.auth-card__subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.925rem;
}
.auth-card__link {
  color: var(--bdg-blue);
  text-decoration: none;
  font-size: 0.875rem;
}
.auth-card__link:hover {
  text-decoration: underline;
}
.auth-card__divider {
  border-top: 1px solid var(--bdg-border);
  margin: 1.5rem 0 1rem;
}
.auth-card__footer {
  text-align: center;
  margin: 0;
  font-size: 0.9rem;
  color: #475569;
}
</style>
