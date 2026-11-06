import { requestJson } from '@/api/request'

export default {
  list() {
    return requestJson('/plants')
  },

  create(plant) {
    return requestJson('/plants', {
      method: 'POST',
      body: JSON.stringify(plant),
    })
  },

  get(plantId) {
    return requestJson(`/plants/${plantId}`)
  },

  update(plantId, plant) {
    return requestJson(`/plants/${plantId}`, {
      method: 'PATCH',
      body: JSON.stringify(plant),
    })
  },

  delete(plantId) {
    return requestJson(`/plants/${plantId}`, { method: 'DELETE' })
  },
}
