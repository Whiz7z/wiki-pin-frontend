import { ReactNode } from 'react'

export type RouteName = 'auth' | 'main' | 'pin' | 'create-article' | string

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
  params: Record<string, string>
  navigate: (route: RouteName, options?: { replace?: boolean; params?: Record<string, string> }) => void
  goBack: () => void
  history: RouteName[]
}

