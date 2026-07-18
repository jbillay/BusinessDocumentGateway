<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import BrandLogo from '@/components/brand/BrandLogo.vue'
import { hasStoredSession } from '@/lib/session'

/**
 * Shared public marketing header (landing, pricing, legal pages). Glass, sticky,
 * auth-aware: signed-in visitors get a Dashboard shortcut instead of sign-in/up.
 * Gains a solid background once scrolled and highlights the section in view.
 * Uses hasStoredSession (not the auth store) so marketing pages don't pull the
 * Supabase chunk for anonymous visitors.
 */
const authed = hasStoredSession()
const router = useRouter()
const route = useRoute()
const mobileOpen = ref(false)

function go(to: Parameters<typeof router.push>[0]) {
  mobileOpen.value = false
  router.push(to)
}

// Scrolled state + scrollspy. Plain scroll listener (not IntersectionObserver /
// rAF, which stall in throttled renderers); cheap enough at 4 lookups per event.
const scrolled = ref(false)
const activeSection = ref<string | null>(null)
const SPY_SECTIONS = ['how', 'features', 'pricing', 'contact']

function onScroll() {
  scrolled.value = window.scrollY > 8
  if (route.name !== 'landing') {
    activeSection.value = null
    return
  }
  let current: string | null = null
  for (const id of SPY_SECTIONS) {
    const el = document.getElementById(id)
    if (el && el.getBoundingClientRect().top <= 100) current = id
  }
  activeSection.value = current
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <header class="mkt-nav bdg-glass" :class="{ 'is-scrolled': scrolled }">
    <div class="mkt-nav__inner">
      <router-link :to="{ name: 'landing' }" class="mkt-nav__brand" aria-label="Business Document Gateway home">
        <BrandLogo :size="30" />
      </router-link>

      <!-- Link order mirrors the landing page's section order. -->
      <nav class="mkt-nav__links" aria-label="Primary">
        <router-link
          :to="{ name: 'landing', hash: '#how' }"
          :class="{ 'is-active': activeSection === 'how' }"
          :aria-current="activeSection === 'how' ? 'location' : undefined"
          >How it works</router-link
        >
        <router-link
          :to="{ name: 'landing', hash: '#features' }"
          :class="{ 'is-active': activeSection === 'features' }"
          :aria-current="activeSection === 'features' ? 'location' : undefined"
          >Features</router-link
        >
        <router-link
          :to="{ name: 'pricing' }"
          :class="{ 'is-active': activeSection === 'pricing' || route.name === 'pricing' }"
          >Pricing</router-link
        >
        <router-link
          :to="{ name: 'landing', hash: '#contact' }"
          :class="{ 'is-active': activeSection === 'contact' }"
          :aria-current="activeSection === 'contact' ? 'location' : undefined"
          >Contact</router-link
        >
      </nav>

      <div class="mkt-nav__actions">
        <template v-if="authed">
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
        <router-link :to="{ name: 'landing', hash: '#how' }" @click="mobileOpen = false">How it works</router-link>
        <router-link :to="{ name: 'landing', hash: '#features' }" @click="mobileOpen = false">Features</router-link>
        <router-link :to="{ name: 'pricing' }" @click="mobileOpen = false">Pricing</router-link>
        <router-link :to="{ name: 'landing', hash: '#contact' }" @click="mobileOpen = false">Contact</router-link>
        <div class="mkt-nav__mobile-actions">
          <template v-if="authed">
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
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}
/* Solidify once content scrolls beneath — 72% glass lets dense sections bleed
   through the links at near-full contrast. */
.mkt-nav.is-scrolled {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 1px 12px rgba(15, 23, 42, 0.07);
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
.mkt-nav__links a.is-active {
  color: var(--bdg-blue);
}
.mkt-nav__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
.mkt-nav__toggle {
  display: none;
  /* 44px touch target (WCAG 2.5.5) with the icon centred inside. */
  width: 2.75rem;
  height: 2.75rem;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  color: var(--bdg-deep);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
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

@media (prefers-reduced-motion: no-preference) {
  .mkt-menu-enter-active,
  .mkt-menu-leave-active {
    transition: opacity 0.18s ease, transform 0.18s ease;
  }
}
.mkt-menu-enter-from,
.mkt-menu-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 860px) {
  .mkt-nav__links {
    display: none;
  }
  /* Keep the primary CTA visible on mobile; Sign in moves into the menu. */
  .mkt-nav__actions {
    margin-left: auto;
    gap: 0.25rem;
  }
  .mkt-nav__signin {
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
/* Below ~480px the wordmark + CTA + toggle no longer fit side by side; the
   menu still carries both CTAs. */
@media (max-width: 480px) {
  .mkt-nav__actions {
    display: none;
  }
  .mkt-nav__toggle {
    margin-left: auto;
  }
}
</style>
