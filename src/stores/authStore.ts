import { create } from 'zustand'
import { authApi, type User, type LoginRequest, type RegisterRequest } from '../services/authApi'
import { getAccessToken, getAuthUser, setAuthUser, clearAuth } from '../services/api'

export interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  error: string | null

  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
  loadFromStorage: () => Promise<void>
}

// Selector to get isAuthenticated status
export const selectIsAuthenticated = (state: AuthState): boolean => {
  return !!state.accessToken
}

// Helper hook to get isAuthenticated
export const useIsAuthenticated = () => {
  return useAuthStore(selectIsAuthenticated)
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initializeStore = async () => {
    try {
      const [accessToken, authUser] = await Promise.all([getAccessToken(), getAuthUser()])
      if (accessToken && authUser) {
        set({
          user: authUser as User,
          accessToken,
          isLoading: false,
        })
        get().checkAuth().catch(() => {})
      } else {
        set({ user: null, accessToken: null, isLoading: false })
      }
    } catch (error) {
      console.error('Error loading auth from storage:', error)
      set({ user: null, accessToken: null, isLoading: false })
    }
  }

  // Initialize immediately (fire and forget)
  initializeStore()

  return {
    // Start with default values - will be updated by initializeStore
    user: null,
    accessToken: null,
    isLoading: true, // Start with loading true, will be set to false after loading from storage
    error: null,
    
    loadFromStorage: async () => {
      try {
        const [accessToken, authUser] = await Promise.all([getAccessToken(), getAuthUser()])
        if (accessToken && authUser) {
          set({ user: authUser as User, accessToken, isLoading: false })
          await get().checkAuth()
        } else {
          set({ user: null, accessToken: null, isLoading: false })
        }
      } catch (error) {
        console.error('Error loading auth from storage:', error)
        set({ user: null, accessToken: null, isLoading: false })
      }
    },

    login: async (data: LoginRequest) => {
      set({ isLoading: true, error: null })
      try {
        await authApi.login(data)
        set({ isLoading: false, error: null })
      } catch (error) {
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Login failed',
        })
        throw error
      }
    },

    register: async (data: RegisterRequest) => {
      set({ isLoading: true, error: null })
      try {
        await authApi.register(data)
        set({ isLoading: false, error: null })
      } catch (error) {
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Registration failed',
        })
        throw error
      }
    },

    logout: async () => {
      set({ isLoading: true })
      try {
        await authApi.logout()
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        set({ isLoading: false, error: null })
      }
    },

    checkAuth: async () => {
      const token = await getAccessToken()
      if (!token) {
        await clearAuth()
        set({ user: null, accessToken: null, isLoading: false })
        return
      }
      try {
        const { usersApi } = await import('../services/usersApi')
        const user = await usersApi.getProfile()
        await setAuthUser(user)
        set({ accessToken: token, isLoading: false })
      } catch {
        await clearAuth()
        set({ user: null, accessToken: null, isLoading: false })
      }
    },

    clearError: () => set({ error: null }),
  }
})
