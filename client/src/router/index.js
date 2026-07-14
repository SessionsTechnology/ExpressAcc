import { createRouter, createWebHistory } from 'vue-router'
import { api } from '../lib/api.js'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', name: 'start', component: () => import('../views/StartView.vue') },
    { path: '/setup', name: 'setup', component: () => import('../views/SetupView.vue') },
    { path: '/admin/login', name: 'admin-login', component: () => import('../views/AdminLoginView.vue') },
    { path: '/admin', name: 'admin', component: () => import('../views/AdminView.vue') },
    { path: '/settings', name: 'settings', component: () => import('../views/SettingsView.vue') },
    { path: '/family/login', name: 'family-login', component: () => import('../views/FamilyLoginView.vue') },
    { path: '/checkout', name: 'checkout', component: () => import('../views/CheckoutView.vue'), meta: { familySpace: true } },
    { path: '/user/:id', name: 'user', component: () => import('../views/UserView.vue'), meta: { familySpace: true } },
    { path: '/about', name: 'about', component: () => import('../views/AboutView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.familySpace) return true
  try {
    const status = await api('/status')
    if (!status.familySpaceProtected) return true
    await api('/family/me')
    return true
  } catch (exception) {
    if (exception.status === 401) return { name: 'family-login', query: { redirect: to.fullPath } }
    return true
  }
})

export default router
