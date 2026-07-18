import { createRouter, createWebHistory } from 'vue-router'
import { hasStoredSession } from '@/lib/session'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, _from, savedPosition) {
    if (to.hash) {
      // Marketing views are lazy-loaded: the target section doesn't exist until
      // the async component has rendered, and vue-router gives up silently if
      // the element is missing. Poll for it before resolving (setTimeout, not
      // rAF — throttled/background renderers stall rAF). Sections carry
      // scroll-margin-top to clear the sticky header.
      const behavior: ScrollOptions['behavior'] = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth'
      return new Promise((resolve) => {
        const deadline = Date.now() + 3000
        const attempt = () => {
          if (document.querySelector(to.hash)) resolve({ el: to.hash, behavior })
          else if (Date.now() > deadline) resolve({ top: 0 })
          else setTimeout(attempt, 50)
        }
        attempt()
      })
    }
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
  routes: [
    {
      // Public marketing landing page. Signed-in users are sent to the dashboard.
      path: '/',
      name: 'landing',
      component: () => import('@/views/LandingView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/requests/new',
      name: 'request-new',
      component: () => import('@/views/RequestWizardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/requests/:id',
      name: 'request-detail',
      component: () => import('@/views/RequestDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/library',
      name: 'library',
      component: () => import('@/views/LibraryView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/portal-settings',
      name: 'portal-config',
      component: () => import('@/views/PortalConfigView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/billing',
      name: 'billing',
      component: () => import('@/views/BillingView.vue'),
      meta: { requiresAuth: true },
    },
    {
      // Public marketing page: works signed-in or out.
      path: '/pricing',
      name: 'pricing',
      component: () => import('@/views/PricingView.vue'),
    },
    // Public legal pages (accessible signed-in or out; linked from the footer).
    {
      path: '/legal/terms',
      name: 'terms',
      component: () => import('@/views/legal/TermsView.vue'),
    },
    {
      path: '/legal/privacy',
      name: 'privacy',
      component: () => import('@/views/legal/PrivacyView.vue'),
    },
    {
      path: '/legal/dpa',
      name: 'dpa',
      component: () => import('@/views/legal/DPAView.vue'),
    },
    {
      path: '/legal/cookies',
      name: 'cookie-policy',
      component: () => import('@/views/legal/CookiePolicyView.vue'),
    },
    {
      // Public client-facing upload portal, reached via unguessable token link.
      path: '/portal/:token',
      name: 'portal',
      component: () => import('@/views/PortalView.vue'),
    },
    {
      // Branded 404 on the marketing shell — a mistyped campaign link must not
      // dump prospects on the login screen.
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  // Anonymous visitors on public pages never need the auth/Supabase chunk —
  // skipping it keeps cold marketing visits light. hasStoredSession is only a
  // hint; when a token exists the auth store decides whether it's still valid.
  if (!to.meta.requiresAuth && !hasStoredSession()) return

  const { useAuthStore } = await import('@/stores/auth')
  const auth = useAuthStore()
  await auth.ensureReady()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router
