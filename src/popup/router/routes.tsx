import { Route } from './types'
import AuthPage from '../pages/AuthPage'
import MainPage from '../pages/MainPage'
import CreateArticlePage from '../pages/CreateArticlePage'
import PinPage from '../pages/PinPage'

export const routes: Route[] = [
  {
    name: 'auth',
    path: '/auth',
    component: AuthPage,
    requiresAuth: false,
    redirectIfAuthenticated: true,
  },
  {
    name: 'main',
    path: '/',
    component: MainPage,
    requiresAuth: true,
  },
  {
    name: 'pin',
    path: '/pin',
    component: PinPage,
    requiresAuth: true,
  },
  {
    name: 'create-article',
    path: '/create-article',
    component: CreateArticlePage,
    requiresAuth: true,
  },
]

export const getRouteByName = (name: string): Route | undefined => {
  return routes.find((route) => route.name === name)
}

export const getInitialRoute = (isAuthenticated: boolean): string => {
  if (isAuthenticated) {

    const mainRoute = routes.find((r) => r.name === 'main')
    return mainRoute?.name || 'auth'
  }
  return 'auth'
}

