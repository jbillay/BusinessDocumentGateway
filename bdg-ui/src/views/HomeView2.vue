<template>
  <div class="flex flex-col min-h-screen bg-gray-50 text-gray-800">
    <!-- Fixed Navbar with Gradient -->
    <Menubar>
      <template #start>
        <img
          src="../assets/bdg_ico_logo.png"
          alt="Business Document Gateway Logo"
          class="h-8 w-auto"
        />
      </template>
      <template #items>
        <div>
          <span style="font-size: 1.125rem; font-weight: 600"
            >Good morning, {{ user.firstName }}</span
          >
        </div>
      </template>
      <template #end>
        <div class="flex flex-wrap justify-center gap-4">
          <InputText placeholder="Search" type="text" class="w-32 sm:w-auto" />
          <Button icon="pi pi-bell" severity="info" rounded variant="text" />
          <Avatar :label="userInitials" class="mr-2" size="large" shape="circle" />
          <Button
            icon="pi pi-sign-out"
            severity="info"
            rounded
            variant="text"
            @click="userLogout"
          ></Button>
        </div>
      </template>
    </Menubar>

    <!-- Main Content -->
    <main class="flex-1 container mx-auto px-6 pt-20 pb-16">
      <h2 class="text-2xl font-semibold mb-4">Document Requests</h2>

      <DataTable :value="documentRequests" responsiveLayout="scroll" class="shadow rounded-lg">
        <Column field="name" header="Name"></Column>
        <Column field="expectedDate" header="Expected Date"></Column>

        <!-- Status Column with Badge -->
        <Column header="Status">
          <template #body="slotProps">
            <span
              class="px-2 py-1 text-xs font-semibold rounded-full"
              :class="statusBadgeClass(slotProps.data.status)"
            >
              {{ slotProps.data.status }}
            </span>
          </template>
        </Column>

        <!-- Client Email -->
        <Column field="clientEmail" header="Client Email"></Column>

        <!-- Progress Column -->
        <Column header="Progress">
          <template #body="slotProps">
            <ProgressBar
              :value="slotProps.data.progress"
              :showValue="true"
              style="height: 1.25rem"
            ></ProgressBar>
          </template>
        </Column>
      </DataTable>
    </main>

    <!-- Fixed Footer -->
    <footer class="bg-white border-t shadow-sm py-3 text-center fixed bottom-0 w-full">
      <span class="text-sm text-gray-500">
        © {{ new Date().getFullYear() }} Business Document Gateway — All Rights Reserved
      </span>
    </footer>
  </div>
</template>

<script setup>
import { Button, DataTable, Column, InputText, Avatar, ProgressBar, Menubar } from 'primevue'
import { ref } from 'vue'
import useAuthUser from '../composables/authUser'
import { useRouter } from 'vue-router'
import { userSessionStore } from '../stores/userSession'

const router = useRouter()
const userSession = userSessionStore()

const user = ref(userSession.getUser())
const userInitials = ref(userSession.getUserInitials())

// Dummy data (replace with Supabase fetch)
const documentRequests = ref([
  {
    name: 'KYC Documents',
    expectedDate: '2025-08-20',
    status: 'Pending',
    clientEmail: 'client1@email.com',
    progress: 0,
  },
  {
    name: 'Financial Statements',
    expectedDate: '2025-08-25',
    status: 'In Progress',
    clientEmail: 'client2@email.com',
    progress: 60,
  },
  {
    name: 'Tax Forms',
    expectedDate: '2025-08-18',
    status: 'Completed',
    clientEmail: 'client3@email.com',
    progress: 100,
  },
])

// Function to style status badges
const statusBadgeClass = (status) => {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'In Progress':
      return 'bg-blue-100 text-blue-800'
    case 'Completed':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function userLogout() {
  const { logout } = useAuthUser()
  logout()
    .then(() => {
      console.log('User logged out successfully')
      router.push('login')
    })
    .catch((error) => {
      console.error('Error logging out:', error)
    })
}
</script>

<style scoped>
/* Override PrimeVue menubar colors in the header */
:deep(.p-menubar) {
  background: transparent !important;
}
:deep(.p-menubar .p-menuitem-link) {
  color: white !important;
}
:deep(.p-menubar .pi) {
  color: white !important;
}
</style>
