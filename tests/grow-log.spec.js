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

describe('grow-log details and reports', () => {
  it('shows static log data, one current-date report form, and an edit link', async () => {
    vi.setSystemTime(new Date('2024-03-02T12:00:00.000Z'))
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/logs/42`, () =>
        HttpResponse.json({
          ...createLogDetail([]),
          description: 'Growing on the balcony',
          ended_at: '2024-03-01T00:00:00Z',
          outcome: 'Healthy harvest',
        }),
      ),
    )

    const { wrapper } = await mountApplicationAtPath('/logs/42')
    await flushPromises()

    expect(wrapper.find('.grow-log__summary').text()).toContain('Tomato')
    expect(wrapper.find('.grow-log__summary').text()).toContain('Growing on the balcony')
    expect(wrapper.find('.grow-log__summary').text()).toContain('Healthy harvest')
    expect(wrapper.findAll('.grow-log__report-form')).toHaveLength(1)
    expect(wrapper.find('.grow-log__report-form input[type="date"]').element.value).toBe(
      '2024-03-02',
    )
    expect(wrapper.find('.grow-log__report-form button').text()).toBe('Create')
    expect(wrapper.text()).not.toContain('Delete log')
    expect(wrapper.find('.grow-log__edit').attributes('href')).toBe('/logs/42/edit')
  })

  it('renders log entries newest first with day and week from the start date', async () => {
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/plants`, () => HttpResponse.json([])),
      http.get(`${backendBaseUrl}/logs/42`, () =>
        HttpResponse.json(
          createLogDetail([
            { id: 4, occurred_at: '2024-01-10T00:00:00Z', stage: 'bloom', description: 'Flowers' },
            { id: 3, occurred_at: '2024-01-03T00:00:00Z', stage: 'vegetation', description: null },
            { id: 2, occurred_at: '2024-01-02T00:00:00Z', stage: 'seedling', description: null },
            {
              id: 1,
              occurred_at: '2024-01-01T00:00:00Z',
              stage: 'germination',
              description: 'First day',
            },
          ]),
        ),
      ),
    )

    const { wrapper } = await mountApplicationAtPath('/logs/42')
    await flushPromises()

    const entryTitles = wrapper.findAll('.grow-log__entry-title').map((entry) => entry.text())
    expect(entryTitles).toHaveLength(4)
    expect(entryTitles[0]).toContain('bloom')
    expect(entryTitles[0]).toContain('Day 10')
    expect(entryTitles[0]).toContain('Week 2')
    expect(entryTitles[1]).toContain('vegetation')
    expect(entryTitles[1]).toContain('Day 3')
    expect(entryTitles[1]).toContain('Week 1')
    expect(entryTitles[2]).toContain('seedling')
    expect(entryTitles[2]).toContain('Day 2')
    expect(entryTitles[3]).toContain('germination')
    expect(entryTitles[3]).toContain('Day 1')
    expect(wrapper.text()).toContain('Flowers')
    expect(wrapper.text()).toContain('First day')
  })

  it('updates today’s existing report instead of creating another entry', async () => {
    vi.setSystemTime(new Date('2024-01-10T12:00:00.000Z'))
    const receivedUpdates = []
    const receivedCreates = []
    const receivedLogLoads = []
    const entryRecord = {
      id: 3,
      occurred_at: '2024-01-10T00:00:00Z',
      stage: 'bloom',
      description: 'Today report',
      photos: [],
    }
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/plants`, () => HttpResponse.json([])),
      http.get(`${backendBaseUrl}/logs/42`, () => {
        receivedLogLoads.push(true)
        return HttpResponse.json(createLogDetail([entryRecord]))
      }),
      http.patch(`${backendBaseUrl}/entries/3`, async ({ request }) => {
        const updatedPayload = await request.json()
        receivedUpdates.push(updatedPayload)
        Object.assign(entryRecord, updatedPayload)
        return HttpResponse.json(entryRecord)
      }),
      http.post(`${backendBaseUrl}/logs/42/entries`, async ({ request }) => {
        receivedCreates.push(await request.json())
        return HttpResponse.json({ id: 4 }, { status: 201 })
      }),
    )

    const { wrapper } = await mountApplicationAtPath('/logs/42')
    await flushPromises()
    const initialReportForm = wrapper.find('.grow-log__report-form')
    await initialReportForm.find('textarea').setValue('Updated today report')
    await initialReportForm.trigger('submit')
    await flushPromises()

    expect(receivedUpdates).toEqual([
      {
        occurred_at: '2024-01-10T00:00:00.000Z',
        stage: 'bloom',
        description: 'Updated today report',
      },
    ])
    expect(receivedCreates).toEqual([])
    await vi.waitFor(() => expect(receivedLogLoads).toHaveLength(2))
    await vi.waitFor(() => expect(wrapper.find('.grow-log__report-form').exists()).toBe(true))
    const restoredReportForm = wrapper.find('.grow-log__report-form')
    expect(restoredReportForm.find('input[type="date"]').element.value).toBe('2024-01-10')
    expect(restoredReportForm.find('textarea').element.value).toBe('Updated today report')
    expect(restoredReportForm.find('button[type="submit"]').text()).toBe('Update')
  })

  it('loads an existing report, edits a historical entry, then returns to today', async () => {
    vi.setSystemTime(new Date('2024-01-10T12:00:00.000Z'))
    const receivedUpdates = []
    const receivedLogLoads = []
    const entryRecords = [
      {
        id: 3,
        occurred_at: '2024-01-10T00:00:00Z',
        stage: 'bloom',
        description: 'Today report',
        photos: [],
      },
      {
        id: 2,
        occurred_at: '2024-01-09T00:00:00Z',
        stage: 'vegetation',
        description: 'Recent report',
        photos: [],
      },
      {
        id: 1,
        occurred_at: '2024-01-06T00:00:00Z',
        stage: 'seedling',
        description: 'Older report',
        photos: [],
      },
    ]
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/plants`, () => HttpResponse.json([])),
      http.get(`${backendBaseUrl}/logs/42`, () => {
        receivedLogLoads.push(true)
        return HttpResponse.json(createLogDetail(entryRecords))
      }),
      http.patch(`${backendBaseUrl}/entries/:entryId`, async ({ params, request }) => {
        const updatedPayload = await request.json()
        receivedUpdates.push({ entryId: params.entryId, payload: updatedPayload })
        const updatedEntry = entryRecords.find((entry) => String(entry.id) === params.entryId)
        Object.assign(updatedEntry, updatedPayload)
        return HttpResponse.json(updatedEntry)
      }),
    )

    const { wrapper } = await mountApplicationAtPath('/logs/42')
    await flushPromises()

    const reportForm = wrapper.find('.grow-log__report-form')
    expect(wrapper.findAll('.grow-log__report-form')).toHaveLength(1)
    expect(reportForm.find('input[type="date"]').element.value).toBe('2024-01-10')
    expect(reportForm.find('select').element.value).toBe('bloom')
    expect(reportForm.find('textarea').element.value).toBe('Today report')
    expect(reportForm.find('button[type="submit"]').text()).toBe('Update')
    expect(wrapper.findAll('.grow-log__entry-actions')[0].text()).toContain('Edit')
    expect(wrapper.findAll('.grow-log__entry-actions')[0].text()).toContain('Delete')

    const olderEntry = wrapper
      .findAll('.grow-log__entry')
      .find((entry) => entry.text().includes('Older report'))
    await olderEntry.find('.grow-log__entry-edit').trigger('click')
    expect(reportForm.find('input[type="date"]').element.value).toBe('2024-01-06')
    expect(reportForm.find('select').element.value).toBe('seedling')
    expect(reportForm.find('textarea').element.value).toBe('Older report')
    await reportForm.find('textarea').setValue('Updated old report')
    await reportForm.trigger('submit')
    await flushPromises()

    expect(receivedUpdates).toEqual([
      {
        entryId: '1',
        payload: {
          occurred_at: '2024-01-06T00:00:00.000Z',
          stage: 'seedling',
          description: 'Updated old report',
        },
      },
    ])
    await vi.waitFor(() => expect(receivedLogLoads).toHaveLength(2))
    await vi.waitFor(() => expect(wrapper.find('.grow-log__report-form').exists()).toBe(true))
    const restoredReportForm = wrapper.find('.grow-log__report-form')
    expect(restoredReportForm.find('input[type="date"]').element.value).toBe('2024-01-10')
    expect(restoredReportForm.find('select').element.value).toBe('bloom')
    expect(restoredReportForm.find('textarea').element.value).toBe('Today report')
  })

  it('creates today’s report with the previous stage and returns to it after saving', async () => {
    vi.setSystemTime(new Date('2024-01-10T12:00:00.000Z'))
    const receivedCreates = []
    const receivedLogLoads = []
    const entryRecords = [
      {
        id: 2,
        occurred_at: '2024-01-09T00:00:00Z',
        stage: 'vegetation',
        description: null,
        photos: [],
      },
    ]
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/plants`, () => HttpResponse.json([])),
      http.get(`${backendBaseUrl}/logs/42`, () => {
        receivedLogLoads.push(true)
        return HttpResponse.json(createLogDetail(entryRecords))
      }),
      http.post(`${backendBaseUrl}/logs/42/entries`, async ({ request }) => {
        const entryPayload = await request.json()
        receivedCreates.push(entryPayload)
        const createdEntry = { id: 3, ...entryPayload, photos: [] }
        entryRecords.unshift(createdEntry)
        return HttpResponse.json(createdEntry, { status: 201 })
      }),
    )

    const { wrapper } = await mountApplicationAtPath('/logs/42')
    await flushPromises()
    const reportForm = wrapper.find('.grow-log__report-form')
    expect(reportForm.find('input[type="date"]').element.value).toBe('2024-01-10')
    expect(reportForm.find('select').element.value).toBe('vegetation')
    expect(reportForm.find('button[type="submit"]').text()).toBe('Create')

    await reportForm.find('textarea').setValue('New report')
    await reportForm.trigger('submit')
    await flushPromises()

    expect(receivedCreates).toEqual([
      {
        occurred_at: '2024-01-10T00:00:00.000Z',
        stage: 'vegetation',
        description: 'New report',
      },
    ])
    await vi.waitFor(() => expect(receivedLogLoads).toHaveLength(2))
    await vi.waitFor(() => expect(wrapper.find('.grow-log__report-form').exists()).toBe(true))
    const restoredReportForm = wrapper.find('.grow-log__report-form')
    expect(restoredReportForm.find('input[type="date"]').element.value).toBe('2024-01-10')
    expect(restoredReportForm.find('textarea').element.value).toBe('New report')
    expect(restoredReportForm.find('button[type="submit"]').text()).toBe('Update')
    expect(wrapper.findAll('.grow-log__entry')).toHaveLength(2)
  })

  it('deletes a report from the entry history', async () => {
    vi.setSystemTime(new Date('2024-01-10T12:00:00.000Z'))
    const receivedEntryDeletes = []
    const confirmDialog = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const entryRecords = [
      {
        id: 5,
        occurred_at: '2024-01-10T00:00:00Z',
        stage: 'seedling',
        description: 'Today report',
        photos: [],
      },
    ]
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/plants`, () => HttpResponse.json([])),
      http.get(`${backendBaseUrl}/logs/42`, () => HttpResponse.json(createLogDetail(entryRecords))),
      http.delete(`${backendBaseUrl}/entries/5`, () => {
        receivedEntryDeletes.push(5)
        entryRecords.splice(0, entryRecords.length)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { wrapper } = await mountApplicationAtPath('/logs/42')
    await flushPromises()
    expect(wrapper.findAll('.grow-log__entry')).toHaveLength(1)
    await wrapper.find('.grow-log__entry-delete').trigger('click')
    await flushPromises()

    expect(confirmDialog).toHaveBeenCalledOnce()
    expect(receivedEntryDeletes).toEqual([5])
    expect(wrapper.find('.grow-log__entry').exists()).toBe(false)
    await vi.waitFor(() => expect(wrapper.text()).toContain('No entries yet.'))
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
