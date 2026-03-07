const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export interface CreateArticleRequest {
  url: string
  title: string
  language: string
}

export interface Article {
  id: string
  url: string
  title: string
  language: string
  createdAt: string
  updatedAt: string
  _count: {
    pins: number
  }
}

export const articlesApi = {
  getArticles: async (): Promise<Article[]> => {
    const response = await fetch(`${API_BASE_URL}/api/articles`)
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Get articles failed' }))
      throw new Error(error.message || 'Get articles failed')
    }
    return response.json()
  },
  getArticle: async (id: string): Promise<Article> => {
    const response = await fetch(`${API_BASE_URL}/api/articles/${id}`)
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Get article failed' }))
      throw new Error(error.message || 'Get article failed')
    }
    return response.json()
  },
  createArticle: async (article: CreateArticleRequest) => {
    const response = await fetch(`${API_BASE_URL}/api/articles`, {
      method: 'POST',
      body: JSON.stringify(article),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Create article failed' }))
      throw new Error(error.message || 'Create article failed')
    }
    return response.json()
  },

  deleteArticle: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/api/articles/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Delete article failed' }))
      throw new Error(error.message || 'Delete article failed')
    }
    return response.json()
  },
}
