import { requestJson } from '@/api/request'

export default {
  create(logId, entry) {
    return requestJson(`/logs/${logId}/entries`, {
      method: 'POST',
      body: JSON.stringify(entry),
    })
  },

  update(entryId, entry) {
    return requestJson(`/entries/${entryId}`, {
      method: 'PATCH',
      body: JSON.stringify(entry),
    })
  },

  delete(entryId) {
    return requestJson(`/entries/${entryId}`, { method: 'DELETE' })
  },
}
