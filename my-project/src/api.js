const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const TOKEN_KEY = 'sweety-access-token'

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY)
}

export function saveToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY)
}

export async function apiRequest(path, { method = 'GET', body, authenticated = true } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (authenticated) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 204) return null

  const result = await response.json()
  if (!response.ok) {
    if (response.status === 401 && authenticated) {
      clearToken()
      window.dispatchEvent(new Event('sweety:unauthorized'))
    }
    const error = new Error(result.message || 'The request could not be completed.')
    error.status = response.status
    throw error
  }
  return result.data
}

export const authApi = {
  register: (body) => apiRequest('/auth/register', { method: 'POST', body, authenticated: false }),
  login: (body) => apiRequest('/auth/login', { method: 'POST', body, authenticated: false }),
  me: () => apiRequest('/auth/me'),
}

export const readingsApi = {
  list: (query = '') => apiRequest(`/readings${query ? `?${query}` : ''}`),
  get: (id) => apiRequest(`/readings/${encodeURIComponent(id)}`),
  create: (body) => apiRequest('/readings', { method: 'POST', body }),
  update: (id, body) => apiRequest(`/readings/${encodeURIComponent(id)}`, { method: 'PUT', body }),
  remove: (id) => apiRequest(`/readings/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}

export const dashboardApi = {
  get: () => apiRequest('/dashboard'),
}

export const reportsApi = {
  daily: (date) => apiRequest(`/reports/daily?${new URLSearchParams({ date })}`),
  monthToDate: () => apiRequest('/reports/month-to-date'),
  previousMonth: () => apiRequest('/reports/previous-month'),
  get: (startDate, endDate) => apiRequest(
    `/reports?${new URLSearchParams({ startDate, endDate })}`,
  ),
}

export const usersApi = {
  updateProfile: (body) => apiRequest('/users/me', { method: 'PATCH', body }),
  changePassword: (body) => apiRequest('/users/me/password', { method: 'PATCH', body }),
}
