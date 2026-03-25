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
  wikipediaRevisionId?: string | null
  wikipediaRevisionTimestamp?: string | null
  wikipediaRevisionLastCheckedAt?: string | null
}

export type PinRelevance = 'active' | 'at_risk' | 'needs_reassignment' | 'unknown'

export interface Pin {
  id: string
  title: string
  content: string
  selector: string
  articleId: string
  authorId: number
  createdAt: string
  updatedAt: string
  relevance?: PinRelevance | string
  decayReason?: string | null
  anchorTextHash?: string | null
  lastAcknowledgedArticleRevisionId?: string | null
  /** Document Y (px) for top-to-bottom ordering; from getBoundingClientRect().top + scrollY */
  yOffset?: number | null
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
  anchorText?: string
  yOffset?: number
}

export interface UpdatePinRequest {
  title?: string
  content?: string
  selector?: string
  yOffset?: number | null
}

export interface ReanchorPinRequest {
  currentText: string
  newSelector?: string
  /** Document Y for vertical ordering; set from new anchor element or current pin element. */
  yOffset?: number | null
}

export interface GetPinsParams {
  articleId?: string
  authorId?: number
  relevance?: string
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
    if (params?.relevance) queryParams.append('relevance', params.relevance)
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

  /**
   * Mark pin relevance active; does not change anchor hash or selector (author only).
   */
  refresh: async (id: string): Promise<Pin> => {
    return apiRequest<Pin>(`/api/pins/${id}/refresh`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  },

  /**
   * Re-anchor pin: optional new XPath; updates anchor hash from currentText (author only).
   */
  reanchor: async (id: string, body: ReanchorPinRequest): Promise<Pin> => {
    return apiRequest<Pin>(`/api/pins/${id}/reanchor`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
}
