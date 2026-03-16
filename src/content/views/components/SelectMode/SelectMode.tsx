import React, { useState, useRef, useEffect } from 'react'

export const STORAGE_KEY = 'wiki-pin-selected-element'
export const STORAGE_URL_KEY = 'wiki-pin-selected-url'
const HIGHLIGHT_OUTLINE = '2px solid #8B3A3A'

export function getXPath(element: Element): string {
  if (element.id) {
    return `//*[@id="${element.id}"]`
  }

  const parts: string[] = []
  let current: Element | null = element

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 1
    let sibling = current.previousElementSibling

    while (sibling) {
      if (sibling.nodeName === current.nodeName) {
        index++
      }
      sibling = sibling.previousElementSibling
    }

    const tagName = current.nodeName.toLowerCase()
    const xpathIndex = index > 1 ? `[${index}]` : ''
    parts.unshift(`${tagName}${xpathIndex}`)

    current = current.parentElement
  }

  return '/' + parts.join('/')
}

export function findElementByXPath(xpath: string): Element | null {
  try {
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    )
    return result.singleNodeValue as Element | null
  } catch (e) {
    console.error('Error finding element by XPath:', e)
    return null
  }
}

export interface UseElementSelectionResult {
  isElementSelected: boolean
  removeOutline: () => void
  clearSelectedElement: () => void
}

export function useElementSelection(enabled: boolean): UseElementSelectionResult {
  const [isElementSelected, setIsElementSelected] = useState(false)
  const selectedElementRef = useRef<Element | null>(null)
  const outlineStyleRef = useRef<string | null>(null)
  const clickHandlerRef = useRef<((e: MouseEvent) => void) | null>(null)
  const isRestoringRef = useRef(false)
  const prevEnabledRef = useRef(enabled)

  const clearSelectedElement = () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_URL_KEY)
  }

  const removeOutline = () => {
    const element = selectedElementRef.current
    if (element && element instanceof HTMLElement && outlineStyleRef.current !== null) {
      if (outlineStyleRef.current === '') {
        element.style.removeProperty('outline')
      } else {
        element.style.outline = outlineStyleRef.current
      }
      outlineStyleRef.current = null
    }
    selectedElementRef.current = null
    setIsElementSelected(false)
  }

  const saveSelectedElement = (element: Element) => {
    try {
      const xpath = getXPath(element)
      localStorage.setItem(STORAGE_KEY, xpath)
      localStorage.setItem(STORAGE_URL_KEY, window.location.href)
      console.log('Saved selected element:', xpath)
    } catch (e) {
      console.error('Error saving selected element:', e)
    }
  }

  const applyOutline = (target: Element) => {
    if (selectedElementRef.current || outlineStyleRef.current !== null) {
      removeOutline()
    }

    if (!(target instanceof HTMLElement)) return

    selectedElementRef.current = target
    outlineStyleRef.current = target.style.outline || ''
    target.style.outline = HIGHLIGHT_OUTLINE

    if (!isRestoringRef.current) {
      saveSelectedElement(target)
    }
    setIsElementSelected(true)
  }

  const restoreSelectedElement = () => {
    try {
      const savedXPath = localStorage.getItem(STORAGE_KEY)
      const savedUrl = localStorage.getItem(STORAGE_URL_KEY)

      if (savedXPath && savedUrl === window.location.href) {
        const element = findElementByXPath(savedXPath)

        if (element && element instanceof HTMLElement) {
          const hasOutline = element.style.outline.includes('#8B3A3A')
          if (!hasOutline) {
            isRestoringRef.current = true
            outlineStyleRef.current = element.style.outline || ''
            element.style.outline = HIGHLIGHT_OUTLINE
            selectedElementRef.current = element
            setIsElementSelected(true)
            isRestoringRef.current = false
            return true
          }
          clearSelectedElement()
        } else {
          clearSelectedElement()
        }
      }
    } catch (e) {
      console.error('Error restoring selected element:', e)
    }
    return false
  }

  useEffect(() => {
    return () => {
      if (selectedElementRef.current) removeOutline()
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      restoreSelectedElement()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (enabled) {
      document.body.style.cursor = 'crosshair'

      if (clickHandlerRef.current) {
        document.body.removeEventListener('click', clickHandlerRef.current, true)
        clickHandlerRef.current = null
      }

      const handleClick = (e: MouseEvent) => {
        const target = e.target as Element
        if (
          target &&
          target !== document.body &&
          target !== document.documentElement &&
          !target.shadowRoot &&
          !(target instanceof HTMLElement && target.style.outline.includes('#8B3A3A'))
        ) {
          e.preventDefault()
          e.stopPropagation()
          applyOutline(target)
        }
      }

      clickHandlerRef.current = handleClick
      document.body.addEventListener('click', handleClick, true)
    } else {
      document.body.style.cursor = 'default'
      // When leaving select mode: remove outline, clear selection state, clear localStorage
      if (prevEnabledRef.current) {
        removeOutline()
        clearSelectedElement()
      }
      prevEnabledRef.current = false

      if (clickHandlerRef.current) {
        document.body.removeEventListener('click', clickHandlerRef.current, true)
        clickHandlerRef.current = null
      }
    }
    prevEnabledRef.current = enabled
  }, [enabled])

  return { isElementSelected, removeOutline, clearSelectedElement }
}
