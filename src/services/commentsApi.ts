import { WithPagination } from '@/stores/types'
import { apiRequest, apiRequestByUrl } from './api'

// Types
export interface User {
  id: number
  email: string
  name: string | null
}

export interface Pin {
  id: string
  content: string
}

export interface Comment {
  id: string
  content: string
  pinId: string
  authorId: number
  createdAt: string
  updatedAt: string
  author?: User
  pin?: Pin
}

export interface CreateCommentRequest {
  content: string
  pinId: string
}

export interface UpdateCommentRequest {
  content?: string
}

export interface GetCommentsParams {
  pinId?: string
  authorId?: number
  limit?: number
  offset?: number
}

export const commentsApi = {
  /**
   * Get all comments with optional filters
   */
  getAll: async (params?: GetCommentsParams): Promise<WithPagination<Comment[]>> => {
    const queryParams = new URLSearchParams()
    if (params?.pinId) queryParams.append('pinId', params.pinId)
    if (params?.authorId) queryParams.append('authorId', params.authorId.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    
    const query = queryParams.toString()
    return apiRequest<WithPagination<Comment[]>>(`/api/comments${query ? `?${query}` : ''}`)
  },

  /**
   * Get a page of results using next/previous URL (for load-more).
   */
  getPage: async (nextUrl: string): Promise<WithPagination<Comment[]>> => {
    return apiRequestByUrl<WithPagination<Comment[]>>(nextUrl)
  },

  /**
   * Get comment by ID
   */
  getById: async (id: string): Promise<Comment> => {
    return apiRequest<Comment>(`/api/comments/${id}`)
  },

  /**
   * Get all comments for a specific pin (paginated)
   */
  getByPin: async (pinId: string, params?: { limit?: number; offset?: number }): Promise<WithPagination<Comment[]>> => {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    const query = queryParams.toString()
    return apiRequest<WithPagination<Comment[]>>(`/api/comments/pin/${pinId}${query ? `?${query}` : ''}`)
  },

  /**
   * Create a new comment (requires authentication)
   */
  create: async (comment: CreateCommentRequest): Promise<Comment> => {
    return apiRequest<Comment>('/api/comments', {
      method: 'POST',
      body: JSON.stringify(comment),
    })
  },

  /**
   * Update a comment (requires authentication, only author)
   */
  update: async (id: string, updates: UpdateCommentRequest): Promise<Comment> => {
    return apiRequest<Comment>(`/api/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  /**
   * Delete a comment (hard delete, requires authentication, only author)
   */
  delete: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/api/comments/${id}`, {
      method: 'DELETE',
    })
  },
}

