import { ReactNode } from 'react'

export type RouteName = 'auth' | 'main' | string

export interface Route {
  name: RouteName
  path: string
  component: React.ComponentType<any>
  requiresAuth?: boolean
  redirectIfAuthenticated?: boolean
  meta?: Record<string, any>
}

export interface RouterContextType {
  currentRoute: RouteName
  navigate: (route: RouteName, options?: { replace?: boolean }) => void
  goBack: () => void
  history: RouteName[]
}

