import { requestJson } from '@/api/request'

export default {
  list() {
    return requestJson('/logs')
  },

  create(growLog) {
    return requestJson('/logs', {
      method: 'POST',
      body: JSON.stringify(growLog),
    })
  },

  get(logId) {
    return requestJson(`/logs/${logId}`)
  },

  update(logId, growLog) {
    return requestJson(`/logs/${logId}`, {
      method: 'PATCH',
      body: JSON.stringify(growLog),
    })
  },

  delete(logId) {
    return requestJson(`/logs/${logId}`, { method: 'DELETE' })
  },
}
