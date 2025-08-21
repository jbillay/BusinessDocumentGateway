import { createRouter, createWebHistory } from 'vue-router'
import useAuthUser from '../composables/authUser'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
    },
    {
      path: '/email-confirmation',
      name: 'EmailConfirmation',
      component: () => import('../views/EmailConfirmationView.vue'),
    },
    {
      path: '/forgotPassword',
      name: 'ForgotPassword',
      component: () => import('../views/ForgotPasswordView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      name: 'Logout',
      path: '/logout',
      beforeEnter: async () => {
        const { logout } = useAuthUser()
        await logout()
        return { name: 'home' }
      },
    },
    {
      path: '/requests/new',
      name: 'newRequest',
      component: () => import('../views/NewRequest.vue'),
    },
    {
      path: '/request/:id',
      name: 'request-detail',
      component: () => import('../views/RequestDetailView.vue'),
      meta: {
        requiresAuth: true,
      },
    },
  ],
})

router.beforeEach((to) => {
  // here we check it the user is logged in
  // if they aren't and the route requries auth we redirect to the login page
  const { isLoggedIn } = useAuthUser()
  if (!isLoggedIn() && to.meta.requiresAuth && !Object.keys(to.query).includes('fromEmail')) {
    return { name: 'login' }
  }
})

export default router
