import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', name: 'start', component: () => import('../views/StartView.vue') },
    { path: '/setup', name: 'setup', component: () => import('../views/SetupView.vue') },
    { path: '/admin/login', name: 'admin-login', component: () => import('../views/AdminLoginView.vue') },
    { path: '/admin', name: 'admin', component: () => import('../views/AdminView.vue') },
    { path: '/settings', name: 'settings', component: () => import('../views/SettingsView.vue') },
    { path: '/checkout', name: 'checkout', component: () => import('../views/CheckoutView.vue') },
    { path: '/user/:id', name: 'user', component: () => import('../views/UserView.vue') },
    { path: '/about', name: 'about', component: () => import('../views/AboutView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
