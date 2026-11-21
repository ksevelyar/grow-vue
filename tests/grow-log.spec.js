import { flushPromises } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'
import {
  backendBaseUrl,
  createAuthenticatedSessionHandler,
  createTestServer,
  mountApplicationAtPath,
} from './support'

const server = createTestServer()

describe('grow-log details and reports', () => {
  test('A user views grow-log details', async () => {
    vi.setSystemTime(new Date('2026-11-20T12:00:00Z'))
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/logs/42`, () =>
        HttpResponse.json({ ...createMustardLogDetail(), description: 'coco + perlite' }),
      ),
    )

    const { wrapper } = await mountApplicationAtPath('/logs/42')
    await flushPromises()

    const summary = wrapper.find('.grow-log__summary').text()
    expect(summary).toContain('Day 37 · Week 6')
    expect(summary).toMatch(/vegetation\s*30 days/i)
    expect(summary).toMatch(/bloom\s*5 days/i)
    expect(summary).toContain('coco + perlite')
  })

  test('A user views a completed grow', async () => {
    vi.setSystemTime(new Date('2026-11-25T12:00:00Z'))
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/logs/42`, () =>
        HttpResponse.json({
          ...createMustardLogDetail(),
          ended_at: '2026-11-20T00:00:00Z',
          outcome: 'Healthy harvest',
        }),
      ),
    )

    const { wrapper } = await mountApplicationAtPath('/logs/42')
    await flushPromises()

    const summary = wrapper.find('.grow-log__summary').text()
    expect(summary).toContain('Day 37 · Week 6')
    expect(summary).toMatch(/vegetation\s*30 days/i)
    expect(summary).toMatch(/bloom\s*5 days/i)
    expect(summary).toContain('Healthy harvest')
  })

  test('A user views entry history', async () => {
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/logs/42`, () => HttpResponse.json(createMustardLogDetail())),
    )

    const { wrapper } = await mountApplicationAtPath('/logs/42')
    await flushPromises()

    const entryTitles = wrapper.findAll('.grow-log__entry-title').map((entry) => entry.text())
    expect(entryTitles[0]).toMatch(/Day 37 · Week 6 · bloom 5/)
    expect(entryTitles[1]).toMatch(/Day 36 · Week 6 · bloom 4/)
    const vegetationEntry = wrapper
      .findAll('.grow-log__entry')
      .find((entry) => entry.text().includes('First leaves'))
    expect(vegetationEntry.text()).toContain('vegetation')
  })

  test('A user cannot save a report for a date with an existing entry', async () => {
    const entries = [
      { id: 2, occurred_at: '2026-04-15T00:00:00Z', stage: 'vegetation' },
      { id: 1, occurred_at: '2026-04-01T00:00:00Z', stage: 'vegetation' },
    ]
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/logs/42`, () => HttpResponse.json(createLogDetail(entries))),
      http.patch(`${backendBaseUrl}/entries/2`, () =>
        HttpResponse.json(
          {
            error: 'validation failed',
            fields: [{ field: 'occurred_at', message: 'an entry already exists for this date' }],
          },
          { status: 422 },
        ),
      ),
    )

    const { wrapper } = await mountApplicationAtPath('/logs/42')
    await flushPromises()
    await wrapper.find('.grow-log__entry-edit').trigger('click')
    const report = wrapper.find('.grow-log__report-form')
    await report.find('input[type="date"]').setValue('2026-04-01')
    await report.trigger('submit')
    await flushPromises()
    expect(report.text()).toContain('an entry already exists for this date')
  })

  test('A user cannot save a report with an earlier stage', async () => {
    vi.setSystemTime(new Date('2026-05-06T12:00:00Z'))
    const entries = [
      { id: 2, occurred_at: '2026-05-01T00:00:00Z', stage: 'bloom' },
      { id: 1, occurred_at: '2026-04-01T00:00:00Z', stage: 'vegetation' },
    ]
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/logs/42`, () => HttpResponse.json(createLogDetail(entries))),
      http.post(`${backendBaseUrl}/logs/42/entries`, () =>
        HttpResponse.json(
          {
            error: 'validation failed',
            fields: [{ field: 'stage', message: 'must follow the order of the other entries' }],
          },
          { status: 422 },
        ),
      ),
    )

    const { wrapper } = await mountApplicationAtPath('/logs/42')
    await flushPromises()
    const report = wrapper.find('.grow-log__report-form')
    await report.find('select').setValue('vegetation')
    await report.trigger('submit')
    await flushPromises()
    expect(report.text()).toContain('must follow the order of the other entries')
  })

  test('A user updates a report', async () => {
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
    expect(wrapper.find('.grow-log__entry-list').text()).toContain('Updated old report')
  })

  test('A user creates today’s report', async () => {
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

  test('A user deletes a report', async () => {
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

function createMustardLogDetail() {
  return {
    ...createLogDetail([
      { id: 4, occurred_at: '2026-11-20T00:00:00Z', stage: 'bloom' },
      { id: 3, occurred_at: '2026-11-19T00:00:00Z', stage: 'bloom' },
      { id: 2, occurred_at: '2026-11-16T00:00:00Z', stage: 'bloom' },
      {
        id: 1,
        occurred_at: '2026-10-17T00:00:00Z',
        stage: 'vegetation',
        description: 'First leaves',
      },
    ]),
    name: 'Mustard',
    started_at: '2026-10-15T00:00:00Z',
  }
}

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
