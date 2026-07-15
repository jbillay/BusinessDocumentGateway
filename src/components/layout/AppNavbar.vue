<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from 'primevue/avatar'
import Menu from 'primevue/menu'
import Button from 'primevue/button'
import BrandLogo from '@/components/brand/BrandLogo.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const menu = ref<InstanceType<typeof Menu>>()

const menuItems = [
  {
    label: 'Profile',
    icon: 'pi pi-user',
    command: () => router.push({ name: 'profile' }),
  },
  {
    label: 'Document Library',
    icon: 'pi pi-book',
    command: () => router.push({ name: 'library' }),
  },
  {
    label: 'Portal Settings',
    icon: 'pi pi-palette',
    command: () => router.push({ name: 'portal-config' }),
  },
  {
    label: 'Plan & Billing',
    icon: 'pi pi-credit-card',
    command: () => router.push({ name: 'billing' }),
  },
  { separator: true },
  {
    label: 'Sign out',
    icon: 'pi pi-sign-out',
    command: async () => {
      await auth.signOut()
      router.push({ name: 'login' })
    },
  },
]
</script>

<template>
  <header class="app-navbar bdg-glass">
    <div class="app-navbar__inner">
      <router-link :to="{ name: 'dashboard' }" class="app-navbar__brand">
        <BrandLogo :size="30" />
      </router-link>
      <div class="app-navbar__actions">
        <slot name="actions" />
        <Button
          class="app-navbar__user"
          text
          severity="secondary"
          @click="menu?.toggle($event)"
          aria-haspopup="true"
          aria-controls="user-menu"
        >
          <Avatar
            :label="auth.initials"
            shape="circle"
            style="background: var(--bdg-gradient); color: #fff; font-weight: 600"
          />
          <span class="app-navbar__name">{{ auth.displayName }}</span>
          <i class="pi pi-angle-down" style="font-size: 0.8rem" />
        </Button>
        <Menu ref="menu" id="user-menu" :model="menuItems" popup />
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-navbar {
  position: sticky;
  top: 0;
  z-index: 100;
}
.app-navbar__inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0.625rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.app-navbar__brand {
  text-decoration: none;
}
.app-navbar__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.app-navbar__user {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}
.app-navbar__name {
  font-weight: 600;
  color: var(--bdg-deep);
}
@media (max-width: 640px) {
  .app-navbar__name {
    display: none;
  }
}
</style>
