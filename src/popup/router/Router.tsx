import { useEffect } from 'react'
import { useRouter } from './RouterContext'
import { useAuth } from '../hooks/useAuth'
import { routes, getRouteByName } from './routes'
import { CircularProgress, Box } from '@mui/material'

export const Router = () => {
  const { currentRoute, navigate } = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  // Handle route guards and redirects
  useEffect(() => {
    if (isLoading) return

    const route = getRouteByName(currentRoute)
    if (!route) {
      navigate('auth', { replace: true })
      return
    }

    // Redirect if route requires auth but user is not authenticated
    if (route.requiresAuth && !isAuthenticated) {
      navigate('auth', { replace: true })
      return
    }

    // Redirect if route should redirect authenticated users (e.g., auth page)
    if (route.redirectIfAuthenticated && isAuthenticated) {
      navigate('main', { replace: true })
      return
    }
  }, [currentRoute, isAuthenticated, isLoading, navigate])

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
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

