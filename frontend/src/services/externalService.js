import { api } from './apiClient'

/** The third-party staff directory integration. */
export const externalService = {
  directory: (options) => api.get('/external/users', options),
  importUsers: (externalIds) => api.post('/external/users/import', { external_ids: externalIds }),
}
