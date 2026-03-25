import { useEffect, useRef, useState } from 'react'
import { articlesApi } from '@/services/articlesApi'
import type { Pin } from '@/services/pinsApi'
import { usePinsStore } from '@/stores'
import { useUi } from '@/content/context/UiContext'
import { findElementByXPath } from '../SelectMode/SelectMode'
import { getCurrentArticle } from '@/utils/tabUtils'
import { observeElementIntersection } from '@/content/utils/pinInViewport'
import {
  getStorageKey,
  injectPinFlashStyles,
  flashPinAfterScroll,
  PINS_OUTLINE,
  PIN_STYLE_ID,
  savePinsToStorage,
  removeAllPinHighlights,
  attachPinListeners as attachPinListenersUtil,
} from './utils'
import type { HighlightedPinData, StoredPinsPayload } from './utils'

/** Stable empty list for Zustand selectors — never use `[]` inline or `?? []` (new reference each snapshot). */
const EMPTY_PINS: Pin[] = []

export { STORAGE_PINS_KEY } from './utils'

export interface ShowPinsModeResult {
  pinsCount: number
  /** 1-based index of the currently shown pin, or 0 when none selected */
  currentPinIndex: number
  highlightedPin: Pin | null
  scrollToPin: (direction: 'next' | 'previous') => void
}

export function useShowPinsMode(enabled: boolean): ShowPinsModeResult {
  const highlightedRef = useRef<Map<Element, HighlightedPinData>>(new Map())
  const attachedPinIdsRef = useRef<Set<string>>(new Set())
  const articleUrlRef = useRef<string | null>(null)
  const [highlightedPin, setHighlightedPin] = useState<Pin | null>(null)
  const [resolvedArticleId, setResolvedArticleId] = useState<string | null>(null)
  const { openModal } = useUi()

  const fetchAll = usePinsStore((s) => s.fetchAll)
  const fetchNextPageForArticle = usePinsStore((s) => s.fetchNextPageForArticle)
  const setPinsResults = usePinsStore((s) => s.setPinsResults)
  const pinsRefreshKey = usePinsStore((s) => s.pinsRefreshKey)
  const results = usePinsStore((s) =>
    resolvedArticleId != null
      ? (s.pinsByArticleId[resolvedArticleId] ?? EMPTY_PINS)
      : EMPTY_PINS,
  )
  const pinsPagination = usePinsStore((s) =>
    resolvedArticleId ? s.pinsPaginationByArticleId[resolvedArticleId] : undefined,
  )
  const loadingMore = usePinsStore((s) =>
    resolvedArticleId ? Boolean(s.pinsLoadingMoreByArticleId[resolvedArticleId]) : false,
  )

  const pinsCount =
    resolvedArticleId != null ? (pinsPagination?.count ?? results.length) : 0

  const scrollToPin = (direction: 'next' | 'previous') => {
    if (results.length === 0) return

    let targetPin: Pin

    if (!highlightedPin) {
      targetPin = direction === 'next' ? results[0]! : results[results.length - 1]!
    } else {
      const currentIndex = results.findIndex((p) => p.id === highlightedPin.id)
      if (currentIndex === -1) return
      const delta = direction === 'next' ? 1 : -1
      const targetIndex = (currentIndex + delta + results.length) % results.length
      targetPin = results[targetIndex]!
    }

    setHighlightedPin(targetPin)
    const el = findElementByXPath(targetPin.selector)
    if (el && el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      flashPinAfterScroll(targetPin)
    }
  }

  const currentPinIndex = highlightedPin
    ? results.findIndex((p) => p.id === highlightedPin.id) + 1
    : 0

  const removeAllOutlines = () => removeAllPinHighlights(highlightedRef.current)

  const attachPinListeners = (el: HTMLElement, pin: Pin, originalOutline: string) =>
    attachPinListenersUtil(el, pin, originalOutline, openModal, highlightedRef.current)

  /** Apply outlines/listeners for pins not yet in attachedPinIdsRef. */
  useEffect(() => {
    if (!enabled || resolvedArticleId == null || results.length === 0) return

    injectPinFlashStyles()

    for (const pin of results) {
      if (!pin.selector || attachedPinIdsRef.current.has(pin.id)) continue
      const el = findElementByXPath(pin.selector)
      if (el && el instanceof HTMLElement) {
        const original = el.style.outline || ''
        el.style.outline = PINS_OUTLINE
        attachPinListeners(el, pin, original)
        attachedPinIdsRef.current.add(pin.id)
      }
    }

    const url = articleUrlRef.current
    if (url) {
      savePinsToStorage(resolvedArticleId, url, results)
    }
  }, [enabled, resolvedArticleId, results, openModal])

  /** When the last loaded pin enters the viewport, fetch the next page. */
  useEffect(() => {
    if (!enabled || resolvedArticleId == null) return
    const lastPin = results[results.length - 1]
    const next = pinsPagination?.next
    if (!lastPin?.selector || !next || loadingMore) return

    const el = findElementByXPath(lastPin.selector)
    if (!el) return

    return observeElementIntersection(el, (isIntersecting) => {
      if (!isIntersecting) return
      const st = usePinsStore.getState()
      const aid = resolvedArticleId
      if (!st.pinsPaginationByArticleId[aid]?.next) return
      if (st.pinsLoadingMoreByArticleId[aid]) return
      void st.fetchNextPageForArticle(aid)
    })
  }, [
    enabled,
    resolvedArticleId,
    results,
    pinsPagination?.next,
    loadingMore,
    pinsRefreshKey,
  ])

  useEffect(() => {
    if (!enabled) {
      setResolvedArticleId(null)
      articleUrlRef.current = null
      attachedPinIdsRef.current.clear()
      removeAllOutlines()
      document.getElementById(PIN_STYLE_ID)?.remove()
      return
    }

    let cancelled = false

    const run = async () => {
      setHighlightedPin(null)
      setResolvedArticleId(null)
      articleUrlRef.current = null
      attachedPinIdsRef.current.clear()
      removeAllOutlines()

      const articleUrl = await getCurrentArticle(window.location.href)
      if (!articleUrl) return

      try {
        const article = await articlesApi.getByUrl(articleUrl)

        if (cancelled) return

        articleUrlRef.current = articleUrl
        setResolvedArticleId(article.id)
        await fetchAll({ articleId: article.id })
        if (cancelled) return
      } catch (e) {
        console.error('ShowPinsMode: failed to fetch article or pins', e)
        const raw = localStorage.getItem(getStorageKey(articleUrl))
        if (!raw) return

        try {
          const parsed = JSON.parse(raw) as StoredPinsPayload
          if (parsed?.pins && parsed.articleUrl === articleUrl) {
            articleUrlRef.current = articleUrl
            setPinsResults(parsed.pins, parsed.articleId)
            setResolvedArticleId(parsed.articleId)
          }
        } catch {
          // ignore
        }
      }
    }

    void run()

    return () => {
      cancelled = true
      removeAllOutlines()
    }
  }, [enabled, fetchAll, setPinsResults, pinsRefreshKey])

  return { pinsCount, currentPinIndex, highlightedPin, scrollToPin }
}
