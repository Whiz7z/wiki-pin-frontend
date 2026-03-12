import React, { useEffect, useState } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { theme } from '../../theme'
import Toolbar from './components/Toolbar'

interface AppProps {
  shadowRoot: ShadowRoot
}

function App({ shadowRoot }: AppProps) {
  const [emotionCache, setEmotionCache] = useState<ReturnType<typeof createCache> | null>(null)

  useEffect(() => {
    // Create emotion cache with the shadow root as container
    const cache = createCache({
      key: 'css',
      container: shadowRoot,
      prepend: true,
    })
    setEmotionCache(cache)
  }, [shadowRoot])

  // Don't render until cache is ready
  if (!emotionCache) {
    return null
  }

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Toolbar />
      </ThemeProvider>
    </CacheProvider>
  )
}

export default App
