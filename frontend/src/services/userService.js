import { api } from './apiClient'

export const userService = {
  list: (params, options) => api.get('/users', { params, ...options }),
  options: (opts) => api.get('/users/options', opts),
  get: (id, opts) => api.get(`/users/${id}`, opts),
  create: (payload) => api.post('/users', payload),
  update: (id, payload) => api.put(`/users/${id}`, payload),
  remove: (id) => api.delete(`/users/${id}`),
}
