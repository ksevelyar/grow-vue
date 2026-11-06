import { requestJson } from './request'

export default {
  get() {
    return requestJson('/sessions/current')
  },

  login(user) {
    return requestJson('/sessions', {
      method: 'POST',
      body: JSON.stringify(user),
    })
  },

  register(user) {
    return requestJson('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    })
  },
}
