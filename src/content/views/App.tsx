import React, { useEffect, useState } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import Popup from './components/Popup/'
import { theme } from '../theme'
import NewPopup from './components/NewPopup'

function App() {
  const [emotionCache, setEmotionCache] = useState<ReturnType<typeof createCache> | null>(null)

  useEffect(() => {
    // Find the shadow root by locating the host element
    const host = document.getElementById('crxjs-app')
    if (host && host.shadowRoot) {
      const cache = createCache({
        key: 'css',
        container: host.shadowRoot,
        prepend: true,
      })
      setEmotionCache(cache)
    }
  }, [])

  // Don't render until cache is ready
  if (!emotionCache) {
    return null
  }

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NewPopup />
      </ThemeProvider>
    </CacheProvider>
  )
}

export default App
