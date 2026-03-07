import { apiRequest } from './api'

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
  language: string
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
}

export const articlesApi = {
  /**
   * Get all articles with optional filters
   */
  getAll: async (params?: GetArticlesParams): Promise<Article[]> => {
    const queryParams = new URLSearchParams()
    if (params?.language) queryParams.append('language', params.language)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    
    const query = queryParams.toString()
    return apiRequest<Article[]>(`/api/articles${query ? `?${query}` : ''}`)
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
   * Get all articles for a specific user
   */
  getByUser: async (userId: number): Promise<Article[]> => {
    return apiRequest<Article[]>(`/api/articles/user/${userId}`)
  },

  /**
   * Get all users associated with an article
   */
  getUsers: async (articleId: string): Promise<ArticleUser[]> => {
    return apiRequest<ArticleUser[]>(`/api/articles/${articleId}/users`)
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
   * Delete an article (requires authentication)
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
}
