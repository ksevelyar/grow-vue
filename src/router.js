import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const GrowLogs = () => import('@/views/GrowLogs.vue')
const GrowLogNew = () => import('@/views/GrowLogNew.vue')
const GrowLogEdit = () => import('@/views/GrowLogEdit.vue')
const GrowLog = () => import('@/views/GrowLog.vue')
const PlantList = () => import('@/views/PlantList.vue')
const PlantDetail = () => import('@/views/PlantDetail.vue')
const UserLogin = () => import('@/views/UserLogin.vue')
const UserRegistration = () => import('@/views/UserRegistration.vue')

const routes = [
  {
    path: '/login',
    name: 'UserLogin',
    component: UserLogin,
  },
  {
    path: '/register',
    name: 'UserRegistration',
    component: UserRegistration,
  },
  {
    path: '/',
    name: 'GrowLogs',
    component: GrowLogs,
    meta: { label: 'Logs' },
  },
  {
    path: '/logs/new',
    name: 'GrowLogNew',
    component: GrowLogNew,
    meta: { label: 'New log' },
  },
  {
    path: '/logs/:log_id/edit',
    name: 'GrowLogEdit',
    component: GrowLogEdit,
    meta: { label: 'Edit log' },
  },
  {
    path: '/logs/:log_id',
    name: 'GrowLogDetail',
    component: GrowLog,
    meta: { label: 'Log detail' },
  },
  {
    path: '/plants',
    name: 'Plants',
    component: PlantList,
    meta: { label: 'Plants' },
  },
  {
    path: '/plants/:plant_id',
    name: 'PlantDetail',
    component: PlantDetail,
    meta: { label: 'Plant detail' },
  },
]

export function createApplicationRouter() {
  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
  })

  router.beforeEach(guardProtectedRoutes)

  return router
}

async function guardProtectedRoutes(destinationRoute) {
  if (destinationRoute.name === 'UserLogin' || destinationRoute.name === 'UserRegistration') {
    return true
  }

  const userStore = useUserStore()

  try {
    await userStore.get()
    return true
  } catch (sessionError) {
    if (sessionError?.status === 401) {
      return { name: 'UserLogin' }
    }

    console.error(sessionError)
    return false
  }
}
