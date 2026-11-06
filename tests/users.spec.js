import { flushPromises } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { expect, it, vi } from 'vitest'
import { useUserStore } from '@/stores/user'
import { backendBaseUrl, createTestServer, mountApplicationAtPath } from './support'

const server = createTestServer()

it.each(['/logs/new', '/logs/42', '/logs/42/edit', '/plants', '/plants/42'])(
  'redirects_unauthenticated_protected_route_to_login_from_%s',
  async (routePath) => {
    const receivedCurrentSessionRequests = interceptUnauthenticatedCurrentSessionRequests()
    const { wrapper, router } = await mountApplicationAtPath(routePath)

    expect(router.currentRoute.value.path).toBe('/login')
    expect(wrapper.find('.user-login').exists()).toBe(true)
    expect(receivedCurrentSessionRequests).toHaveLength(1)
  },
)

it('keeps_login_accessible_without_an_authenticated_session', async () => {
  const receivedCurrentSessionRequests = interceptUnauthenticatedCurrentSessionRequests()
  const { wrapper, router } = await mountApplicationAtPath('/login')

  expect(router.currentRoute.value.path).toBe('/login')
  expect(wrapper.find('.user-login').exists()).toBe(true)
  expect(receivedCurrentSessionRequests).toHaveLength(0)
})

it('keeps_registration_accessible_without_an_authenticated_session', async () => {
  const receivedCurrentSessionRequests = interceptUnauthenticatedCurrentSessionRequests()
  const { wrapper, router } = await mountApplicationAtPath('/register')

  expect(router.currentRoute.value.path).toBe('/register')
  expect(wrapper.find('.user-registration').exists()).toBe(true)
  expect(receivedCurrentSessionRequests).toHaveLength(0)
})

it('logs_in_without_parsing_the_empty_session_creation_response', async () => {
  const receivedLoginRequests = []
  const receivedCurrentSessionRequests = []
  const authenticatedUser = {
    id: 42,
    email: 'grower@example.com',
    timezone: 'Europe/London',
  }

  server.use(
    http.post(`${backendBaseUrl}/sessions`, async ({ request }) => {
      receivedLoginRequests.push(await request.json())
      return new HttpResponse(null, { status: 201 })
    }),
    http.get(`${backendBaseUrl}/sessions/current`, () => {
      receivedCurrentSessionRequests.push(true)
      return HttpResponse.json(authenticatedUser)
    }),
    http.get(`${backendBaseUrl}/logs`, () => HttpResponse.json([])),
  )

  const { wrapper, router } = await mountApplicationAtPath('/login')
  await wrapper.find('.user-login__email').setValue(authenticatedUser.email)
  await wrapper.find('.user-login__password').setValue('correct horse battery staple')
  await wrapper.find('.user-login').trigger('submit')
  await flushPromises()

  expect(receivedLoginRequests).toEqual([
    { email: authenticatedUser.email, password: 'correct horse battery staple' },
  ])
  expect(receivedCurrentSessionRequests).toHaveLength(1)
  expect(useUserStore().user).toMatchObject(authenticatedUser)
  await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/'))
  expect(wrapper.find('.grow-logs__title').text()).toBe('Logs')
  expect(wrapper.find('.user-header').text()).toContain('Logs')
  expect(wrapper.find('.user-header').text()).toContain('Plants')
})

it('stores_the_direct_json_response_from_registration', async () => {
  const receivedCurrentSessionRequests = []
  const registeredUser = {
    id: 84,
    email: 'new-grower@example.com',
    timezone: 'Europe/London',
  }

  server.use(
    http.post(`${backendBaseUrl}/users`, () => HttpResponse.json(registeredUser, { status: 201 })),
    http.get(`${backendBaseUrl}/sessions/current`, () => {
      receivedCurrentSessionRequests.push(true)
      return HttpResponse.json({ error: 'unauthorized' }, { status: 401 })
    }),
  )

  const { wrapper, router } = await mountApplicationAtPath('/register')
  await wrapper.find('.user-registration__email').setValue(registeredUser.email)
  await wrapper.find('.user-registration__handle').setValue('new-grower')
  await wrapper.find('.user-registration__password').setValue('correct horse battery staple')
  await wrapper.find('.user-registration__timezone').setValue(registeredUser.timezone)
  await wrapper.find('.user-registration').trigger('submit')
  await flushPromises()
  await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/login'))

  expect(receivedCurrentSessionRequests).toHaveLength(1)
  expect(useUserStore().user).toMatchObject(registeredUser)
})

function interceptUnauthenticatedCurrentSessionRequests() {
  const receivedCurrentSessionRequests = []

  server.use(
    http.get(`${backendBaseUrl}/sessions/current`, () => {
      receivedCurrentSessionRequests.push(true)
      return HttpResponse.json({ error: 'unauthorized' }, { status: 401 })
    }),
  )

  return receivedCurrentSessionRequests
}
