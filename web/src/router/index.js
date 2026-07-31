import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import LoginView from '../views/LoginView.vue'
import InspectionListView from '../views/InspectionListView.vue'
import NewInspectionView from '../views/NewInspectionView.vue'
import SummaryView from '../views/SummaryView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true, title: 'Login' } },
    { path: '/', name: 'inspections', component: InspectionListView, meta: { title: 'Inspections' } },
    { path: '/new', name: 'new', component: NewInspectionView, meta: { title: 'Log Defect' } },
    { path: '/summary', name: 'summary', component: SummaryView, meta: { title: 'Summary' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

const APP_NAME = 'Quality Inspection Tracker'

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isAuthed) return { name: 'login' }
  if (to.name === 'login' && auth.isAuthed) return { name: 'inspections' }
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - ${APP_NAME}` : APP_NAME
})

export default router
