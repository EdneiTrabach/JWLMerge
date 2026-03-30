import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../components/LayoutPublico.vue'),
    },
    // catch-all redirect to home
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
