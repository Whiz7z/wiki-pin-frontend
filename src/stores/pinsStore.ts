import { create } from 'zustand'
import { pinsApi, type Pin, type CreatePinRequest, type UpdatePinRequest, type GetPinsParams } from '../services/pinsApi'
import { emptyPaginationState, WithPagination } from './types'

/** Matches backend `DEFAULT_PAGE_SIZE` in wiki-pin-backend/lib/pagination.ts */
export const PINS_PAGE_SIZE = 5

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: string }).message === 'string') {
    return (error as { message: string }).message
  }
  if (typeof error === 'object' && error !== null && 'error' in error && typeof (error as { error: string }).error === 'string') {
    return (error as { error: string }).error
  }
  return fallback
}

export type ArticlePinsPagination = {
  count: number
  next: string | null
  previous: string | null
}

interface PinsState {
  pins: WithPagination<Pin[]>
  currentPin: Pin | null
  isLoading: boolean
  error: string | null
  /** Bump this to trigger ShowPinsMode (and others) to re-fetch and redraw pins (e.g. after delete). */
  pinsRefreshKey: number

  /** Cached pins per article (popup lazy-load + content script after fetchAll by article). */
  pinsByArticleId: Record<string, Pin[]>
  pinsPaginationByArticleId: Record<string, ArticlePinsPagination>
  pinsLoadingByArticleId: Record<string, boolean>
  /** True while appending the next page for an article (infinite scroll). */
  pinsLoadingMoreByArticleId: Record<string, boolean>
  pinsErrorByArticleId: Record<string, string | null>

  // Actions
  fetchAll: (params?: GetPinsParams) => Promise<void>
  /** Lazy-load (or refresh) first page of pins for one article. */
  fetchPinsForArticle: (articleId: string) => Promise<void>
  /** Append next page for an article using pagination `next` URL. */
  fetchNextPageForArticle: (articleId: string) => Promise<void>
  /** Call after a pin is deleted so content-script ShowPinsMode re-runs and redraws. */
  triggerPinsRefresh: () => void
  /** After dissociating from an article: drop this user's pins for that article from cache (server already deleted them). */
  removeUserPinsForArticleFromCache: (articleId: string, userId: number) => void
  /** Set pins from cache/fallback (e.g. when API fails). Pass articleId when known (content script). */
  setPinsResults: (results: Pin[], articleId?: string) => void
  fetchById: (id: string) => Promise<void>
  /** Load next/previous page: fetches nextUrl, appends results, updates count/next/previous */
  fetchNextPage: (nextUrl: string) => Promise<void>
  create: (pin: CreatePinRequest) => Promise<Pin>
  update: (id: string, updates: UpdatePinRequest) => Promise<void>
  delete: (id: string) => Promise<void>
  clearError: () => void
  setCurrentPin: (pin: Pin | null) => void
  getPins: (articleId: string) => Pin[]
  getNextUrl: () => string | null
  getPreviousUrl: () => string | null
  getPaginationForArticle: (articleId: string) => ArticlePinsPagination | undefined
}

export const usePinsStore = create<PinsState>((set, get) => ({
  pins: emptyPaginationState as WithPagination<Pin[]>,
  currentPin: null,
  isLoading: false,
  error: null,
  pinsRefreshKey: 0,

  pinsByArticleId: {},
  pinsPaginationByArticleId: {},
  pinsLoadingByArticleId: {},
  pinsLoadingMoreByArticleId: {},
  pinsErrorByArticleId: {},

  triggerPinsRefresh: () => set((s) => ({ pinsRefreshKey: s.pinsRefreshKey + 1 })),

  removeUserPinsForArticleFromCache: (articleId: string, userId: number) => {
    const shouldRemove = (p: Pin) => p.articleId === articleId && p.authorId === userId
    set((state) => {
      const filteredGlobal = state.pins.results.filter((p) => !shouldRemove(p))
      const prevList = state.pinsByArticleId[articleId] ?? []
      const filteredByArticle = prevList.filter((p) => !shouldRemove(p))
      const prevPag = state.pinsPaginationByArticleId[articleId]
      const currentPin =
        state.currentPin && shouldRemove(state.currentPin) ? null : state.currentPin
      return {
        pins: { ...state.pins, results: filteredGlobal },
        pinsByArticleId: { ...state.pinsByArticleId, [articleId]: filteredByArticle },
        pinsPaginationByArticleId:
          prevPag != null
            ? {
                ...state.pinsPaginationByArticleId,
                [articleId]: { ...prevPag, count: filteredByArticle.length },
              }
            : state.pinsPaginationByArticleId,
        currentPin,
      }
    })
  },

  setPinsResults: (results: Pin[], articleId?: string) => {
    const aid = articleId ?? results[0]?.articleId
    set((state) => ({
      pins: {
        count: results.length,
        next: null,
        previous: null,
        results,
      },
      ...(aid
        ? {
            pinsByArticleId: { ...state.pinsByArticleId, [aid]: results },
            pinsPaginationByArticleId: {
              ...state.pinsPaginationByArticleId,
              [aid]: { count: results.length, next: null, previous: null },
            },
          }
        : {}),
    }))
  },

  fetchPinsForArticle: async (articleId: string) => {
    set((s) => ({
      pinsLoadingByArticleId: { ...s.pinsLoadingByArticleId, [articleId]: true },
      pinsErrorByArticleId: { ...s.pinsErrorByArticleId, [articleId]: null },
    }))
    try {
      const page = await pinsApi.getAll({ articleId, limit: PINS_PAGE_SIZE, offset: 0 })
      set((s) => ({
        pinsByArticleId: { ...s.pinsByArticleId, [articleId]: page.results },
        pinsPaginationByArticleId: {
          ...s.pinsPaginationByArticleId,
          [articleId]: {
            count: page.count,
            next: page.next,
            previous: page.previous,
          },
        },
        pinsLoadingByArticleId: { ...s.pinsLoadingByArticleId, [articleId]: false },
      }))
    } catch (error) {
      set((s) => ({
        pinsLoadingByArticleId: { ...s.pinsLoadingByArticleId, [articleId]: false },
        pinsErrorByArticleId: {
          ...s.pinsErrorByArticleId,
          [articleId]: getErrorMessage(error, 'Failed to fetch pins'),
        },
      }))
    }
  },

  fetchNextPageForArticle: async (articleId: string) => {
    const { next } = get().pinsPaginationByArticleId[articleId] ?? {}
    if (!next) return
    if (get().pinsLoadingMoreByArticleId[articleId]) return

    set((s) => ({
      pinsLoadingMoreByArticleId: { ...s.pinsLoadingMoreByArticleId, [articleId]: true },
      pinsErrorByArticleId: { ...s.pinsErrorByArticleId, [articleId]: null },
    }))
    try {
      const page = await pinsApi.getPage(next)
      set((s) => {
        const prev = s.pinsByArticleId[articleId] ?? []
        const merged: Pin[] = []
        const seen = new Set<string>()
        for (const p of [...prev, ...page.results]) {
          if (!seen.has(p.id)) {
            seen.add(p.id)
            merged.push(p)
          }
        }
        return {
          pinsByArticleId: { ...s.pinsByArticleId, [articleId]: merged },
          pinsPaginationByArticleId: {
            ...s.pinsPaginationByArticleId,
            [articleId]: {
              count: page.count,
              next: page.next,
              previous: page.previous,
            },
          },
          pinsLoadingMoreByArticleId: { ...s.pinsLoadingMoreByArticleId, [articleId]: false },
        }
      })
    } catch (error) {
      set((s) => ({
        pinsLoadingMoreByArticleId: { ...s.pinsLoadingMoreByArticleId, [articleId]: false },
        pinsErrorByArticleId: {
          ...s.pinsErrorByArticleId,
          [articleId]: getErrorMessage(error, 'Failed to load more pins'),
        },
      }))
    }
  },

  fetchAll: async (params?: GetPinsParams) => {
    set({ isLoading: true, error: null })
    try {
      const limit = params?.limit ?? PINS_PAGE_SIZE
      const offset = params?.offset ?? 0
      const data = await pinsApi.getAll({ ...params, limit, offset })
      set((state) => {
        const base = {
          pins: { ...data, results: data.results },
          isLoading: false,
        }
        if (params?.articleId) {
          const aid = params.articleId
          return {
            ...base,
            pinsByArticleId: {
              ...state.pinsByArticleId,
              [aid]: data.results,
            },
            pinsPaginationByArticleId: {
              ...state.pinsPaginationByArticleId,
              [aid]: {
                count: data.count,
                next: data.next,
                previous: data.previous,
              },
            },
            pinsLoadingByArticleId: { ...state.pinsLoadingByArticleId, [aid]: false },
            pinsErrorByArticleId: { ...state.pinsErrorByArticleId, [aid]: null },
          }
        }
        return base
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pins',
      })
    }
  },

  fetchNextPage: async (nextUrl: string) => {
    set({ isLoading: true, error: null })
    try {
      const page = await pinsApi.getPage(nextUrl)
      set((state) => {
        const merged = [...state.pins.results, ...page.results]
        const articleId = page.results[0]?.articleId
        const nextPins: WithPagination<Pin[]> = {
          count: page.count,
          next: page.next,
          previous: page.previous,
          results: merged,
        }
        if (articleId) {
          return {
            pins: nextPins,
            pinsByArticleId: {
              ...state.pinsByArticleId,
              [articleId]: merged,
            },
            pinsPaginationByArticleId: {
              ...state.pinsPaginationByArticleId,
              [articleId]: {
                count: page.count,
                next: page.next,
                previous: page.previous,
              },
            },
            isLoading: false,
          }
        }
        return { pins: nextPins, isLoading: false }
      })
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
      const pin = await pinsApi.getById(id)
      set((state) => {
        const pins = state.pins
        const index = pins.results.findIndex((p: Pin) => p.id === id)
        const nextResults =
          index !== -1 ? pins.results.map((p, i) => (i === index ? pin : p)) : pins.results
        const aid = pin.articleId
        const prevByArticle = state.pinsByArticleId[aid]
        const nextByArticle =
          prevByArticle != null
            ? {
                ...state.pinsByArticleId,
                [aid]: prevByArticle.some((p) => p.id === id)
                  ? prevByArticle.map((p) => (p.id === id ? pin : p))
                  : prevByArticle,
              }
            : state.pinsByArticleId

        return {
          currentPin: pin,
          isLoading: false,
          pins: { ...pins, results: nextResults },
          pinsByArticleId: nextByArticle,
        }
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pin',
      })
    }
  },

  create: async (pin: CreatePinRequest) => {
    set({ isLoading: true, error: null })
    try {
      const newPin = await pinsApi.create(pin)
      set((state) => {
        const aid = newPin.articleId
        const prevList = state.pinsByArticleId[aid] ?? []
        return {
          pins: { ...state.pins, results: [newPin, ...state.pins.results] },
          pinsByArticleId: { ...state.pinsByArticleId, [aid]: [newPin, ...prevList] },
          currentPin: newPin,
          isLoading: false,
        }
      })
      return newPin
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Failed to create pin'),
      })
      throw error
    }
  },

  update: async (id: string, updates: UpdatePinRequest) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await pinsApi.update(id, updates)
      set((state) => {
        const aid = updated.articleId
        const list = state.pinsByArticleId[aid]
        const pinsByArticleId =
          list != null
            ? {
                ...state.pinsByArticleId,
                [aid]: list.map((p: Pin) => (p.id === id ? updated : p)),
              }
            : state.pinsByArticleId
        const pins = {
          ...state.pins,
          results: state.pins.results.map((p: Pin) => (p.id === id ? updated : p)),
        }
        const currentPin = state.currentPin?.id === id ? updated : state.currentPin
        return { pins, pinsByArticleId, currentPin, isLoading: false }
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update pin',
      })
      throw error
    }
  },

  delete: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await pinsApi.delete(id)
      set((state) => {
        const fromGlobal = state.pins.results.find((p) => p.id === id)
        let aid = fromGlobal?.articleId
        if (aid == null) {
          for (const [k, list] of Object.entries(state.pinsByArticleId)) {
            if (list.some((p) => p.id === id)) {
              aid = k
              break
            }
          }
        }
        const filterOut = (ps: Pin[]) => ps.filter((p: Pin) => p.id !== id)
        return {
          pins: { ...state.pins, results: filterOut(state.pins.results) },
          pinsByArticleId:
            aid != null
              ? { ...state.pinsByArticleId, [aid]: filterOut(state.pinsByArticleId[aid] ?? []) }
              : state.pinsByArticleId,
          currentPin: state.currentPin?.id === id ? null : state.currentPin,
          isLoading: false,
        }
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete pin',
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),

  getNextUrl: () => get().pins.next,
  getPreviousUrl: () => get().pins.previous,
  getPins: (articleId: string) => get().pinsByArticleId[articleId] ?? [],
  getPaginationForArticle: (articleId: string) => get().pinsPaginationByArticleId[articleId],

  setCurrentPin: (pin: Pin | null) => set({ currentPin: pin }),
}))
