import { api, tokenStorage } from './apiClient'

export const authService = {
  async login(email, password) {
    const data = await api.post('/auth/login', { email, password })
    tokenStorage.set(data.access_token)
    return data.user
  },

  me: () => api.get('/auth/me'),

  logout: () => tokenStorage.clear(),
}
