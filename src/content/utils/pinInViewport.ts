const DEFAULT_ROOT_MARGIN = '200px 0px 200px 0px'

/**
 * Observe when an element intersects the viewport (or root).
 * Returns a cleanup that disconnects the observer.
 */
export function observeElementIntersection(
  el: Element | null,
  callback: (isIntersecting: boolean) => void,
  options?: IntersectionObserverInit,
): () => void {
  if (el == null || typeof IntersectionObserver === 'undefined') {
    return () => {}
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry) callback(entry.isIntersecting)
    },
    {
      root: null,
      rootMargin: DEFAULT_ROOT_MARGIN,
      threshold: 0,
      ...options,
    },
  )

  observer.observe(el)
  return () => observer.disconnect()
}

/** One-off check: element rect overlaps the viewport (CSS pixels). */
export function isElementInViewport(el: Element): boolean {
  const r = el.getBoundingClientRect()
  return (
    r.bottom > 0 &&
    r.right > 0 &&
    r.left < window.innerWidth &&
    r.top < window.innerHeight
  )
}
