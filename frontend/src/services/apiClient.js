const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const TOKEN_KEY = 'webvory.token'
const DEFAULT_TIMEOUT_MS = 15000

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'error', fields = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
  }

  get isNetworkError() {
    return this.status === 0
  }
}

let memoryToken = null

function tryStorage(operation, fallback = null) {
  try {
    return operation(window.localStorage)
  } catch {
    return fallback
  }
}

export const tokenStorage = {
  // Memory wins when set: if a write failed, localStorage may still hold an
  // older token and returning that would sign the user in as the wrong person.
  get: () => memoryToken ?? tryStorage((store) => store.getItem(TOKEN_KEY)),

  set: (token) => {
    memoryToken = token
    tryStorage((store) => store.setItem(TOKEN_KEY, token))
  },

  clear: () => {
    memoryToken = null
    tryStorage((store) => store.removeItem(TOKEN_KEY))
  },
}

// Set by AuthProvider so an expired session can bounce the user to /login
// from anywhere, without this module importing React or the router.
let unauthorizedHandler = null
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

function buildQueryString(params) {
  if (!params) return ''
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    // Arrays repeat the key: ?status=pending&status=blocked, which is the
    // shape FastAPI expects for a List[...] query parameter.
    if (Array.isArray(value)) {
      value.forEach((item) => item !== '' && search.append(key, item))
    } else {
      search.append(key, value)
    }
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

async function request(path, { method = 'GET', body, params, signal, timeout = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  // Honour a caller-supplied signal (used to cancel superseded searches)
  // alongside our own timeout.
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = tokenStorage.get()
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${BASE_URL}${path}${buildQueryString(params)}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new ApiError('The request took too long and was cancelled.', {
        status: 0,
        code: 'timeout',
      })
    }
    throw new ApiError('Cannot reach the server. Is the backend running?', {
      status: 0,
      code: 'network_error',
    })
  }
  clearTimeout(timeoutId)

  if (response.status === 204) return null

  let payload = null
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    payload = await response.json().catch(() => null)
  }

  if (!response.ok) {
    if (response.status === 401) {
      tokenStorage.clear()
      unauthorizedHandler?.()
    }
    const detail = payload?.error ?? {}
    throw new ApiError(detail.message || `Request failed (${response.status})`, {
      status: response.status,
      code: detail.code || 'error',
      fields: detail.details?.fields ?? null,
    })
  }

  return payload
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}
