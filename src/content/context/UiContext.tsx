import React, { createContext, useCallback, useContext, useState } from 'react'

export type ModalName = 'pinContent'

export interface UiModalState {
  name: ModalName | null
  params: Record<string, unknown>
}

export interface UiContextValue {
  modal: UiModalState
  openModal: (name: ModalName, params?: Record<string, unknown>) => void
  closeModal: () => void
  clearModal: () => void
}

const initialModalState: UiModalState = {
  name: null,
  params: {},
}

export const UiContext = createContext<UiContextValue | null>(null)

interface UiProviderProps {
  children: React.ReactNode
}

export function UiProvider({ children }: UiProviderProps) {
  const [modal, setModal] = useState<UiModalState>(initialModalState)

  const openModal = useCallback((name: ModalName, params?: Record<string, unknown>) => {
    setModal({ name, params: params ?? {} })
  }, [])

  const closeModal = useCallback(() => {
    setModal(initialModalState)
  }, [])

  const clearModal = useCallback(() => {
    setModal(initialModalState)
  }, [])

  const value: UiContextValue = {
    modal,
    openModal,
    closeModal,
    clearModal,
  }

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export function useUi() {
  const ctx = useContext(UiContext)
  if (!ctx) {
    throw new Error('useUi must be used within UiProvider')
  }
  return {
    ...ctx,
    isModalOpen: ctx.modal.name !== null,
    modalName: ctx.modal.name,
    modalParams: ctx.modal.params,
  }
}
