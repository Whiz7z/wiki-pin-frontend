import { apiRequest } from './api'

// Types
export interface User {
  id: number
  email: string
  name: string | null
  createdAt: string
  updatedAt: string
}

export const usersApi = {
  /**
   * Get all users
   */
  getAll: async (): Promise<User[]> => {
    return apiRequest<User[]>('/api/users')
  },

  /**
   * Get current user profile (requires authentication)
   */
  getProfile: async (): Promise<User> => {
    return apiRequest<User>('/api/protected/profile')
  },
}

