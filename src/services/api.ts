// Shared API utility with authentication token handling
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export interface ApiError {
  message: string
  error?: string
}

/**
 * Get the stored access token from chrome storage
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get(['accessToken'])

    return result.accessToken as string | null
  } catch (error) {
    console.error('Error getting access token:', error)
    return null
  }
}

/**
 * Set the access token in chrome storage and sync with store
 */
export async function setAccessToken(token: string): Promise<void> {
  try {
    await chrome.storage.local.set({ accessToken: token })
    // Update store if available
    try {
      const { useAuthStore } = await import('../stores/authStore')
      useAuthStore.setState({ accessToken: token })
    } catch {
      // Store might not be available (e.g., in content scripts)
    }
  } catch (error) {
    console.error('Error setting access token:', error)
  }
}

/**
 * Remove the access token from chrome storage and sync with store
 */
export async function removeAccessToken(): Promise<void> {
  try {
    await chrome.storage.local.remove(['accessToken'])
    // Update store if available
    try {
      const { useAuthStore } = await import('../stores/authStore')
      useAuthStore.setState({ accessToken: null })
    } catch {
      // Store might not be available (e.g., in content scripts)
    }
  } catch (error) {
    console.error('Error removing access token:', error)
  }
}

/**
 * Refresh the access token using refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get(['refreshToken'])
    const refreshToken = result.refreshToken as string | null

    if (!refreshToken) {
      return null
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      // Refresh token is invalid, clear all auth data
      await removeAccessToken()
      await chrome.storage.local.remove(['refreshToken', 'authUser'])
      // Update store if available
      try {
        const { useAuthStore } = await import('../stores/authStore')
        useAuthStore.getState().logout().catch(() => {})
      } catch {
        // Store might not be available
      }
      return null
    }

    const data = await response.json()
    const newAccessToken = data.accessToken

    if (newAccessToken) {
      await setAccessToken(newAccessToken)
      // Update store if available
      try {
        const { useAuthStore } = await import('../stores/authStore')
        useAuthStore.setState({ accessToken: newAccessToken })
      } catch {
        // Store might not be available
      }
      return newAccessToken
    }

    return null
  } catch (error) {
    console.error('Error refreshing token:', error)
    await removeAccessToken()
    await chrome.storage.local.remove(['refreshToken', 'authUser'])
    // Update store if available
    try {
      const { useAuthStore } = await import('../stores/authStore')
      useAuthStore.setState({ accessToken: null, user: null })
    } catch {
      // Store might not be available
    }
    return null
  }
}

/**
 * Make an authenticated API request with automatic token refresh
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retryOn401 = true
): Promise<T> {
  let token = await getAccessToken()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // If we get a 401 and have retry enabled, try to refresh the token
  if (response.status === 401 && retryOn401 && token) {
    const newToken = await refreshAccessToken()
    
    if (newToken) {
      // Retry the request with the new token
      headers['Authorization'] = `Bearer ${newToken}`
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      })
    } else {
      // Token refresh failed, throw error
      const error: ApiError = await response.json().catch(() => ({
        message: 'Authentication failed. Please login again.',
      }))
      throw new Error(error.message || error.error || 'Authentication failed')
    }
  }

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      message: `Request failed: ${response.statusText}`,
    }))
    throw new Error(error.message || error.error || 'Request failed')
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  
  return {} as T
}

export { API_BASE_URL }

