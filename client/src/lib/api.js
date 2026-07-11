export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export async function api(path, options = {}) {
  const headers = { ...options.headers }
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json'
  const response = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...options,
    headers,
    body: options.body && !(options.body instanceof FormData) ? JSON.stringify(options.body) : options.body,
  })
  const type = response.headers.get('content-type') || ''
  const value = type.includes('application/json') ? await response.json() : await response.text()
  if (!response.ok) throw new ApiError(value?.error || 'The request could not be completed.', response.status)
  return value
}

export function userApi(userId, token, path = '', options = {}) {
  return api(`/users/${userId}${path}`, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  })
}
