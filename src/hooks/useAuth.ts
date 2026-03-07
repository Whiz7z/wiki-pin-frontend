import { useState, useEffect } from 'react'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  accessToken: string | null
  user: any | null
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    accessToken: null,
    user: null,
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await chrome.storage.local.get(['accessToken', 'user'])
        setAuthState({
          isAuthenticated: !!result.accessToken,
          isLoading: false,
          accessToken: result.accessToken as string | null,
          user: result.user || null,
        })
      } catch (error) {
        console.error('Error checking auth:', error)
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          accessToken: null,
          user: null,
        })
      }
    }

    checkAuth()

    // Listen for storage changes (e.g., when user logs in/out)
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local') {
        if (changes.accessToken || changes.user) {
          checkAuth()
        }
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  return authState
}

