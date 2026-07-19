<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Avatar from 'primevue/avatar'
import Menu from 'primevue/menu'
import Button from 'primevue/button'
import BrandLogo from '@/components/brand/BrandLogo.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const menu = ref<InstanceType<typeof Menu>>()

/** Primary app destinations live in the header; the avatar menu keeps identity
 * actions. Below 860px the links hide and the menu carries the destinations. */
const NAV_LINKS = [
  { label: 'Dashboard', route: 'dashboard', icon: 'pi pi-home' },
  { label: 'Library', route: 'library', icon: 'pi pi-book' },
  { label: 'Portal', route: 'portal-config', icon: 'pi pi-palette' },
  { label: 'Billing', route: 'billing', icon: 'pi pi-credit-card' },
]

const narrowQuery = window.matchMedia('(max-width: 860px)')
const isNarrow = ref(narrowQuery.matches)
const onNarrowChange = (e: MediaQueryListEvent) => (isNarrow.value = e.matches)
narrowQuery.addEventListener('change', onNarrowChange)
onBeforeUnmount(() => narrowQuery.removeEventListener('change', onNarrowChange))

const menuItems = computed(() => [
  ...(isNarrow.value
    ? [
        ...NAV_LINKS.map((link) => ({
          label: link.label,
          icon: link.icon,
          command: () => router.push({ name: link.route }),
        })),
        { separator: true },
      ]
    : []),
  {
    label: 'Profile',
    icon: 'pi pi-user',
    command: () => router.push({ name: 'profile' }),
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
])
</script>

<template>
  <header class="app-navbar bdg-glass">
    <div class="app-navbar__inner">
      <router-link :to="{ name: 'dashboard' }" class="app-navbar__brand">
        <BrandLogo :size="30" />
      </router-link>

      <nav class="app-navbar__links" aria-label="Application">
        <router-link
          v-for="link in NAV_LINKS"
          :key="link.route"
          :to="{ name: link.route }"
          class="app-navbar__link"
          :class="{ 'is-active': route.name === link.route }"
          :aria-current="route.name === link.route ? 'page' : undefined"
        >
          {{ link.label }}
        </router-link>
      </nav>

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
  padding: 0.375rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.app-navbar__brand {
  text-decoration: none;
  flex-shrink: 0;
}
.app-navbar__links {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
.app-navbar__link {
  display: inline-block;
  padding: 0.75rem 0.75rem;
  border-radius: 0.5rem;
  color: #475569;
  text-decoration: none;
  font-size: 0.925rem;
  font-weight: 500;
  transition: color 0.15s ease, background-color 0.15s ease;
}
.app-navbar__link:hover {
  color: var(--bdg-deep);
  background: rgba(15, 23, 42, 0.045);
}
.app-navbar__link.is-active {
  color: var(--bdg-blue);
  background: rgba(59, 130, 246, 0.09);
}
.app-navbar__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
  flex-shrink: 0;
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
@media (max-width: 860px) {
  .app-navbar__links {
    display: none;
  }
}
@media (max-width: 640px) {
  .app-navbar__name {
    display: none;
  }
}
</style>
