import {
  apiRequest,
  setAccessToken,
  setRefreshToken,
  setAuthUser,
  getRefreshToken,
  clearAuth,
  API_BASE_URL,
} from './api'

// Types
export interface User {
  id: number
  email: string
  name: string | null
  createdAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name?: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export const authApi = {
  /**
   * Login user — persists tokens and user via api (single source of truth)
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    await setAccessToken(response.accessToken)
    await setRefreshToken(response.refreshToken)
    await setAuthUser(response.user)
    return response
  },

  /**
   * Register new user — persists tokens and user via api (single source of truth)
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    await setAccessToken(response.accessToken)
    await setRefreshToken(response.refreshToken)
    await setAuthUser(response.user)
    return response
  },

  /**
   * Logout user — uses stored refresh token, then clears all auth (storage + store)
   */
  async logout(): Promise<void> {
    const refreshToken = await getRefreshToken()
    if (refreshToken) {
      try {
        await apiRequest('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        })
      } catch {
        // Proceed to clear local auth even if server call fails
      }
    }
    await clearAuth()
  },

  /**
   * Refresh access token (direct fetch to avoid apiRequest 401 loop).
   * Prefer using apiRequest() which handles refresh automatically on 401.
   */
  async refresh(data: RefreshTokenRequest): Promise<{ accessToken: string }> {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Token refresh failed' }))
      throw new Error(error.message || 'Token refresh failed')
    }
    const dataResponse = await response.json()
    await setAccessToken(dataResponse.accessToken)
    return dataResponse
  },
}

