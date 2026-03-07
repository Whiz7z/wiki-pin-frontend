import { RouterProvider } from './router/RouterContext'
import { Router } from './router/Router'
import { getInitialRoute } from './router/routes'
import { useAuthStore } from '../stores/authStore'

export default function App() {
  const { accessToken, isLoading } = useAuthStore()
  const initialRoute = isLoading ? 'auth' : getInitialRoute(!!accessToken)

  return (
    <RouterProvider initialRoute={initialRoute}>
      <Router />
    </RouterProvider>
  )
}
 