import {
  apiRequest,
  setAccessToken,
  setRefreshToken,
  setAuthUser,
  getRefreshToken,
  clearAuth,
  API_BASE_URL,
  type ApiErrorBody,
  getApiErrorMessage,
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

export interface AuthApiError {
  status: number
  message?: string
  fieldErrors?: Record<string, string>
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export const authApi = {
  /**
   * Login user — persists tokens and user via api (single source of truth)
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const body = (await response
      .json()
      .catch(() => null)) as (AuthResponse & { errors?: Record<string, string> } & ApiErrorBody) | null

    if (!response.ok) {
      const apiBody: ApiErrorBody | null = body
      const error: AuthApiError = {
        status: response.status,
        message: getApiErrorMessage(apiBody, 'Login failed'),
        fieldErrors: body && 'errors' in body ? body.errors ?? undefined : undefined,
      }
      throw error
    }

    await setAccessToken(body!.accessToken)
    await setRefreshToken(body!.refreshToken)
    await setAuthUser(body!.user)
    return body as AuthResponse
  },

  /**
   * Register new user — persists tokens and user via api (single source of truth)
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const body = (await response
      .json()
      .catch(() => null)) as (AuthResponse & { errors?: Record<string, string> } & ApiErrorBody) | null

    if (!response.ok) {
      const apiBody: ApiErrorBody | null = body
      const error: AuthApiError = {
        status: response.status,
        message: getApiErrorMessage(apiBody, 'Registration failed'),
        fieldErrors: body && 'errors' in body ? body.errors ?? undefined : undefined,
      }
      throw error
    }

    await setAccessToken(body!.accessToken)
    await setRefreshToken(body!.refreshToken)
    await setAuthUser(body!.user)
    return body as AuthResponse
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

