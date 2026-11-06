import { flushPromises } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import {
  backendBaseUrl,
  createAuthenticatedSessionHandler,
  createTestServer,
  mountApplicationAtPath,
} from './support'

const server = createTestServer()

describe('grow logs', () => {
  it('shows active day and week, completed logs, latest photos, and gray fallbacks', async () => {
    vi.setSystemTime(new Date('2024-01-08T12:00:00.000Z'))
    server.use(
      createAuthenticatedSessionHandler({ timezone: 'Europe/London' }),
      http.get(`${backendBaseUrl}/logs`, () =>
        HttpResponse.json([
          {
            id: 10,
            name: 'Active with photo',
            plant_name: 'Tomato',
            started_at: '2024-01-01T14:00:00Z',
            ended_at: null,
            newest_entry_photo_id: 55,
            thumbnail_url: '/photos/55/thumbnail',
          },
          {
            id: 11,
            name: 'Completed without photo',
            plant_name: 'Basil',
            started_at: '2023-12-01T00:00:00Z',
            ended_at: '2023-12-20T00:00:00Z',
            newest_entry_photo_id: null,
          },
          {
            id: 12,
            name: 'Active without photo',
            plant_name: 'Mint',
            started_at: '2024-01-07T12:00:00Z',
            ended_at: null,
            newest_entry_photo_id: null,
          },
        ]),
      ),
    )

    const { wrapper } = await mountApplicationAtPath('/')
    await flushPromises()

    const galleryCards = wrapper.findAll('.grow-logs__card')
    expect(galleryCards).toHaveLength(3)
    expect(galleryCards[0].text()).toContain('Active with photo')
    expect(galleryCards[0].text()).toContain('Tomato')
    expect(galleryCards[0].text()).toContain('Day 8')
    expect(galleryCards[0].text()).toContain('Week 2')
    expect(galleryCards[0].find('img').attributes('src')).toBe(
      `${backendBaseUrl}/photos/55/thumbnail`,
    )
    expect(galleryCards[0].find('.grow-logs__thumbnail .grow-logs__card-details').exists()).toBe(
      true,
    )
    expect(galleryCards[1].text()).toContain('Completed without photo')
    expect(galleryCards[1].text()).not.toContain('Day')
    expect(galleryCards[1].text()).not.toContain('Week')
    expect(galleryCards[1].find('.grow-logs__thumbnail--empty').exists()).toBe(true)
    expect(galleryCards[2].find('.grow-logs__thumbnail--empty').exists()).toBe(true)
    expect(galleryCards[2].text()).toContain('Day 2')
    expect(galleryCards[2].text()).toContain('Week 1')
    expect(galleryCards[0].attributes('href')).toBe('/logs/10')
  })

  it('creates a grow log and opens its detail page', async () => {
    const receivedLogPayloads = []
    const createdLog = {
      ...createLogDetail([]),
      id: 99,
      name: 'Summer flower',
      plant_id: 7,
    }
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/plants`, () => HttpResponse.json([{ id: 7, name: 'Sunflower' }])),
      http.post(`${backendBaseUrl}/logs`, async ({ request }) => {
        receivedLogPayloads.push(await request.json())
        return HttpResponse.json(createdLog, { status: 201 })
      }),
      http.get(`${backendBaseUrl}/logs/99`, () => HttpResponse.json(createdLog)),
    )

    const { wrapper, router } = await mountApplicationAtPath('/logs/new')
    await wrapper.find('input[name="name"]').setValue('Summer flower')
    await wrapper.find('select[name="plant_id"]').setValue('7')
    await wrapper.find('input[name="started_at"]').setValue('2024-04-01')
    await wrapper.find('.grow-log-form').trigger('submit')
    await flushPromises()

    expect(receivedLogPayloads).toHaveLength(1)
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/logs/99'))
    await vi.waitFor(() => expect(wrapper.text()).toContain('Summer flower'))
  })

  it('reports validation errors when creating a grow log', async () => {
    const receivedLogPayloads = []
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/plants`, () => HttpResponse.json([{ id: 7, name: 'Sunflower' }])),
      http.post(`${backendBaseUrl}/logs`, async ({ request }) => {
        receivedLogPayloads.push(await request.json())
        return HttpResponse.json(
          {
            error: 'validation failed',
            fields: [{ field: 'name', message: 'name is already used' }],
          },
          { status: 422 },
        )
      }),
    )

    const { wrapper } = await mountApplicationAtPath('/logs/new')
    await wrapper.find('input[name="name"]').setValue('Summer flower')
    await wrapper.find('select[name="plant_id"]').setValue('7')
    await wrapper.find('input[name="started_at"]').setValue('2024-04-01')
    await wrapper.find('.grow-log-form').trigger('submit')
    await flushPromises()

    expect(receivedLogPayloads).toHaveLength(1)
    expect(receivedLogPayloads[0]).toMatchObject({
      plant_id: 7,
      name: 'Summer flower',
      started_at: '2024-04-01T00:00:00.000Z',
      ended_at: null,
    })
    expect(wrapper.text()).toContain('name is already used')
  })

  it('updates a grow log and opens its detail page', async () => {
    const receivedLogPayloads = []
    const growLog = createLogDetail([])
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/logs/42`, () => HttpResponse.json(growLog)),
      http.get(`${backendBaseUrl}/plants`, () => HttpResponse.json([{ id: 7, name: 'Tomato' }])),
      http.patch(`${backendBaseUrl}/logs/42`, async ({ request }) => {
        receivedLogPayloads.push(await request.json())
        return HttpResponse.json({ ...growLog, name: 'Updated summer grow' })
      }),
    )

    const { wrapper, router } = await mountApplicationAtPath('/logs/42/edit')
    await flushPromises()
    await wrapper.find('input[name="name"]').setValue('Updated summer grow')
    await wrapper.find('.grow-log-form').trigger('submit')
    await flushPromises()

    expect(receivedLogPayloads).toHaveLength(1)
    expect(receivedLogPayloads[0]).toMatchObject({ name: 'Updated summer grow', plant_id: 7 })
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/logs/42'))
  })

  it('deletes a grow log from its edit page and returns to the log list', async () => {
    const receivedDeletes = []
    const confirmDialog = vi.spyOn(window, 'confirm').mockReturnValue(true)
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/logs/42`, () => HttpResponse.json(createLogDetail([]))),
      http.get(`${backendBaseUrl}/plants`, () => HttpResponse.json([{ id: 7, name: 'Tomato' }])),
      http.delete(`${backendBaseUrl}/logs/42`, () => {
        receivedDeletes.push(42)
        return new HttpResponse(null, { status: 204 })
      }),
      http.get(`${backendBaseUrl}/logs`, () => HttpResponse.json([])),
    )

    const { wrapper, router } = await mountApplicationAtPath('/logs/42/edit')
    await flushPromises()
    expect(wrapper.find('.grow-log-form-page__delete').text()).toBe('Delete')
    await wrapper.find('.grow-log-form-page__delete').trigger('click')
    await flushPromises()

    expect(confirmDialog).toHaveBeenCalledOnce()
    expect(receivedDeletes).toEqual([42])
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/'))
  })
})

function createLogDetail(entries) {
  return {
    id: 42,
    plant_id: 7,
    plant_name: 'Tomato',
    name: 'Summer grow',
    started_at: '2024-01-01T00:00:00Z',
    description: null,
    ended_at: null,
    outcome: null,
    entries: entries.map((entry) => ({ photos: [], ...entry })),
  }
}
