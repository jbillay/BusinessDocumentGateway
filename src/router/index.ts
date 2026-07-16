import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, _from, savedPosition) {
    if (to.hash) return { el: to.hash, behavior: 'smooth', top: 72 }
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
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
})

router.beforeEach(async (to) => {
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
