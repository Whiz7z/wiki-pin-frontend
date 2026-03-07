import { apiRequest, setAccessToken, removeAccessToken, API_BASE_URL } from './api'

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

export interface LogoutRequest {
  refreshToken: string
}

export const authApi = {
  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    // Store tokens
    await setAccessToken(response.accessToken)
    await chrome.storage.local.set({ refreshToken: response.refreshToken })
    
    return response
  },

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    // Store tokens
    await setAccessToken(response.accessToken)
    await chrome.storage.local.set({ refreshToken: response.refreshToken })
    
    return response
  },

  /**
   * Logout user
   */
  async logout(data: LogoutRequest): Promise<void> {
    await apiRequest('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    // Remove tokens
    await removeAccessToken()
    await chrome.storage.local.remove(['refreshToken'])
  },

  /**
   * Refresh access token
   */
  async refresh(data: RefreshTokenRequest): Promise<{ accessToken: string }> {
    // Don't use apiRequest here to avoid infinite loop, use direct fetch
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Token refresh failed' }))
      throw new Error(error.message || 'Token refresh failed')
    }

    const data_response = await response.json()
    
    // Update stored access token (this will also sync with store)
    await setAccessToken(data_response.accessToken)
    
    return data_response
  },
}

