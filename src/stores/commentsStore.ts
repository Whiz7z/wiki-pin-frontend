import { create } from 'zustand'
import { commentsApi, type Comment, type CreateCommentRequest, type UpdateCommentRequest, type GetCommentsParams } from '../services/commentsApi'
import { emptyPaginationState, WithPagination } from './types'

interface CommentsState {
  comments: WithPagination<Comment[]>
  currentComment: Comment | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchAll: (params?: GetCommentsParams) => Promise<void>
  fetchById: (id: string) => Promise<void>
  fetchByPin: (pinId: string, params?: { limit?: number; offset?: number }) => Promise<void>
  /** Load next/previous page: fetches nextUrl, appends results, updates count/next/previous */
  fetchNextPage: (nextUrl: string) => Promise<void>
  create: (comment: CreateCommentRequest) => Promise<Comment>
  update: (id: string, updates: UpdateCommentRequest) => Promise<void>
  delete: (id: string) => Promise<void>
  clearError: () => void
  setCurrentComment: (comment: Comment | null) => void
  getNextUrl: () => string | null
  getPreviousUrl: () => string | null
}

export const useCommentsStore = create<CommentsState>((set, get) => ({
  comments: emptyPaginationState as WithPagination<Comment[]>,
  currentComment: null,
  isLoading: false,
  error: null,

  fetchAll: async (params?: GetCommentsParams) => {
    set({ isLoading: true, error: null })
    try {
      const comments = await commentsApi.getAll(params)
      set({ comments: { ...comments, results: comments.results }, isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch comments',
      })
    }
  },

  fetchById: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const comment = await commentsApi.getById(id)
      set({ currentComment: comment, isLoading: false })
      
      // Update in comments list if exists
      const comments = get().comments
      const updatedComments = comments.results.map(c => (c.id === id ? comment : c))
      set({ comments: { ...comments, results: updatedComments } })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch comment',
      })
    }
  },

  fetchByPin: async (pinId: string, params?: { limit?: number; offset?: number }) => {
    set({ isLoading: true, error: null })
    try {
      const comments = await commentsApi.getByPin(pinId, params)
      set({ comments: { ...comments, results: comments.results }, isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch comments',
      })
    }
  },

  fetchNextPage: async (nextUrl: string) => {
    set({ isLoading: true, error: null })
    try {
      const page = await commentsApi.getPage(nextUrl)
      set((state) => ({
        comments: {
          count: page.count,
          next: page.next,
          previous: page.previous,
          results: [...state.comments.results, ...page.results],
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

  create: async (comment: CreateCommentRequest) => {
    set({ isLoading: true, error: null })
    try {
      const newComment = await commentsApi.create(comment)
      const state = get()
      const limit = state.comments.results.length || 20
      await get().fetchByPin(comment.pinId, { limit, offset: 0 })
      return newComment
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create comment',
      })
      throw error
    }
  },

  update: async (id: string, updates: UpdateCommentRequest) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await commentsApi.update(id, updates)

      set((state) => {
        const results = state.comments.results.map(c => (c.id === id ? updated : c))
        const currentComment = state.currentComment?.id === id ? updated : state.currentComment
        return { comments: { ...state.comments, results }, currentComment, isLoading: false }
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update comment',
      })
      throw error
    }
  },

  delete: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const state = get()
      const comment = state.comments.results.find(c => c.id === id)
      const pinId = comment?.pinId
      const limit = state.comments.results.length

      await commentsApi.delete(id)

      if (pinId) {
        await get().fetchByPin(pinId, { limit: limit || 20, offset: 0 })
      } else {
        set((s) => ({
          comments: { ...s.comments, results: s.comments.results.filter(c => c.id !== id) },
          currentComment: s.currentComment?.id === id ? null : s.currentComment,
          isLoading: false,
        }))
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete comment',
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),

  getNextUrl: () => get().comments.next,
  getPreviousUrl: () => get().comments.previous,

  setCurrentComment: (comment: Comment | null) => set({ currentComment: comment }),
}))

