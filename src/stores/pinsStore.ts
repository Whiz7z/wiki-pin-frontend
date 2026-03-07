import { create } from 'zustand'
import { pinsApi, type Pin, type CreatePinRequest, type UpdatePinRequest, type GetPinsParams } from '../services/pinsApi'

interface PinsState {
  pins: Pin[]
  currentPin: Pin | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchAll: (params?: GetPinsParams) => Promise<void>
  fetchById: (id: string) => Promise<void>
  create: (pin: CreatePinRequest) => Promise<Pin>
  update: (id: string, updates: UpdatePinRequest) => Promise<void>
  delete: (id: string) => Promise<void>
  clearError: () => void
  setCurrentPin: (pin: Pin | null) => void
}

export const usePinsStore = create<PinsState>((set, get) => ({
  pins: [],
  currentPin: null,
  isLoading: false,
  error: null,

  fetchAll: async (params?: GetPinsParams) => {
    set({ isLoading: true, error: null })
    try {
      const pins = await pinsApi.getAll(params)
      set({ pins, isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pins',
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
      const index = pins.findIndex(p => p.id === id)
      if (index !== -1) {
        pins[index] = pin
        set({ pins })
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
        pins: [newPin, ...state.pins],
        currentPin: newPin,
        isLoading: false,
      }))
      return newPin
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create pin',
      })
      throw error
    }
  },

  update: async (id: string, updates: UpdatePinRequest) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await pinsApi.update(id, updates)
      set((state) => {
        const pins = state.pins.map(p => p.id === id ? updated : p)
        const currentPin = state.currentPin?.id === id ? updated : state.currentPin
        return { pins, currentPin, isLoading: false }
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
        pins: state.pins.filter(p => p.id !== id),
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
  
  setCurrentPin: (pin: Pin | null) => set({ currentPin: pin }),
}))

