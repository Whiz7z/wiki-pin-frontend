/**
 * Hook for using auth store in content scripts
 * Reads from chrome.storage instead of Zustand to avoid React context issues
 */
import { useState, useEffect } from 'react'
import type { User } from '../services/authApi'

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
}

export const useAuthStoreContent = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
  })

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const result = await chrome.storage.local.get(['authUser', 'accessToken'])
        
        setState({
          user: result.authUser as User | null,
          accessToken: result.accessToken as string | null,
          isLoading: false,
        })
      } catch (error) {
        console.error('Error loading auth from storage:', error)
        setState({
          user: null,
          accessToken: null,
          isLoading: false,
        })
      }
    }

    loadAuth()

    // Listen for storage changes to sync auth state
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local') {
        if (changes.authUser || changes.accessToken) {
          loadAuth()
        }
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  return state
}

