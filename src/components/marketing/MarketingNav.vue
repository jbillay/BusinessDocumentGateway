<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import BrandLogo from '@/components/brand/BrandLogo.vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Shared public marketing header (landing, pricing, legal pages). Glass, sticky,
 * auth-aware: signed-in visitors get a Dashboard shortcut instead of sign-in/up.
 */
const auth = useAuthStore()
const router = useRouter()
const mobileOpen = ref(false)

function go(to: Parameters<typeof router.push>[0]) {
  mobileOpen.value = false
  router.push(to)
}
</script>

<template>
  <header class="mkt-nav bdg-glass">
    <div class="mkt-nav__inner">
      <router-link :to="{ name: 'landing' }" class="mkt-nav__brand" aria-label="Business Document Gateway home">
        <BrandLogo :size="30" />
      </router-link>

      <nav class="mkt-nav__links" aria-label="Primary">
        <router-link :to="{ name: 'landing', hash: '#features' }">Features</router-link>
        <router-link :to="{ name: 'landing', hash: '#how' }">How it works</router-link>
        <router-link :to="{ name: 'pricing' }">Pricing</router-link>
        <router-link :to="{ name: 'landing', hash: '#contact' }">Contact</router-link>
      </nav>

      <div class="mkt-nav__actions">
        <template v-if="auth.isAuthenticated">
          <Button label="Go to Dashboard" icon="pi pi-arrow-right" icon-pos="right" @click="go({ name: 'dashboard' })" />
        </template>
        <template v-else>
          <Button label="Sign in" text severity="secondary" class="mkt-nav__signin" @click="go({ name: 'login' })" />
          <Button label="Get started" @click="go({ name: 'register' })" />
        </template>
      </div>

      <button
        class="mkt-nav__toggle"
        :aria-expanded="mobileOpen"
        aria-label="Menu"
        @click="mobileOpen = !mobileOpen"
      >
        <i :class="mobileOpen ? 'pi pi-times' : 'pi pi-bars'" />
      </button>
    </div>

    <Transition name="mkt-menu">
      <nav v-if="mobileOpen" class="mkt-nav__mobile" aria-label="Mobile">
        <router-link :to="{ name: 'landing', hash: '#features' }" @click="mobileOpen = false">Features</router-link>
        <router-link :to="{ name: 'landing', hash: '#how' }" @click="mobileOpen = false">How it works</router-link>
        <router-link :to="{ name: 'pricing' }" @click="mobileOpen = false">Pricing</router-link>
        <router-link :to="{ name: 'landing', hash: '#contact' }" @click="mobileOpen = false">Contact</router-link>
        <div class="mkt-nav__mobile-actions">
          <template v-if="auth.isAuthenticated">
            <Button label="Go to Dashboard" class="w-full" @click="go({ name: 'dashboard' })" />
          </template>
          <template v-else>
            <Button label="Sign in" outlined class="w-full" @click="go({ name: 'login' })" />
            <Button label="Get started" class="w-full" @click="go({ name: 'register' })" />
          </template>
        </div>
      </nav>
    </Transition>
  </header>
</template>

<style scoped>
.mkt-nav {
  position: sticky;
  top: 0;
  z-index: 100;
}
.mkt-nav__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.mkt-nav__brand {
  text-decoration: none;
  flex-shrink: 0;
}
.mkt-nav__links {
  display: flex;
  align-items: center;
  gap: 1.75rem;
  margin: 0 auto;
}
.mkt-nav__links a {
  color: #475569;
  text-decoration: none;
  font-size: 0.925rem;
  font-weight: 500;
  transition: color 0.15s ease;
}
.mkt-nav__links a:hover {
  color: var(--bdg-deep);
}
.mkt-nav__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
.mkt-nav__toggle {
  display: none;
  margin-left: auto;
  background: transparent;
  border: none;
  color: var(--bdg-deep);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
}
.mkt-nav__mobile {
  display: none;
}
.mkt-nav__mobile-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.mkt-menu-enter-active,
.mkt-menu-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.mkt-menu-enter-from,
.mkt-menu-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 860px) {
  .mkt-nav__links,
  .mkt-nav__actions {
    display: none;
  }
  .mkt-nav__toggle {
    display: inline-flex;
  }
  .mkt-nav__mobile {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem 1.5rem 1.25rem;
    border-top: 1px solid rgba(226, 232, 240, 0.6);
  }
  .mkt-nav__mobile a {
    color: var(--bdg-deep);
    text-decoration: none;
    font-weight: 500;
    padding: 0.625rem 0;
  }
}
</style>
