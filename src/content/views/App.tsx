import React, { useEffect, useState } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { theme } from '../../theme'
import Toolbar from './components/Toolbar'
import Modals from '../modals'
import { UiProvider } from '../context/UiContext'

interface AppProps {
  /** Container for Emotion/MUI style tags; keeps them grouped and out of the main app DOM. */
  emotionContainer: HTMLElement
  modalContainer: HTMLElement
}

function App({ emotionContainer, modalContainer }: AppProps) {
  const [emotionCache, setEmotionCache] = useState<ReturnType<typeof createCache> | null>(null)

  useEffect(() => {
    // Single cache instance: target emotionContainer so all <style data-emotion> tags
    // are children of one node. Emotion creates multiple style tags (one per sheet);
    // MUI's components add many, so dozens of tags are expected.
    const cache = createCache({
      key: 'wiki-pin',
      container: emotionContainer,
      prepend: true,
    })
    setEmotionCache(cache)
  }, [emotionContainer])

  // Don't render until cache is ready
  if (!emotionCache) {
    return null
  }

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <UiProvider>
          <Toolbar />
          <Modals container={modalContainer} />
        </UiProvider>
      </ThemeProvider>
    </CacheProvider>
  )
}

export default App
