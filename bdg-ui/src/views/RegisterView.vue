<template>
  <div class="auth-gradient">
    <div class="flex items-center justify-center min-h-screen">
      <div class="auth-card">
        <div class="flex flex-col items-center justify-center mb-2">
          <div class="brand-logo mx-auto mb-2">
            <img alt="user header" src="../assets/bdg_logo_whitebg.png" />
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p class="text-gray-600 text-sm">Join Business Document Gateway today</p>
        </div>
        <Toast />

        <form @submit.prevent="handleRegister" class="space-y-6 mt-4 w-80">
          <div>
            <InputText
              v-model="formData.firstName"
              type="text"
              placeholder="Enter your first name"
              class="w-full"
              required
            />
          </div>
          <div>
            <InputText
              v-model="formData.lastName"
              type="text"
              placeholder="Enter your last name"
              class="w-full"
              required
            />
          </div>

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
              required
            >
              <template #header>
                <div class="font-semibold text-xm mb-4">Password Criteria</div>
              </template>
              <template #footer>
                <Divider />
                <ul class="pl-2 my-0 leading-normal text-sm">
                  <li>Minimum 8 characters</li>
                  <li>At least one lowercase</li>
                  <li>At least one uppercase</li>
                  <li>At least one numeric</li>
                  <li>At least one symbols</li>
                </ul>
              </template>
            </Password>
          </div>

          <div>
            <Password
              v-model="formData.passwordRepeat"
              placeholder="Re-Enter your password"
              class="w-full"
              :toggleMask="true"
              required
            />
          </div>

          <Button type="submit" label="Create Account" class="btn-primary w-full" />
        </form>

        <div class="mt-6 text-center">
          <p class="text-gray-600 text-sm">
            Already have an account?
            <button
              @click="$router.push({ name: 'login' })"
              class="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { InputText, Button, Password, Divider } from 'primevue'
import { ref } from 'vue'
import useAuthUser from '../composables/authUser'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'

const toast = useToast()
const router = useRouter()
const { register } = useAuthUser()

const formData = ref({
  email: '',
  password: '',
  passwordRepeat: '',
  firstName: '',
  lastName: '',
})

const handleRegister = async () => {
  try {
    if (formData.value.password !== formData.value.passwordRepeat) {
      throw new Error('Passwords do not match')
    }
    const userData = {
      email: formData.value.email,
      password: formData.value.password,
      firstName: formData.value.firstName,
      lastName: formData.value.lastName,
    }
    // use the register method from the AuthUser composable
    await register(userData)

    // and redirect to a EmailConfirmation page the will instruct
    // the user to confirm they're email address
    router.push({
      name: 'EmailConfirmation',
      query: { email: formData.value.email },
    })
  } catch (error) {
    formData.value = {
      email: '',
      password: '',
      passwordRepeat: '',
      firstName: '',
      lastName: '',
    }
    toast.add({ severity: 'warn', summary: 'Warning', detail: `${error}`, life: 8000 })
  }
}
</script>
