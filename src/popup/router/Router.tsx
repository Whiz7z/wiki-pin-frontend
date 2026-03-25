import { useEffect } from 'react'
import { useRouter } from './RouterContext'
import { routes, getRouteByName } from './routes'
import { CircularProgress, Box } from '@mui/material'
import { useAuthStoreContent } from '@/hooks/useAuthStoreContent'

export const Router = () => {
  const { currentRoute, navigate } = useRouter()
  const { accessToken, isLoading } = useAuthStoreContent()

  // Handle route guards and redirects
  useEffect(() => {
    if (isLoading) return

    const route = getRouteByName(currentRoute)
    if (!route) {
      navigate('auth', { replace: true })
      return
    }

    // Redirect if route requires auth but user is not authenticated
    if (route.requiresAuth && !accessToken) {
      navigate('auth', { replace: true })
      return
    }

    // Redirect if route should redirect authenticated users (e.g., auth page)
    if (route.redirectIfAuthenticated && accessToken) {
      navigate('main', { replace: true })
      return
    }
  }, [currentRoute, accessToken, isLoading, navigate])

  if (isLoading) {
    return (
      <Box
        sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '400px',
            width: '500px',
            backgroundColor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  const route = getRouteByName(currentRoute)
  if (!route) {
    // Fallback to auth if route not found
    const authRoute = routes.find((r) => r.name === 'auth')
    const Component = authRoute?.component || routes[0].component
    return <Component />
  }

  const Component = route.component
  return <Component />
}

