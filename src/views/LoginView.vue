<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import BrandLogo from '@/components/brand/BrandLogo.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

const form = reactive({ email: '', password: '', remember: false })
const errors = reactive<{ email?: string; password?: string }>({})
const submitting = ref(false)

function validate(): boolean {
  errors.email = !form.email
    ? 'Email is required.'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      ? 'Enter a valid email address.'
      : undefined
  errors.password = !form.password ? 'Password is required.' : undefined
  return !errors.email && !errors.password
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  try {
    await auth.signIn(form.email, form.password)
    router.push((route.query.redirect as string) ?? { name: 'dashboard' })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Sign in failed',
      detail: error instanceof Error ? error.message : 'Please check your credentials.',
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
        <h2 class="auth-card__title">Welcome back</h2>
        <p class="auth-card__subtitle">Sign in to access your secure workspace.</p>
      </div>

      <form @submit.prevent="submit" novalidate>
        <div class="bdg-field">
          <label for="email">Email address</label>
          <InputText
            id="email"
            v-model.trim="form.email"
            type="email"
            placeholder="name@company.com"
            :invalid="!!errors.email"
            autocomplete="email"
          />
          <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
        </div>

        <div class="bdg-field">
          <div class="flex justify-content-between align-items-center">
            <label for="password">Password</label>
            <a class="auth-card__link" href="#" @click.prevent>Forgot password?</a>
          </div>
          <Password
            v-model="form.password"
            input-id="password"
            :feedback="false"
            toggle-mask
            :invalid="!!errors.password"
            placeholder="••••••••"
            :input-props="{ autocomplete: 'current-password' }"
          />
          <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
        </div>

        <div class="flex align-items-center gap-2 mb-4">
          <Checkbox v-model="form.remember" input-id="remember" binary />
          <label for="remember" class="text-sm">Remember this device for 30 days</label>
        </div>

        <Button
          type="submit"
          label="Sign In"
          icon="pi pi-arrow-right"
          icon-pos="right"
          class="w-full"
          :loading="submitting"
        />
      </form>

      <div class="auth-card__divider" />
      <p class="auth-card__footer">
        Don't have an account?
        <router-link :to="{ name: 'register' }" class="auth-card__link font-semibold">Request access</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-card {
  width: 100%;
  max-width: 26rem;
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
