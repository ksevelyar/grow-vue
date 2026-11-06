import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import App from '@/App.vue'
import { createApplicationRouter } from '@/router'

export const backendBaseUrl = import.meta.env.VITE_BACK || 'http://grow.localhost:3000'

const mountedApplicationWrappers = new Set()

afterEach(() => {
  for (const mountedApplicationWrapper of mountedApplicationWrappers) {
    mountedApplicationWrapper.unmount()
  }

  mountedApplicationWrappers.clear()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

export function createTestServer() {
  const server = setupServer()

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  return server
}

export function createAuthenticatedSessionHandler(user = {}) {
  const authenticatedUser = {
    id: 12,
    email: 'grower@example.com',
    timezone: 'UTC',
    ...user,
  }

  return http.get(`${backendBaseUrl}/sessions/current`, () => HttpResponse.json(authenticatedUser))
}

export async function mountApplicationAtPath(routePath) {
  const pinia = createPinia()
  setActivePinia(pinia)

  const router = createApplicationRouter()
  await router.push(routePath)

  const wrapper = mount(App, {
    global: {
      plugins: [pinia, router],
    },
  })
  mountedApplicationWrappers.add(wrapper)
  await flushPromises()

  return { wrapper, router }
}
