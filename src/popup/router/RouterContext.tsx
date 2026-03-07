import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { RouteName, RouterContextType } from './types'

const RouterContext = createContext<RouterContextType | undefined>(undefined)

export const RouterProvider = ({ children, initialRoute = 'auth' }: { children: ReactNode; initialRoute?: RouteName }) => {
  const [currentRoute, setCurrentRoute] = useState<RouteName>(initialRoute)
  const [history, setHistory] = useState<RouteName[]>([initialRoute])

  const navigate = useCallback((route: RouteName, options?: { replace?: boolean }) => {
    setCurrentRoute(route)
    if (options?.replace) {
      setHistory((prev) => {
        if (prev.length === 0) return [route]
        return [...prev.slice(0, -1), route]
      })
    } else {
      setHistory((prev) => [...prev, route])
    }
  }, [])

  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length > 1) {
        const newHistory = [...prev]
        newHistory.pop()
        const previousRoute = newHistory[newHistory.length - 1]
        setCurrentRoute(previousRoute)
        return newHistory
      }
      return prev
    })
  }, [])

  return (
    <RouterContext.Provider value={{ currentRoute, navigate, goBack, history }}>
      {children}
    </RouterContext.Provider>
  )
}

export const useRouter = () => {
  const context = useContext(RouterContext)
  if (!context) {
    throw new Error('useRouter must be used within RouterProvider')
  }
  return context
}

