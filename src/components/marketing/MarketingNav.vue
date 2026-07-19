<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import BrandLogo from '@/components/brand/BrandLogo.vue'
import { hasStoredSession } from '@/lib/session'

/**
 * Shared public marketing header (landing, pricing, legal pages). Glass, sticky,
 * auth-aware: signed-in visitors get a Dashboard shortcut instead of sign-in/up.
 * Gains a solid background once scrolled and highlights the section in view.
 * Uses hasStoredSession (not the auth store) and native elements (not PrimeVue)
 * so marketing pages stay light for anonymous visitors. Hash links render
 * through the RouterLink slot API so aria-current is driven by the scrollspy
 * instead of being stamped on every landing link at once.
 */
const authed = hasStoredSession()
const route = useRoute()
const mobileOpen = ref(false)

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
        <router-link :to="{ name: 'landing', hash: '#how' }" custom v-slot="{ href, navigate }">
          <a
            :href="href"
            :class="{ 'is-active': activeSection === 'how' }"
            :aria-current="activeSection === 'how' ? 'location' : undefined"
            @click="navigate"
            >How it works</a
          >
        </router-link>
        <router-link :to="{ name: 'landing', hash: '#features' }" custom v-slot="{ href, navigate }">
          <a
            :href="href"
            :class="{ 'is-active': activeSection === 'features' }"
            :aria-current="activeSection === 'features' ? 'location' : undefined"
            @click="navigate"
            >Features</a
          >
        </router-link>
        <router-link
          :to="{ name: 'pricing' }"
          :class="{ 'is-active': activeSection === 'pricing' || route.name === 'pricing' }"
          >Pricing</router-link
        >
        <router-link :to="{ name: 'landing', hash: '#contact' }" custom v-slot="{ href, navigate }">
          <a
            :href="href"
            :class="{ 'is-active': activeSection === 'contact' }"
            :aria-current="activeSection === 'contact' ? 'location' : undefined"
            @click="navigate"
            >Contact</a
          >
        </router-link>
      </nav>

      <div class="mkt-nav__actions">
        <template v-if="authed">
          <router-link class="bdg-btn bdg-btn--primary" :to="{ name: 'dashboard' }">
            Go to Dashboard <i class="pi pi-arrow-right" />
          </router-link>
        </template>
        <template v-else>
          <router-link class="bdg-btn bdg-btn--ghost mkt-nav__signin" :to="{ name: 'login' }">Sign in</router-link>
          <router-link class="bdg-btn bdg-btn--primary" :to="{ name: 'register' }">Start for free</router-link>
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
        <router-link :to="{ name: 'landing', hash: '#how' }" custom v-slot="{ href, navigate }">
          <a :href="href" @click="(e) => { mobileOpen = false; navigate(e) }">How it works</a>
        </router-link>
        <router-link :to="{ name: 'landing', hash: '#features' }" custom v-slot="{ href, navigate }">
          <a :href="href" @click="(e) => { mobileOpen = false; navigate(e) }">Features</a>
        </router-link>
        <router-link :to="{ name: 'pricing' }" @click="mobileOpen = false">Pricing</router-link>
        <router-link :to="{ name: 'landing', hash: '#contact' }" custom v-slot="{ href, navigate }">
          <a :href="href" @click="(e) => { mobileOpen = false; navigate(e) }">Contact</a>
        </router-link>
        <div class="mkt-nav__mobile-actions">
          <template v-if="authed">
            <router-link class="bdg-btn bdg-btn--primary bdg-btn--block" :to="{ name: 'dashboard' }" @click="mobileOpen = false">
              Go to Dashboard
            </router-link>
          </template>
          <template v-else>
            <router-link class="bdg-btn bdg-btn--outlined bdg-btn--block" :to="{ name: 'login' }" @click="mobileOpen = false">
              Sign in
            </router-link>
            <router-link class="bdg-btn bdg-btn--primary bdg-btn--block" :to="{ name: 'register' }" @click="mobileOpen = false">
              Start for free
            </router-link>
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
  gap: 1.25rem;
  margin: 0 auto;
}
.mkt-nav__links a {
  /* Padded to a ≥40px hit area (WCAG 2.5.8); gap shrinks to keep the rhythm. */
  display: inline-block;
  padding: 0.7rem 0.25rem;
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
