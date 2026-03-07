import { RouterProvider } from './router/RouterContext'
import { Router } from './router/Router'
import { useAuth } from './hooks/useAuth'
import { getInitialRoute } from './router/routes'

export default function App() {
  const { isAuthenticated, isLoading } = useAuth()
  const initialRoute = isLoading ? 'auth' : getInitialRoute(isAuthenticated)

  return (
    <RouterProvider initialRoute={initialRoute}>
      <Router />
    </RouterProvider>
  )
}
 