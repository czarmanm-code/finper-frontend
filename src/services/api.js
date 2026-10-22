const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * Standard fetch wrapper with JWT token handling.
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('finper_auth_token')

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorMessage
    } catch {
      // Non-JSON response
    }
    const error = new Error(errorMessage)
    error.status = response.status
    throw error
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

