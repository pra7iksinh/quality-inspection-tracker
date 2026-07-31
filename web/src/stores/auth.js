import { defineStore } from 'pinia'
import { api, tokenStore } from '../api/http.js'

const USER_KEY = 'qit.user'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: tokenStore.get(),
    user: JSON.parse(localStorage.getItem(USER_KEY) ?? 'null'),
  }),
  getters: {
    isAuthed: (state) => Boolean(state.token),
  },
  actions: {
    async login(username, password) {
      const { data } = await api.post('/auth/login', { username, password })
      this.token = data.token
      this.user = data.user
      tokenStore.set(data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    },
    logout() {
      this.token = null
      this.user = null
      tokenStore.clear()
      localStorage.removeItem(USER_KEY)
    },
  },
})
