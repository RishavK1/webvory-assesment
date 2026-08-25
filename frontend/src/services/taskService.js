import { api } from './apiClient'

/** All task-related API calls. Pages never build URLs themselves. */
export const taskService = {
  list: (filters, options) => api.get('/tasks', { params: filters, ...options }),
  board: (options) => api.get('/tasks/board', options),
  get: (id, options) => api.get(`/tasks/${id}`, options),
  create: (payload) => api.post('/tasks', payload),
  update: (id, payload) => api.put(`/tasks/${id}`, payload),
  remove: (id) => api.delete(`/tasks/${id}`),

  listComments: (id, options) => api.get(`/tasks/${id}/comments`, options),
  addComment: (id, comment) => api.post(`/tasks/${id}/comments`, { comment }),
  removeComment: (taskId, commentId) => api.delete(`/tasks/${taskId}/comments/${commentId}`),

  listActivity: (id, options) => api.get(`/tasks/${id}/activity`, options),
}
