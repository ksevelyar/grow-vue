import { getBackendUrl, requestJson } from '@/api/request'

export default {
  async upload(entryId, file) {
    const formData = new FormData()
    formData.append('file', file)
    return requestJson(`/entries/${entryId}/photos`, {
      method: 'POST',
      body: formData,
    })
  },

  async get(photoId) {
    const response = await fetch(getBackendUrl(`/photos/${photoId}`), {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const requestError = new Error(`Photo request failed with status ${response.status}`)
      requestError.status = response.status
      throw requestError
    }

    return URL.createObjectURL(await response.blob())
  },

  delete(photoId) {
    return requestJson(`/photos/${photoId}`, { method: 'DELETE' })
  },
}
