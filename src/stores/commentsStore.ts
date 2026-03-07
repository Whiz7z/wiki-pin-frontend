import { create } from 'zustand'
import { commentsApi, type Comment, type CreateCommentRequest, type UpdateCommentRequest, type GetCommentsParams } from '../services/commentsApi'

interface CommentsState {
  comments: Comment[]
  currentComment: Comment | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchAll: (params?: GetCommentsParams) => Promise<void>
  fetchById: (id: string) => Promise<void>
  fetchByPin: (pinId: string) => Promise<void>
  create: (comment: CreateCommentRequest) => Promise<Comment>
  update: (id: string, updates: UpdateCommentRequest) => Promise<void>
  delete: (id: string) => Promise<void>
  clearError: () => void
  setCurrentComment: (comment: Comment | null) => void
}

export const useCommentsStore = create<CommentsState>((set, get) => ({
  comments: [],
  currentComment: null,
  isLoading: false,
  error: null,

  fetchAll: async (params?: GetCommentsParams) => {
    set({ isLoading: true, error: null })
    try {
      const comments = await commentsApi.getAll(params)
      set({ comments, isLoading: false })
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
      const updateCommentInList = (comments: Comment[], targetId: string, updated: Comment): Comment[] => {
        return comments.map(c => {
          if (c.id === targetId) return updated
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: updateCommentInList(c.replies, targetId, updated) }
          }
          return c
        })
      }
      
      const comments = get().comments
      const updatedComments = updateCommentInList(comments, id, comment)
      set({ comments: updatedComments })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch comment',
      })
    }
  },

  fetchByPin: async (pinId: string) => {
    set({ isLoading: true, error: null })
    try {
      const comments = await commentsApi.getByPin(pinId)
      set({ comments, isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch comments',
      })
    }
  },

  create: async (comment: CreateCommentRequest) => {
    set({ isLoading: true, error: null })
    try {
      const newComment = await commentsApi.create(comment)
      
      // If it's a reply, add to parent's replies, otherwise add to top level
      if (comment.parentId) {
        const addReplyToParent = (comments: Comment[], parentId: string, reply: Comment): Comment[] => {
          return comments.map(c => {
            if (c.id === parentId) {
              return { ...c, replies: [...(c.replies || []), reply] }
            }
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: addReplyToParent(c.replies, parentId, reply) }
            }
            return c
          })
        }
        
        set((state) => ({
          comments: addReplyToParent(state.comments, comment.parentId!, newComment),
          isLoading: false,
        }))
      } else {
        set((state) => ({
          comments: [newComment, ...state.comments],
          isLoading: false,
        }))
      }
      
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
      
      const updateCommentInList = (comments: Comment[], targetId: string, updated: Comment): Comment[] => {
        return comments.map(c => {
          if (c.id === targetId) return updated
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: updateCommentInList(c.replies, targetId, updated) }
          }
          return c
        })
      }
      
      set((state) => {
        const comments = updateCommentInList(state.comments, id, updated)
        const currentComment = state.currentComment?.id === id ? updated : state.currentComment
        return { comments, currentComment, isLoading: false }
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
      await commentsApi.delete(id)
      
      // Remove from list (including nested replies)
      const removeCommentFromList = (comments: Comment[], targetId: string): Comment[] => {
        return comments
          .filter(c => c.id !== targetId)
          .map(c => {
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: removeCommentFromList(c.replies, targetId) }
            }
            return c
          })
      }
      
      set((state) => ({
        comments: removeCommentFromList(state.comments, id),
        currentComment: state.currentComment?.id === id ? null : state.currentComment,
        isLoading: false,
      }))
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete comment',
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
  
  setCurrentComment: (comment: Comment | null) => set({ currentComment: comment }),
}))

