import { WithPagination } from '@/stores/types'
import { apiRequest, apiRequestByUrl } from './api'

// Types
export interface User {
  id: number
  email: string
  name: string | null
}

export interface ArticleUser {
  id: number
  email: string
  name: string | null
  associatedAt: string
}

export interface Article {
  id: string
  url: string
  title: string
  userTitle?: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    pins: number
    users: number
  }
  users?: Array<{
    user: User
    createdAt: string
  }>
  pins?: Array<{
    id: string
    content: string
    title: string
    selector: string
    articleId: string
    authorId: number
  }>
}

export interface CreateArticleRequest {
  url: string
  title: string
  language?: string
}

export interface UpdateArticleRequest {
  title?: string
  language?: string
}

export interface GetArticlesParams {
  language?: string
  limit?: number
  offset?: number
  next?: string
  previous?: string
}

export const articlesApi = {
  /**
   * Get all articles with optional filters
   */
  getAll: async (params?: GetArticlesParams): Promise<WithPagination<Article[]>> => {
    const queryParams = new URLSearchParams()
    if (params?.language) queryParams.append('language', params.language)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    
    const query = queryParams.toString()
    return apiRequest<WithPagination<Article[]>>(`/api/articles${query ? `?${query}` : ''}`)
  },

  /**
   * Get a page of results using next/previous URL (for load-more). Use response.next or response.previous.
   */
  getPage: async (nextUrl: string): Promise<WithPagination<Article[]>> => {
    return apiRequestByUrl<WithPagination<Article[]>>(nextUrl)
  },


  /**
   * Get article by ID
   */
  getById: async (id: string): Promise<Article> => {
    return apiRequest<Article>(`/api/articles/${id}`)
  },

  /**
   * Get article by URL (URL should be encoded)
   */
  getByUrl: async (url: string): Promise<Article> => {
    const encodedUrl = encodeURIComponent(url)
    return apiRequest<Article>(`/api/articles/url/${encodedUrl}`)
  },

  /**
   * Get all articles for a specific user (paginated)
   */
  getByUser: async (userId: number | null, params?: { limit?: number; offset?: number }): Promise<WithPagination<Article[]>> => {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    const query = queryParams.toString()
    return apiRequest<WithPagination<Article[]>>(`/api/articles/user/${userId}${query ? `?${query}` : ''}`)
  },

  /**
   * Get all users associated with an article (paginated)
   */
  getUsers: async (articleId: string, params?: { limit?: number; offset?: number }): Promise<WithPagination<ArticleUser[]>> => {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    const query = queryParams.toString()
    return apiRequest<WithPagination<ArticleUser[]>>(`/api/articles/${articleId}/users${query ? `?${query}` : ''}`)
  },

  /**
   * Create a new article (requires authentication)
   */
  create: async (article: CreateArticleRequest): Promise<Article> => {
    return apiRequest<Article>('/api/articles', {
      method: 'POST',
      body: JSON.stringify(article),
    })
  },

  /**
   * Update an article (requires authentication)
   */
  update: async (id: string, updates: UpdateArticleRequest): Promise<Article> => {
    return apiRequest<Article>(`/api/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  /**
   * Remove the current user's association with an article (requires authentication).
   * Deletes that user's pins on the article (and their comments); article and other users' pins remain.
   */
  delete: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/api/articles/${id}`, {
      method: 'DELETE',
    })
  },

  /**
   * Associate current user with an article (requires authentication)
   */
  associate: async (articleId: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/api/articles/${articleId}/associate`, {
      method: 'POST',
    })
  },

  /**
   * Remove current user's association with an article (requires authentication)
   */
  disassociate: async (articleId: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/api/articles/${articleId}/associate`, {
      method: 'DELETE',
    })
  },

  /**
   * Update current user's display title for an article (requires authentication)
   */
  updateUserTitle: async (articleId: string, userTitle: string | null): Promise<{ message: string; userTitle: string | null }> => {
    return apiRequest<{ message: string; userTitle: string | null }>(`/api/articles/${articleId}/user-title`, {
      method: 'PATCH',
      body: JSON.stringify({ userTitle }),
    })
  },
}
