import { File as NodeFile } from 'node:buffer'
import photosClient from '@/api/photos-client'
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

describe('grow-log photo gallery', () => {
  it('shows every photo below log data and opens original photos with arrow navigation', async () => {
    const loadedPhotoIdentifiers = []
    vi.spyOn(photosClient, 'get').mockImplementation(async (photoId) => {
      loadedPhotoIdentifiers.push(photoId)
      return `blob:original-${photoId}`
    })
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/plants`, () => HttpResponse.json([])),
      http.get(`${backendBaseUrl}/logs/42`, () =>
        HttpResponse.json(
          createLogDetail([
            {
              id: 3,
              occurred_at: '2024-01-03T00:00:00Z',
              stage: 'bloom',
              photos: [
                { id: 32, thumbnail_url: '/photos/32/thumbnail', original_filename: 'bloom.jpg' },
                { id: 33, thumbnail_url: '/photos/33/thumbnail', original_filename: 'leaf.jpg' },
              ],
            },
            {
              id: 2,
              occurred_at: '2024-01-02T00:00:00Z',
              stage: 'vegetation',
              photos: [
                {
                  id: 21,
                  thumbnail_url: '/photos/21/thumbnail',
                  original_filename: 'seedling.jpg',
                },
              ],
            },
          ]),
        ),
      ),
    )

    const { wrapper } = await mountApplicationAtPath('/logs/42')
    await flushPromises()

    const gallery = wrapper.find('.gallery')
    const summary = wrapper.find('.grow-log__summary')
    expect(
      summary.element.compareDocumentPosition(gallery.element) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0)
    const photoThumbnails = wrapper.findAll('.gallery__thumbnail')
    expect(photoThumbnails).toHaveLength(3)
    expect(photoThumbnails.map((thumbnail) => thumbnail.find('img').attributes('src'))).toEqual([
      `${backendBaseUrl}/photos/32/thumbnail`,
      `${backendBaseUrl}/photos/33/thumbnail`,
      `${backendBaseUrl}/photos/21/thumbnail`,
    ])
    const entryPhotoThumbnails = wrapper.findAll('.grow-log__entry-photo')
    expect(entryPhotoThumbnails).toHaveLength(3)

    await photoThumbnails[0].trigger('click')
    await flushPromises()
    expect(loadedPhotoIdentifiers).toEqual([32])
    expect(wrapper.find('.gallery__full-image').attributes('src')).toBe('blob:original-32')
    await window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    await flushPromises()
    expect(loadedPhotoIdentifiers).toEqual([32, 33])
    expect(wrapper.find('.gallery__full-image').attributes('src')).toBe('blob:original-33')
    await window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    await flushPromises()
    expect(loadedPhotoIdentifiers).toEqual([32, 33, 32])
    expect(wrapper.find('.gallery__full-image').attributes('src')).toBe('blob:original-32')
    await window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.find('.gallery__viewer').exists()).toBe(false)

    await entryPhotoThumbnails[2].trigger('click')
    await flushPromises()
    expect(loadedPhotoIdentifiers).toEqual([32, 33, 32, 21])
    expect(wrapper.find('.gallery__full-image').attributes('src')).toBe('blob:original-21')
    await window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    await flushPromises()
    expect(loadedPhotoIdentifiers).toEqual([32, 33, 32, 21, 32])
    expect(wrapper.find('.gallery__full-image').attributes('src')).toBe('blob:original-32')
    await wrapper.find('.gallery__close').trigger('click')
    expect(wrapper.find('.gallery__viewer').exists()).toBe(false)
  })

  it('uploads multiple photos and displays successful uploads across the report and gallery', async () => {
    vi.setSystemTime(new Date('2024-01-10T12:00:00.000Z'))
    const receivedStages = []
    const receivedUploadEntryIdentifiers = []
    const receivedLogLoads = []
    const uploadContentTypes = []
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
        receivedStages.push(entryPayload.stage)
        const createdEntry = { id: 101, ...entryPayload, photos: [] }
        entryRecords.unshift(createdEntry)
        return HttpResponse.json(createdEntry, { status: 201 })
      }),
      http.post(`${backendBaseUrl}/entries/:entryId/photos`, ({ request, params }) => {
        receivedUploadEntryIdentifiers.push(params.entryId)
        uploadContentTypes.push(request.headers.get('Content-Type'))
        if (receivedUploadEntryIdentifiers.length === 2) {
          return HttpResponse.json({ error: 'upload failed' }, { status: 500 })
        }
        const createdEntry = entryRecords.find((entry) => String(entry.id) === params.entryId)
        createdEntry.photos.push({
          id: 200,
          media_type: 'image/jpeg',
          original_filename: 'first.jpg',
          thumbnail_url: '/photos/200/thumbnail',
        })
        return HttpResponse.json({ id: 200, media_type: 'image/jpeg' }, { status: 201 })
      }),
    )

    const { wrapper } = await mountApplicationAtPath('/logs/42')
    await flushPromises()
    const reportForm = wrapper.find('.grow-log__report-form')
    expect(reportForm.find('input[type="date"]').element.value).toBe('2024-01-10')
    expect(reportForm.find('select').element.value).toBe('vegetation')
    expect(reportForm.find('button[type="submit"]').text()).toBe('Create')

    const photoInput = reportForm.find('input[type="file"]')
    Object.defineProperty(photoInput.element, 'files', {
      configurable: true,
      value: [
        new NodeFile(['first'], 'first.jpg', { type: 'image/jpeg' }),
        new NodeFile(['second'], 'second.jpg', { type: 'image/jpeg' }),
      ],
    })
    await photoInput.trigger('change')
    await reportForm.trigger('submit')
    await flushPromises()

    expect(receivedStages).toEqual(['vegetation'])
    await vi.waitFor(() => expect(receivedUploadEntryIdentifiers).toHaveLength(2))
    await vi.waitFor(() => expect(receivedLogLoads).toHaveLength(2))
    await vi.waitFor(() => expect(wrapper.find('.grow-log__report-form').exists()).toBe(true))
    expect(receivedUploadEntryIdentifiers).toEqual(['101', '101'])
    expect(
      uploadContentTypes.every((contentType) => contentType.startsWith('multipart/form-data')),
    ).toBe(true)
    expect(wrapper.text()).toContain('second.jpg: upload failed')
    expect(wrapper.findAll('.grow-log__report-form .grow-log__photo')).toHaveLength(1)
    expect(wrapper.findAll('.gallery__thumbnail')).toHaveLength(1)
    expect(wrapper.findAll('.grow-log__entry-photo')).toHaveLength(1)
    expect(wrapper.find('.gallery__thumbnail img').attributes('src')).toBe(
      `${backendBaseUrl}/photos/200/thumbnail`,
    )
    expect(wrapper.find('.grow-log__report-form button[type="submit"]').text()).toBe('Update')
  })

  it('removes a photo from the report, entry history, and gallery', async () => {
    vi.setSystemTime(new Date('2024-01-01T12:00:00.000Z'))
    const receivedPhotoDeletes = []
    let entryPhotos = [
      {
        id: 81,
        media_type: 'image/jpeg',
        original_filename: 'leaf.jpg',
        thumbnail_url: '/photos/81/thumbnail',
      },
      {
        id: 82,
        media_type: 'image/jpeg',
        original_filename: 'stem.jpg',
        thumbnail_url: '/photos/82/thumbnail',
      },
    ]
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/plants`, () => HttpResponse.json([])),
      http.get(`${backendBaseUrl}/logs/42`, () =>
        HttpResponse.json(
          createLogDetail([
            {
              id: 1,
              occurred_at: '2024-01-01T00:00:00Z',
              stage: 'seedling',
              description: null,
              photos: entryPhotos,
            },
          ]),
        ),
      ),
      http.delete(`${backendBaseUrl}/photos/81`, () => {
        receivedPhotoDeletes.push(81)
        entryPhotos = entryPhotos.filter((photo) => photo.id !== 81)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { wrapper } = await mountApplicationAtPath('/logs/42')
    await flushPromises()
    expect(wrapper.findAll('.grow-log__report-form .grow-log__photo')).toHaveLength(2)
    expect(wrapper.findAll('.gallery__thumbnail')).toHaveLength(2)
    expect(wrapper.findAll('.grow-log__entry-photo')).toHaveLength(2)
    await wrapper.find('.grow-log__report-form .grow-log__photo button').trigger('click')
    await flushPromises()

    expect(receivedPhotoDeletes).toEqual([81])
    expect(wrapper.findAll('.grow-log__report-form .grow-log__photo')).toHaveLength(1)
    expect(wrapper.findAll('.gallery__thumbnail')).toHaveLength(1)
    expect(wrapper.findAll('.grow-log__entry-photo')).toHaveLength(1)
    expect(wrapper.find('.gallery__thumbnail img').attributes('src')).toBe(
      `${backendBaseUrl}/photos/82/thumbnail`,
    )
  })

  it('deletes an entry and its photos from the history and gallery', async () => {
    const receivedEntryDeletes = []
    const confirmDialog = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const entryRecords = [
      {
        id: 1,
        occurred_at: '2024-01-01T00:00:00Z',
        stage: 'seedling',
        description: null,
        photos: [
          {
            id: 81,
            media_type: 'image/jpeg',
            original_filename: 'leaf.jpg',
            thumbnail_url: '/photos/81/thumbnail',
          },
        ],
      },
    ]
    server.use(
      createAuthenticatedSessionHandler(),
      http.get(`${backendBaseUrl}/plants`, () => HttpResponse.json([])),
      http.get(`${backendBaseUrl}/logs/42`, () => HttpResponse.json(createLogDetail(entryRecords))),
      http.delete(`${backendBaseUrl}/entries/1`, () => {
        receivedEntryDeletes.push(1)
        entryRecords.splice(0, entryRecords.length)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { wrapper } = await mountApplicationAtPath('/logs/42')
    await flushPromises()
    expect(wrapper.findAll('.grow-log__entry')).toHaveLength(1)
    expect(wrapper.findAll('.gallery__thumbnail')).toHaveLength(1)
    await wrapper.find('.grow-log__entry-delete').trigger('click')
    await flushPromises()

    expect(confirmDialog).toHaveBeenCalledOnce()
    expect(receivedEntryDeletes).toEqual([1])
    expect(wrapper.find('.grow-log__entry').exists()).toBe(false)
    expect(wrapper.find('.gallery__thumbnail').exists()).toBe(false)
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
