import { Box, CircularProgress, SxProps, Theme, useTheme } from '@mui/material';
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { styles } from './styles';

interface InfiniteScrollProps {
  children: React.ReactNode;
  onYEnd: () => void;
  isLoading?: boolean;
  sx?: SxProps<Theme>;
  containerSx?: SxProps<Theme>;
  showLoader?: boolean;
  onScroll?: (scrollTop: number) => void;
}

export interface InfiniteScrollHandle {
  scrollToTop: (behavior: 'smooth' | 'instant') => void;
}

export const InfiniteScroll = forwardRef<InfiniteScrollHandle, InfiniteScrollProps>(({
  children,
  onYEnd,
  isLoading,
  sx,
  showLoader = true,
  onScroll,
}, ref) => {
  const theme = useTheme();

  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => ({
    scrollToTop: (behavior: 'smooth' | 'instant' = 'smooth') => {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: 0,
          behavior: behavior
        });
      }
    }
  }));

  const initializeObserver = () => {
    const container = containerRef.current;
    if (!container) return;

    // Cleanup previous observer if exists
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      entries => {
        const lastEntry = entries[0];
        if (lastEntry.isIntersecting && !isLoading) {
          onYEnd();
        }
      },
      {
        root: container,
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    // Use the React-rendered sentinel element
    const sentinel = container.querySelector('[data-infinite-sentinel]');
    if (sentinel) {
      sentinelRef.current = sentinel as HTMLDivElement;
      observerRef.current.observe(sentinel);
    }
  };

  // Initialize when component mounts or loading state changes
  useEffect(() => {
    initializeObserver();

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isLoading]);

  // Reinitialize when children change (new content)
  useEffect(() => {
    initializeObserver();
  }, [children]);

  // Handle scroll events
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onScroll) return;

    const handleScroll = () => {
      onScroll(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll);

    // Initial call to set initial scroll position
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [onScroll]);

  return (
    <Box sx={styles.container}>
      <Box
        sx={[styles.scrollContainer(), ...(Array.isArray(sx) ? sx : [sx])]}
        ref={containerRef}
      >
        {children}
        <Box
          sx={{
            height: '10px',
            width: '100%',
            visibility: 'hidden',
          }}
          data-infinite-sentinel=""
        />
        {isLoading && showLoader && (
          <Box sx={styles.loaderContainer}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>
    </Box>
  );
});

InfiniteScroll.displayName = 'InfiniteScroll';

export default InfiniteScroll;
