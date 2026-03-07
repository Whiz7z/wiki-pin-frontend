import { apiRequest } from './api'

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
  content: string
  selector: string
  position: Record<string, unknown> | null
  articleId: string
  authorId: number
  status: string
  createdAt: string
  updatedAt: string
  author?: User
  article?: Article
  _count?: {
    comments: number
  }
}

export interface CreatePinRequest {
  content: string
  selector: string
  position?: Record<string, unknown>
  articleId: string
}

export interface UpdatePinRequest {
  content?: string
  selector?: string
  position?: Record<string, unknown>
  status?: string
}

export interface GetPinsParams {
  articleId?: string
  authorId?: number
  status?: string
  limit?: number
  offset?: number
}

export const pinsApi = {
  /**
   * Get all pins with optional filters
   */
  getAll: async (params?: GetPinsParams): Promise<Pin[]> => {
    const queryParams = new URLSearchParams()
    if (params?.articleId) queryParams.append('articleId', params.articleId)
    if (params?.authorId) queryParams.append('authorId', params.authorId.toString())
    if (params?.status) queryParams.append('status', params.status)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    
    const query = queryParams.toString()
    return apiRequest<Pin[]>(`/api/pins${query ? `?${query}` : ''}`)
  },

  /**
   * Get pin by ID
   */
  getById: async (id: string): Promise<Pin> => {
    return apiRequest<Pin>(`/api/pins/${id}`)
  },

  /**
   * Create a new pin (requires authentication)
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

