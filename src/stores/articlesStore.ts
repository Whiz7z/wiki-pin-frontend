import { create } from 'zustand'
import { articlesApi, type Article, type CreateArticleRequest, type UpdateArticleRequest, type GetArticlesParams } from '../services/articlesApi'
import { getAuthUser } from '@/services/api'
import { User } from '@/services/authApi'

interface ArticlesState {
  articles: Article[]
  isArticlesInitialized: boolean
  currentArticle: Article | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchAll: (params?: GetArticlesParams) => Promise<void>
  fetchById: (id: string) => Promise<void>
  fetchByUrl: (url: string) => Promise<void>
  fetchByUser: (userId: number | null) => Promise<void>
  create: (article: CreateArticleRequest) => Promise<Article>
  update: (id: string, updates: UpdateArticleRequest) => Promise<void>
  delete: (id: string) => Promise<void>
  associate: (articleId: string) => Promise<void>
  disassociate: (articleId: string) => Promise<void>
  clearError: () => void
  setCurrentArticle: (article: Article | null) => void
}

export const useArticlesStore = create<ArticlesState>((set, get) => ({
  articles: [],
  isArticlesInitialized: false,
  currentArticle: null,
  isLoading: false,
  error: null,

  fetchAll: async (params?: GetArticlesParams) => {
    set({ isLoading: true, error: null })
    try {
      const articles = await articlesApi.getAll(params)
      set({ articles, isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch articles',
      })
    } finally {
      set({ isArticlesInitialized: true })
    }
  },

  fetchById: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const article = await articlesApi.getById(id)
      set({ currentArticle: article, isLoading: false })
      
      // Update in articles list if exists
      const articles = get().articles
      const index = articles.findIndex(a => a.id === id)
      if (index !== -1) {
        articles[index] = article
        set({ articles })
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch article',
      })
    } finally {
      set({ isArticlesInitialized: true })
    }
  },

  fetchByUrl: async (url: string) => {
    set({ isLoading: true, error: null })
    try {
      const article = await articlesApi.getByUrl(url)
      set({ currentArticle: article, isLoading: false })
      
      // Update in articles list if exists
      const articles = get().articles
      const index = articles.findIndex(a => a.id === article.id)
      if (index !== -1) {
        articles[index] = article
        set({ articles })
      } else {
        // Add to list if not exists
        set({ articles: [...articles, article] })
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch article',
      })
    } finally {
      set({ isArticlesInitialized: true })
    }
  },

  fetchByUser: async (userId: number | null) => {
    set({ isLoading: true, error: null })
    try {
      const articles = await articlesApi.getByUser(userId || null)
      set({ articles, isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user articles',
      })
    } finally {
      set({ isLoading: false, isArticlesInitialized: true })
    }
  },

  create: async (article: CreateArticleRequest) => {
    set({ isLoading: true, error: null })
    try {
      const newArticle = await articlesApi.create(article)
      set((state) => ({
        articles: [newArticle, ...state.articles],
        currentArticle: newArticle,
        isLoading: false,
      }))
      return newArticle
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create article',
      })
      throw error
    } finally {
      const user: User | null = await getAuthUser() as User | null
      if (user) {
        await get().fetchByUser(user.id)
      }
      set({ isLoading: false })
    }
  },

  update: async (id: string, updates: UpdateArticleRequest) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await articlesApi.update(id, updates)
      set((state) => {
        const articles = state.articles.map(a => a.id === id ? updated : a)
        const currentArticle = state.currentArticle?.id === id ? updated : state.currentArticle
        return { articles, currentArticle, isLoading: false }
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update article',
      })
      throw error
    }
  },

  delete: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await articlesApi.delete(id)
      set((state) => ({
        articles: state.articles.filter(a => a.id !== id),
        currentArticle: state.currentArticle?.id === id ? null : state.currentArticle,
        isLoading: false,
      }))
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete article',
      })
      throw error
    }
  },

  associate: async (articleId: string) => {
    set({ isLoading: true, error: null })
    try {
      await articlesApi.associate(articleId)
      // Refresh article to get updated user associations
      await get().fetchById(articleId)
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to associate with article',
      })
      throw error
    }
  },

  disassociate: async (articleId: string) => {
    set({ isLoading: true, error: null })
    try {
      await articlesApi.disassociate(articleId)
      // Refresh article to get updated user associations
      await get().fetchById(articleId)
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to disassociate from article',
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
  
  setCurrentArticle: (article: Article | null) => set({ currentArticle: article }),
}))

