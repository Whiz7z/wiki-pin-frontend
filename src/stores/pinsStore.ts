import { create } from 'zustand'
import { pinsApi, type Pin, type CreatePinRequest, type UpdatePinRequest, type GetPinsParams } from '../services/pinsApi'
import { emptyPaginationState, WithPagination } from './types'

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

interface PinsState {
  pins: WithPagination<Pin[]>
  currentPin: Pin | null
  isLoading: boolean
  error: string | null
  /** Bump this to trigger ShowPinsMode (and others) to re-fetch and redraw pins (e.g. after delete). */
  pinsRefreshKey: number

  // Actions
  fetchAll: (params?: GetPinsParams) => Promise<void>
  /** Call after a pin is deleted so content-script ShowPinsMode re-runs and redraws. */
  triggerPinsRefresh: () => void
  /** Set pins from cache/fallback (e.g. when API fails). Replaces current list. */
  setPinsResults: (results: Pin[]) => void
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
}

export const usePinsStore = create<PinsState>((set, get) => ({
  pins: emptyPaginationState as WithPagination<Pin[]>,
  currentPin: null,
  isLoading: false,
  error: null,
  pinsRefreshKey: 0,

  triggerPinsRefresh: () => set((s) => ({ pinsRefreshKey: s.pinsRefreshKey + 1 })),

  setPinsResults: (results: Pin[]) =>
    set({
      pins: {
        count: results.length,
        next: null,
        previous: null,
        results,
      },
    }),

  fetchAll: async (params?: GetPinsParams) => {
    set({ isLoading: true, error: null })
    try {
      const pins = await pinsApi.getAll(params)
      set({ pins: { ...pins, results: pins.results }, isLoading: false })
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
      set((state) => ({
        pins: {
          count: page.count,
          next: page.next,
          previous: page.previous,
          results: [...state.pins.results, ...page.results],
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
      const pin = await pinsApi.getById(id)
      set({ currentPin: pin, isLoading: false })
      
      // Update in pins list if exists
      const pins = get().pins
      const index = pins.results.findIndex((p: Pin) => p.id === id)
      if (index !== -1) {
        pins.results[index] = pin
        set({ pins: { ...pins, results: pins.results } })
      }
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
      set((state) => ({
        pins: { ...state.pins, results: [newPin, ...state.pins.results] },
        currentPin: newPin,
        isLoading: false,
      }))
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
        const pins = { ...state.pins, results: state.pins.results.map((p: Pin) => p.id === id ? updated : p) }
        const currentPin = state.currentPin?.id === id ? updated : state.currentPin
        return { pins: { ...state.pins, results: pins.results }, currentPin, isLoading: false }
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
      set((state) => ({
        pins: { ...state.pins, results: state.pins.results.filter((p: Pin) => p.id !== id) },
        currentPin: state.currentPin?.id === id ? null : state.currentPin,
        isLoading: false,
      }))

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
  getPins: (articleId: string) => get().pins.results.filter((p: Pin) => p.articleId === articleId),
  setCurrentPin: (pin: Pin | null) => set({ currentPin: pin }),
}))

