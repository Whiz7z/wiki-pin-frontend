import { useEffect, useRef } from 'react'
import { articlesApi } from '@/services/articlesApi'
import { pinsApi, type Pin } from '@/services/pinsApi'
import { findElementByXPath } from './SelectMode'
import { getCurrentArticle } from '@/utils/tabUtils'

export const STORAGE_PINS_KEY = 'wiki-pin-article-pins'

const PINS_OUTLINE = '2px solid #1976d2'

interface StoredPinsPayload {
  articleId: string
  articleUrl: string
  pins: Pin[]
}

function getStorageKey(articleUrl: string): string {
  return `${STORAGE_PINS_KEY}-${articleUrl}`
}

function savePinsToStorage(articleId: string, articleUrl: string, pins: Pin[]): void {
  try {
    const payload: StoredPinsPayload = { articleId, articleUrl, pins }
    localStorage.setItem(getStorageKey(articleUrl), JSON.stringify(payload))
  } catch (e) {
    console.error('Error saving pins to localStorage:', e)
  }
}

export function useShowPinsMode(enabled: boolean): void {
  const highlightedRef = useRef<Map<Element, string>>(new Map())

  const removeAllOutlines = () => {
    highlightedRef.current.forEach((originalOutline, el) => {
      if (el instanceof HTMLElement) {
        if (originalOutline === '') {
          el.style.removeProperty('outline')
        } else {
          el.style.outline = originalOutline
        }
      }
    })
    highlightedRef.current.clear()
  }

  useEffect(() => {
    if (!enabled) {
      removeAllOutlines()
      return
    }

    let cancelled = false

    const run = async () => {
      const articleUrl = await getCurrentArticle(window.location.href)
      if (!articleUrl) return

      try {
        const article = await articlesApi.getByUrl(articleUrl)
        if (cancelled) return

        const pins = await pinsApi.getAll({ articleId: article.id })
        if (cancelled) return

        savePinsToStorage(article.id, articleUrl, pins)

        removeAllOutlines()

        pins.forEach((pin) => {
          if (!pin.selector) return
          const el = findElementByXPath(pin.selector)
          if (el && el instanceof HTMLElement) {
            const original = el.style.outline || ''
            el.style.outline = PINS_OUTLINE
            highlightedRef.current.set(el, original)
          }
        })
      } catch (e) {
        console.error('ShowPinsMode: failed to fetch article or pins', e)
        const raw = localStorage.getItem(getStorageKey(articleUrl))
        if (!raw) return
        try {
          const parsed = JSON.parse(raw) as StoredPinsPayload
          if (parsed?.pins && parsed.articleUrl === articleUrl) {
            removeAllOutlines()
            parsed.pins.forEach((pin) => {
              if (!pin.selector) return
              const el = findElementByXPath(pin.selector)
              if (el && el instanceof HTMLElement) {
                const original = el.style.outline || ''
                el.style.outline = PINS_OUTLINE
                highlightedRef.current.set(el, original)
              }
            })
          }
        } catch {
          // ignore
        }
      }
    }

    run()

    return () => {
      cancelled = true
      removeAllOutlines()
    }
  }, [enabled])
}
