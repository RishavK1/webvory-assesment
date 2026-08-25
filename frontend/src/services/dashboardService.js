import { api } from './apiClient'

export const dashboardService = {
  get: (options) => api.get('/dashboard', options),
}
