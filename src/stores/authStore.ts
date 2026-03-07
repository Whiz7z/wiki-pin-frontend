import { create } from 'zustand'
import { authApi, type User, type LoginRequest, type RegisterRequest } from '../services/authApi'
import { getAccessToken } from '../services/api'

interface AuthState {
  user: User | null
  accessToken: string | null // Store token in state for quick access
  isLoading: boolean
  error: string | null
  
  // Actions
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
  // Load from storage immediately when store is created
  const initializeStore = async () => {
    try {
      const stored = await chrome.storage.local.get(['user', 'accessToken'])
      if (stored.user && stored.accessToken) {
        set({
          user: stored.user as User,
          accessToken: stored.accessToken as string,
          isLoading: false,
        })
        // Verify token is still valid in the background
        get().checkAuth().catch(() => {
          // If check fails, it will clear the state
        })
      } else {
        set({ 
          accessToken: null,
          isLoading: false 
        })
      }
    } catch (error) {
      console.error('Error loading auth from storage:', error)
      set({ 
        accessToken: null,
        isLoading: false 
      })
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
        const stored = await chrome.storage.local.get(['authUser', 'accessToken'])
        if (stored.authUser && stored.accessToken) {
          set({
            user: stored.authUser as User,
            accessToken: stored.accessToken as string,
            isLoading: false,
          })
          // Verify token is still valid
          await get().checkAuth()
        } else {
          set({ 
            accessToken: null,
            isLoading: false 
          })
        }
      } catch (error) {
        console.error('Error loading auth from storage:', error)
        set({ 
          accessToken: null,
          isLoading: false 
        })
      }
    },

    login: async (data: LoginRequest) => {
      set({ isLoading: true, error: null })
      try {
        const response = await authApi.login(data)
        await chrome.storage.local.set({
          authUser: response.user,
        })
        set({
          user: response.user,
          accessToken: response.accessToken,
          isLoading: false,
          error: null,
        })
      } catch (error) {
        set({
          accessToken: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Login failed',
        })
        throw error
      }
    },

    register: async (data: RegisterRequest) => {
      set({ isLoading: true, error: null })
      try {
        const response = await authApi.register(data)
        await chrome.storage.local.set({
          authUser: response.user,
        })
        set({
          user: response.user,
          accessToken: response.accessToken,
          isLoading: false,
          error: null,
        })
      } catch (error) {
        set({
          accessToken: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Registration failed',
        })
        throw error
      }
    },

    logout: async () => {
      set({ isLoading: true })
      try {
        const refreshToken = (await chrome.storage.local.get(['refreshToken'])).refreshToken
        if (refreshToken) {
          await authApi.logout({ refreshToken: refreshToken as string })
        }
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        await chrome.storage.local.remove(['authUser'])
        set({
          user: null,
          accessToken: null,
          isLoading: false,
          error: null,
        })
      }
    },

    checkAuth: async () => {
      const token = await getAccessToken()
      if (token) {
        try {
          const { usersApi } = await import('../services/usersApi')
          const user = await usersApi.getProfile()
          await chrome.storage.local.set({
            authUser: user,
          })
          set({
            user,
            accessToken: token,
            isLoading: false,
          })
        } catch (error) {
          // Token might be invalid, clear auth state
          await chrome.storage.local.remove(['authUser'])
          set({
            user: null,
            accessToken: null,
            isLoading: false,
          })
        }
      } else {
        await chrome.storage.local.remove(['authUser'])
        set({
          user: null,
          accessToken: null,
          isLoading: false,
        })
      }
    },

    clearError: () => set({ error: null }),
  }
})
