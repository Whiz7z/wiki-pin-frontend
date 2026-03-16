import { WithPagination } from '@/stores/types'
import { apiRequest, apiRequestByUrl } from './api'

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
   * Get all users (paginated)
   */
  getAll: async (params?: { limit?: number; offset?: number }): Promise<WithPagination<User[]>> => {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    const query = queryParams.toString()
    return apiRequest<WithPagination<User[]>>(`/api/users${query ? `?${query}` : ''}`)
  },

  /**
   * Get a page of results using next/previous URL (for load-more).
   */
  getPage: async (nextUrl: string): Promise<WithPagination<User[]>> => {
    return apiRequestByUrl<WithPagination<User[]>>(nextUrl)
  },

  /**
   * Get current user profile (requires authentication)
   */
  getProfile: async (): Promise<User> => {
    return apiRequest<User>('/api/protected/profile')
  },
}

