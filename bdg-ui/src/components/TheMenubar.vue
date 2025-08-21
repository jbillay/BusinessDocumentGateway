<template>
  <!-- Fixed Navbar -->
  <Menubar>
    <template #start>
      <!-- Logo -->
      <div class="flex items-center">
        <RouterLink to="/"
          ><img
            src="../assets/bdg_ico_logo.png"
            alt="Business Document Gateway"
            class="h-8 w-auto px-4"
        /></RouterLink>
        <span class="text-xl font-semibold text-gray-900">Business Document Gateway</span>
      </div>
    </template>
    <template #end>
      <!-- User Menu -->
      <div class="flex items-center space-x-4">
        <div class="flex items-center gap-2">
          <Button
            v-if="props.new"
            variant="ghost"
            size="sm"
            icon="pi pi-plus"
            label="New Request"
            class="text-blue-600 hover:text-blue-700"
            @click="createNewRequest"
          />
          <InputText placeholder="Search" type="text" class="w-32 sm:w-auto" />
          <Avatar
            :label="userInitials"
            class="mr-2"
            shape="circle"
            @click="userMenuToggle"
            aria-haspopup="true"
            aria-controls="overlay_tmenu"
          />
          <TieredMenu ref="menu" id="overlay_tmenu" :model="items" popup />
        </div>
      </div>
    </template>
  </Menubar>
</template>

<script setup>
import { InputText, Button, Avatar, Menubar, TieredMenu } from 'primevue'
import { ref } from 'vue'
import useAuthUser from '../composables/authUser'
import { useRouter } from 'vue-router'
import { userSessionStore } from '../stores/userSession'
import { useToast } from 'primevue/usetoast'

const props = defineProps(['new'])

const router = useRouter()
const userSession = userSessionStore()

const userInitials = ref(userSession.getUserInitials())

const toast = useToast()

const menu = ref()
const items = ref([
  {
    label: 'Profile',
    icon: 'pi pi-user',
    command: () => router.push('/profile'),
  },
  {
    separator: true,
  },
  {
    label: 'Logout',
    icon: 'pi pi-logout',
    command: () => userLogout(),
  },
])

const createNewRequest = () => {
  router.push({ name: 'newRequest' })
}

const userMenuToggle = (event) => {
  menu.value.toggle(event)
}

const userLogout = async () => {
  const { logout } = useAuthUser()
  try {
    await logout()
    router.push('login')
  } catch (error) {
    console.error('Logout error:', error)
    toast.add({
      severity: 'error',
      summary: 'Logout Failed',
      detail: 'An error occurred while logging out. Please try again.',
      life: 8000,
    })
  }
}
</script>
