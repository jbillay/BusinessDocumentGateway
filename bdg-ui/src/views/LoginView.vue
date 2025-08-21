<template>
  <div class="auth-gradient">
    <div class="flex items-center justify-center min-h-screen">
      <div class="auth-card">
        <div class="flex flex-col items-center justify-center mb-2">
          <div class="brand-logo mx-auto mb-2">
            <img alt="user header" src="../assets/bdg_logo_whitebg.png" />
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6 mt-4 w-80">
          <div>
            <InputText
              v-model="formData.email"
              type="email"
              placeholder="Enter your email"
              class="w-full"
              required
            />
          </div>

          <div>
            <Password
              v-model="formData.password"
              placeholder="Enter your password"
              class="w-full"
              :toggleMask="true"
              :feedback="false"
              required
            />
          </div>

          <Button type="submit" label="Sign In" class="btn-primary w-full" />
        </form>

        <div class="mt-6 text-center">
          <p class="text-gray-600 text-sm">
            Don't have an account?
            <button
              @click="$router.push({ name: 'register' })"
              class="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { InputText, Button, Password } from 'primevue'
import { ref } from 'vue'
import useAuthUser from '../composables/authUser'
import { useRouter } from 'vue-router'

// Use necessary composables
const router = useRouter()
const { login } = useAuthUser()

const formData = ref({
  email: '',
  password: '',
})

const handleLogin = async () => {
  try {
    await login(formData.value)
    router.push({ name: 'home' })
  } catch (error) {
    alert(error.message)
  }
}
</script>
