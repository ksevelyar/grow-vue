import { defineStore } from 'pinia'
import { reactive } from 'vue'
import userClient from '@/api/user-client'

export const useUserStore = defineStore('user', () => {
  const user = reactive({
    name: null,
    email: null,
    timezone: null,
  })

  async function get() {
    Object.assign(user, await userClient.get())
  }

  async function register(userData) {
    Object.assign(user, await userClient.register(userData))
  }

  async function login(userData) {
    await userClient.login(userData)
  }

  return {
    user,
    get,
    register,
    login,
  }
})
