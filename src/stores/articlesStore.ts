import { create } from 'zustand'
import { articlesApi, type Article, type CreateArticleRequest, type UpdateArticleRequest, type GetArticlesParams } from '../services/articlesApi'
import { getAuthUser } from '@/services/api'
import { User } from '@/services/authApi'
import { emptyPaginationState, WithPagination } from './types'
import { usePinsStore } from './pinsStore'

interface ArticlesState {
  articles: WithPagination<Article[]>
  isArticlesInitialized: boolean
  currentArticle: Article | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchAll: (params?: GetArticlesParams) => Promise<void>
  fetchById: (id: string) => Promise<void>
  fetchByUrl: (url: string) => Promise<void>
  fetchByUser: (userId: number | null) => Promise<void>
  /** Load next/previous page: fetches nextUrl, appends results, updates count/next/previous */
  fetchNextPage: (nextUrl: string) => Promise<void>
  create: (article: CreateArticleRequest) => Promise<Article>
  update: (id: string, updates: UpdateArticleRequest) => Promise<void>
  delete: (id: string) => Promise<void>
  updateUserTitle: (articleId: string, userTitle: string | null) => Promise<void>
  associate: (articleId: string) => Promise<void>
  disassociate: (articleId: string) => Promise<void>
  clearError: () => void
  setCurrentArticle: (article: Article | null) => void
  //getters
  getArticles: () => Article[]
  getNextUrl: () => string | null
  getPreviousUrl: () => string | null
}

export const useArticlesStore = create<ArticlesState>((set, get) => ({
  articles: emptyPaginationState as WithPagination<Article[]>,
  isArticlesInitialized: false,
  currentArticle: null,
  isLoading: false,
  error: null,

  //getters
  getArticles: () => get().articles.results,
  getNextUrl: () => get().articles.next,
  getPreviousUrl: () => get().articles.previous,

  //actions
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

  fetchNextPage: async (nextUrl: string) => {
    set({ isLoading: true, error: null })
    try {
      const page = await articlesApi.getPage(nextUrl)
      set((state) => ({
        articles: {
          count: page.count,
          next: page.next,
          previous: page.previous,
          results: [...state.articles.results, ...page.results],
        },
        isLoading: false,
      }))
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch next page',
      })
    }
  },

  fetchById: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const article = await articlesApi.getById(id)
      set({ currentArticle: article, isLoading: false })
      
      // Update in articles list if exists
      const articles = get().articles
      const index = articles.results.findIndex((a: Article) => a.id === id)
      if (index !== -1) {
        articles.results[index] = article
        set({ articles: { ...articles, results: articles.results } })
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
      const index = articles.results.findIndex((a: Article) => a.id === article.id)
      if (index !== -1) {
        articles.results[index] = article
        set({ articles })
      } else {
        // Add to list if not exists
        set({ articles: { ...articles, results: [...articles.results, article] } })
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
        articles: { ...state.articles, results: [newArticle, ...state.articles.results] },
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
        const articles = { ...state.articles, results: state.articles.results.map((a: Article) => a.id === id ? updated : a) }
        const currentArticle = state.currentArticle?.id === id ? updated : state.currentArticle
        return { articles: { ...state.articles, results: articles.results }, currentArticle, isLoading: false }
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
      const user: User | null = (await getAuthUser()) as User | null
      if (user?.id != null) {
        usePinsStore.getState().removeUserPinsForArticleFromCache(id, user.id)
      }
      usePinsStore.getState().triggerPinsRefresh()
      set((state) => ({
        articles: { ...state.articles, results: state.articles.results.filter((a: Article) => a.id !== id) },
        currentArticle: state.currentArticle?.id === id ? null : state.currentArticle,
        isLoading: false,
      }))
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to remove article from your list',
      })
      throw error
    }
  },

  updateUserTitle: async (articleId: string, userTitle: string | null) => {
    try {
      await articlesApi.updateUserTitle(articleId, userTitle)
      set((state) => {
        const results = state.articles.results.map((a) =>
          a.id === articleId ? { ...a, userTitle } : a
        )
        return {
          articles: { ...state.articles, results },
          currentArticle:
            state.currentArticle?.id === articleId
              ? { ...state.currentArticle, userTitle }
              : state.currentArticle,
        }
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update article title',
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
      const user: User | null = (await getAuthUser()) as User | null
      if (user?.id != null) {
        usePinsStore.getState().removeUserPinsForArticleFromCache(articleId, user.id)
      }
      usePinsStore.getState().triggerPinsRefresh()
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

