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

describe('plants', () => {
  it('shows the plant list', async () => {
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/plants`, () =>
        HttpResponse.json([
          { id: 71, name: 'Rosemary' },
          { id: 72, name: 'Basil' },
        ]),
      ),
    )

    const { wrapper } = await mountApplicationAtPath('/plants')
    await flushPromises()

    const plantLinks = wrapper.findAll('.plant-list__link')
    expect(plantLinks.map((plantLink) => plantLink.text())).toEqual(['Rosemary', 'Basil'])
  })

  it('creates a plant and shows it in the list', async () => {
    const plantRecords = []
    const receivedCreateNames = []
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/plants`, () => HttpResponse.json(plantRecords)),
      http.post(`${backendBaseUrl}/plants`, async ({ request }) => {
        const createPayload = await request.json()
        receivedCreateNames.push(createPayload.name)
        plantRecords.push({ id: 71, name: createPayload.name })
        return HttpResponse.json(plantRecords.at(-1), { status: 201 })
      }),
    )

    const { wrapper } = await mountApplicationAtPath('/plants')
    await flushPromises()
    await wrapper.find('.plant-list__form input').setValue('Rosemary')
    await wrapper.find('.plant-list__form').trigger('submit')
    await flushPromises()

    expect(receivedCreateNames).toEqual(['Rosemary'])
    await vi.waitFor(() => expect(wrapper.find('.plant-list__link').text()).toBe('Rosemary'))
  })

  it('renames a plant and shows its updated name', async () => {
    const plantRecords = [{ id: 71, name: 'Rosemary' }]
    const receivedUpdateNames = []
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/plants`, () => HttpResponse.json(plantRecords)),
      http.patch(`${backendBaseUrl}/plants/71`, async ({ request }) => {
        const updatePayload = await request.json()
        receivedUpdateNames.push(updatePayload.name)
        plantRecords[0].name = updatePayload.name
        return HttpResponse.json(plantRecords[0])
      }),
    )

    const { wrapper } = await mountApplicationAtPath('/plants')
    await flushPromises()
    await wrapper.find('.plant-list__edit').trigger('click')
    const plantForm = wrapper.find('.plant-list__form')
    await plantForm.find('input').setValue('Upright rosemary')
    await plantForm.trigger('submit')
    await flushPromises()

    expect(receivedUpdateNames).toEqual(['Upright rosemary'])
    await vi.waitFor(() =>
      expect(wrapper.find('.plant-list__link').text()).toBe('Upright rosemary'),
    )
  })

  it('deletes a plant without grow logs', async () => {
    const plantRecords = [{ id: 71, name: 'Rosemary' }]
    const receivedPlantDeletes = []
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/plants`, () => HttpResponse.json(plantRecords)),
      http.delete(`${backendBaseUrl}/plants/71`, () => {
        receivedPlantDeletes.push(71)
        plantRecords.splice(0, plantRecords.length)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { wrapper } = await mountApplicationAtPath('/plants')
    await flushPromises()
    expect(wrapper.find('.plant-list__link').text()).toBe('Rosemary')
    await wrapper.find('.plant-list__delete').trigger('click')
    await flushPromises()

    expect(receivedPlantDeletes).toEqual([71])
    await vi.waitFor(() => expect(wrapper.text()).toContain('No plants yet.'))
  })

  it('explains why a plant with grow logs cannot be deleted', async () => {
    const plantRecords = [{ id: 71, name: 'Rosemary' }]
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/plants`, () => HttpResponse.json(plantRecords)),
      http.delete(`${backendBaseUrl}/plants/71`, () =>
        HttpResponse.json({ error: 'conflict' }, { status: 409 }),
      ),
    )

    const { wrapper } = await mountApplicationAtPath('/plants')
    await flushPromises()
    await wrapper.find('.plant-list__delete').trigger('click')
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain('This plant cannot be deleted while it has grow logs.'),
    )
  })

  it('shows a plant’s grow logs with links to their details', async () => {
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/plants/71`, () =>
        HttpResponse.json({
          id: 71,
          name: 'Rosemary',
          grow_logs: [
            {
              id: 92,
              name: 'Kitchen garden',
              started_at: '2024-01-01T00:00:00Z',
              ended_at: null,
            },
          ],
        }),
      ),
    )

    const { wrapper } = await mountApplicationAtPath('/plants/71')
    await flushPromises()

    expect(wrapper.text()).toContain('Rosemary')
    expect(wrapper.text()).toContain('Kitchen garden')
    expect(wrapper.find('.plant-detail__delete').text()).toBe('Delete')
    expect(wrapper.find('.plant-detail__log-list a').attributes('href')).toBe('/logs/92')
  })
})
