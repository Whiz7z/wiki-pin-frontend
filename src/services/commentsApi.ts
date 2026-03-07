import { apiRequest } from './api'

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
  parentId: string | null
  status: string
  createdAt: string
  updatedAt: string
  author?: User
  pin?: Pin
  parent?: Comment
  replies?: Comment[]
  _count?: {
    replies: number
  }
}

export interface CreateCommentRequest {
  content: string
  pinId: string
  parentId?: string
}

export interface UpdateCommentRequest {
  content?: string
  status?: string
}

export interface GetCommentsParams {
  pinId?: string
  authorId?: number
  parentId?: string | null
  status?: string
  limit?: number
  offset?: number
}

export const commentsApi = {
  /**
   * Get all comments with optional filters
   */
  getAll: async (params?: GetCommentsParams): Promise<Comment[]> => {
    const queryParams = new URLSearchParams()
    if (params?.pinId) queryParams.append('pinId', params.pinId)
    if (params?.authorId) queryParams.append('authorId', params.authorId.toString())
    if (params?.parentId !== undefined) {
      queryParams.append('parentId', params.parentId === null ? 'null' : params.parentId)
    }
    if (params?.status) queryParams.append('status', params.status)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    
    const query = queryParams.toString()
    return apiRequest<Comment[]>(`/api/comments${query ? `?${query}` : ''}`)
  },

  /**
   * Get comment by ID
   */
  getById: async (id: string): Promise<Comment> => {
    return apiRequest<Comment>(`/api/comments/${id}`)
  },

  /**
   * Get all comments for a specific pin with nested replies
   */
  getByPin: async (pinId: string): Promise<Comment[]> => {
    return apiRequest<Comment[]>(`/api/comments/pin/${pinId}`)
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
   * Delete a comment (soft delete, requires authentication, only author)
   */
  delete: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/api/comments/${id}`, {
      method: 'DELETE',
    })
  },
}

