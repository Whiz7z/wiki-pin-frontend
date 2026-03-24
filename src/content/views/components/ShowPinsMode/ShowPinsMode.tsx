import { useEffect, useRef, useState } from 'react'
import { articlesApi } from '@/services/articlesApi'
import type { Pin } from '@/services/pinsApi'
import { usePinsStore } from '@/stores'
import { useUi } from '@/content/context/UiContext'
import { findElementByXPath } from '../SelectMode/SelectMode'
import { getCurrentArticle } from '@/utils/tabUtils'
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
  const [highlightedPin, setHighlightedPin] = useState<Pin | null>(null)
  const [resolvedArticleId, setResolvedArticleId] = useState<string | null>(null)
  const { openModal } = useUi()

  const fetchAll = usePinsStore((s) => s.fetchAll)
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

  useEffect(() => {
    if (!enabled) {
      setResolvedArticleId(null)
      removeAllOutlines()
      document.getElementById(PIN_STYLE_ID)?.remove()
      return
    }

    let cancelled = false

    const run = async () => {
      setHighlightedPin(null)
      setResolvedArticleId(null)
      const articleUrl = await getCurrentArticle(window.location.href)
      if (!articleUrl) return

      try {
        const article = await articlesApi.getByUrl(articleUrl)

        if (cancelled) return

        setResolvedArticleId(article.id)
        await fetchAll({ articleId: article.id })
        if (cancelled) return

        const list = usePinsStore.getState().getPins(article.id)
        savePinsToStorage(article.id, articleUrl, list)

        removeAllOutlines()
        injectPinFlashStyles()

        list.forEach((pin: Pin) => {
          if (!pin.selector) return
          const el = findElementByXPath(pin.selector)
          if (el && el instanceof HTMLElement) {
            const original = el.style.outline || ''
            el.style.outline = PINS_OUTLINE
            attachPinListeners(el, pin, original)
          }
        })
      } catch (e) {
        console.error('ShowPinsMode: failed to fetch article or pins', e)
        const raw = localStorage.getItem(getStorageKey(articleUrl))
        if (!raw) return

        try {
          const parsed = JSON.parse(raw) as StoredPinsPayload
          if (parsed?.pins && parsed.articleUrl === articleUrl) {
            setPinsResults(parsed.pins, parsed.articleId)
            setResolvedArticleId(parsed.articleId)
            removeAllOutlines()
            injectPinFlashStyles()
            parsed.pins.forEach((pin: Pin) => {
              if (!pin.selector) return
              const el = findElementByXPath(pin.selector)
              if (el && el instanceof HTMLElement) {
                const original = el.style.outline || ''
                el.style.outline = PINS_OUTLINE
                attachPinListeners(el, pin, original)
              }
            })
          }
        } catch {
          // ignore
        }
      }
    }

    run()

    // Cleanup: remove all pin listeners and restore styles to free memory (unmount or mode off).
    return () => {
      cancelled = true
      removeAllOutlines()
    }
  }, [enabled, fetchAll, setPinsResults, pinsRefreshKey])

  return { pinsCount, currentPinIndex, highlightedPin, scrollToPin }
}
