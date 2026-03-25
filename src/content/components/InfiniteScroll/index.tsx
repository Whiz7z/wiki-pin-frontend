import { Box, CircularProgress, SxProps, Theme, useTheme } from '@mui/material'
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { styles } from './styles'

interface InfiniteScrollProps {
  children: React.ReactNode
  onYEnd: () => void
  isLoading?: boolean
  sx?: SxProps<Theme>
  showLoader?: boolean
  onScroll?: (scrollTop: number) => void
}

export interface InfiniteScrollHandle {
  scrollToTop: (behavior: 'smooth' | 'instant') => void
}

export const InfiniteScroll = forwardRef<InfiniteScrollHandle, InfiniteScrollProps>(
  ({ children, onYEnd, isLoading, sx, showLoader = true, onScroll }, ref) => {
    const theme = useTheme()

    const containerRef = useRef<HTMLDivElement>(null)
    const observerRef = useRef<IntersectionObserver | null>(null)

    useImperativeHandle(ref, () => ({
      scrollToTop: (behavior: 'smooth' | 'instant' = 'smooth') => {
        containerRef.current?.scrollTo({ top: 0, behavior })
      },
    }))

    const initializeObserver = () => {
      const container = containerRef.current
      if (!container) return

      observerRef.current?.disconnect()

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const lastEntry = entries[0]
          if (lastEntry?.isIntersecting && !isLoading) onYEnd()
        },
        {
          root: container,
          threshold: 0.1,
          rootMargin: '100px',
        }
      )

      const sentinel = container.querySelector('[data-infinite-sentinel]')
      if (sentinel) observerRef.current.observe(sentinel)
    }

    useEffect(() => {
      initializeObserver()
      return () => observerRef.current?.disconnect()
    }, [isLoading])

    useEffect(() => {
      initializeObserver()
    }, [children])

    useEffect(() => {
      const container = containerRef.current
      if (!container || !onScroll) return

      const handleScroll = () => onScroll(container.scrollTop)
      container.addEventListener('scroll', handleScroll)
      handleScroll()
      return () => container.removeEventListener('scroll', handleScroll)
    }, [onScroll])

    return (
      <Box sx={styles.container}>
        <Box sx={[styles.scrollContainer(), ...(Array.isArray(sx) ? sx : [sx])]} ref={containerRef}>
          {children}
          <Box
            sx={{ height: '10px', width: '100%', visibility: 'hidden' }}
            data-infinite-sentinel=""
          />
          {isLoading && showLoader && (
            <Box sx={styles.loaderContainer}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>
      </Box>
    )
  }
)

InfiniteScroll.displayName = 'InfiniteScroll'

export default InfiniteScroll

