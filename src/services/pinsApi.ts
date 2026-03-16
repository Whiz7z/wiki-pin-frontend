import { WithPagination } from '@/stores/types'
import { apiRequest, apiRequestByUrl } from './api'

// Types
export interface User {
  id: number
  email: string
  name: string | null
}

export interface Article {
  id: string
  url: string
  title: string
}

export interface Pin {
  id: string
  title: string
  content: string
  selector: string
  articleId: string
  authorId: number
  createdAt: string
  updatedAt: string
  author?: User
  article?: Article
  _count?: {
    comments: number
  }
}

export interface CreatePinRequest {
  title: string
  content: string
  selector: string
  articleId: string
}

export interface UpdatePinRequest {
  title?: string
  content?: string
  selector?: string
}

export interface GetPinsParams {
  articleId?: string
  authorId?: number
  limit?: number
  offset?: number
}

/** Thrown by apiRequest on validation error (body.errors); form can read fieldErrors for setError. Else apiRequest throws Error. */
export interface PinApiError {
  message?: string
  fieldErrors?: Record<string, string>
}

export const pinsApi = {
  /**
   * Get all pins with optional filters
   */
  getAll: async (params?: GetPinsParams): Promise<WithPagination<Pin[]>> => {
    const queryParams = new URLSearchParams()
    if (params?.articleId) queryParams.append('articleId', params.articleId)
    if (params?.authorId) queryParams.append('authorId', params.authorId.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    
    const query = queryParams.toString()
    return apiRequest<WithPagination<Pin[]>>(`/api/pins${query ? `?${query}` : ''}`)
  },

  /**
   * Get a page of results using next/previous URL (for load-more).
   */
  getPage: async (nextUrl: string): Promise<WithPagination<Pin[]>> => {
    return apiRequestByUrl<WithPagination<Pin[]>>(nextUrl)
  },

  /**
   * Get pin by ID
   */
  getById: async (id: string): Promise<Pin> => {
    return apiRequest<Pin>(`/api/pins/${id}`)
  },

  /**
   * Create a new pin (requires authentication).
   * Uses apiRequest (auth + token refresh). On validation error apiRequest throws
   * an object with message and fieldErrors for form setError.
   */
  create: async (pin: CreatePinRequest): Promise<Pin> => {
    return apiRequest<Pin>('/api/pins', {
      method: 'POST',
      body: JSON.stringify(pin),
    })
  },

  /**
   * Update a pin (requires authentication, only author)
   */
  update: async (id: string, updates: UpdatePinRequest): Promise<Pin> => {
    return apiRequest<Pin>(`/api/pins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  /**
   * Delete a pin (soft delete, requires authentication, only author)
   */
  delete: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/api/pins/${id}`, {
      method: 'DELETE',
    })
  },
}

