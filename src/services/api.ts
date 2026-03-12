// Shared API utility with authentication token handling
// Single source of truth: chrome.storage holds auth; store is synced from here.
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
 * Get the stored refresh token from chrome storage
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get(['refreshToken'])
    return result.refreshToken as string | null
  } catch (error) {
    console.error('Error getting refresh token:', error)
    return null
  }
}

/**
 * Get the stored auth user from chrome storage
 */
export async function getAuthUser(): Promise<unknown | null> {
  try {
    const result = await chrome.storage.local.get(['authUser'])
    return result.authUser ?? null
  } catch (error) {
    console.error('Error getting auth user:', error)
    return null
  }
}

/**
 * Set the access token in chrome storage and sync with store
 */
export async function setAccessToken(token: string): Promise<void> {
  try {
    await chrome.storage.local.set({ accessToken: token })
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
 * Set the refresh token in chrome storage (not stored in Zustand)
 */
export async function setRefreshToken(token: string): Promise<void> {
  try {
    await chrome.storage.local.set({ refreshToken: token })
  } catch (error) {
    console.error('Error setting refresh token:', error)
  }
}

/**
 * Set the auth user in chrome storage and sync with store
 */
export async function setAuthUser(user: unknown): Promise<void> {
  try {
    await chrome.storage.local.set({ authUser: user })
    try {
      const { useAuthStore } = await import('../stores/authStore')
      useAuthStore.setState({ user: user as import('../stores/authStore').AuthState['user'] })
    } catch {
      // Store might not be available (e.g., in content scripts)
    }
  } catch (error) {
    console.error('Error setting auth user:', error)
  }
}

/**
 * Clear all auth data from storage and sync store (single place for logout state)
 */
export async function clearAuth(): Promise<void> {
  try {
    await chrome.storage.local.remove(['accessToken', 'refreshToken', 'authUser'])
    try {
      const { useAuthStore } = await import('../stores/authStore')
      useAuthStore.setState({ accessToken: null, user: null })
    } catch {
      // Store might not be available
    }
  } catch (error) {
    console.error('Error clearing auth:', error)
  }
}

/**
 * Refresh the access token using the stored refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) return null

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      await clearAuth()
      return null
    }

    const data = await response.json()
    const newAccessToken = data.accessToken

    if (newAccessToken) {
      await setAccessToken(newAccessToken)
      return newAccessToken
    }
    return null
  } catch (error) {
    console.error('Error refreshing token:', error)
    await clearAuth()
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

