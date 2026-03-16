import type { Pin } from '@/services/pinsApi'
import { findElementByXPath } from '../SelectMode/SelectMode'

export const STORAGE_PINS_KEY = 'wiki-pin-article-pins'

// --- Pin highlight + hover (CSS class) + click listener ---

export const PIN_HOVER_CLASS = 'wiki-pin-hover'

export interface HighlightedPinData {
  originalOutline: string
  pin: Pin
  onClick: (e: MouseEvent) => void
}

export type OpenPinContentModal = (name: 'pinContent', params: { pin: Pin }) => void

/**
 * Removes click listener and hover class, restores outline for a single highlighted pin.
 * Call this (or removeAllPinHighlights) to free memory when a pin is no longer needed.
 */
export function detachPinListeners(el: HTMLElement, data: HighlightedPinData): void {
  el.removeEventListener('click', data.onClick, true)
  el.classList.remove(PIN_HOVER_CLASS)
  if (data.originalOutline === '') {
    el.style.removeProperty('outline')
  } else {
    el.style.outline = data.originalOutline
  }
}

/**
 * Removes all pin listeners, restores styles, and clears the map.
 * Must be called when Show Pins mode is turned off or on unmount to free memory.
 */
export function removeAllPinHighlights(
  highlightedMap: Map<Element, HighlightedPinData>
): void {
  highlightedMap.forEach((data, el) => {
    if (el instanceof HTMLElement) {
      detachPinListeners(el, data)
    }
  })
  highlightedMap.clear()
}

export function attachPinListeners(
  el: HTMLElement,
  pin: Pin,
  originalOutline: string,
  openModal: OpenPinContentModal,
  highlightedMap: Map<Element, HighlightedPinData>
): void {
  const onClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    openModal('pinContent', { pin })
  }
  el.classList.add(PIN_HOVER_CLASS)
  el.addEventListener('click', onClick, true)
  highlightedMap.set(el, {
    originalOutline,
    pin,
    onClick,
  })
}

export const PINS_OUTLINE = '2px solid #1976d2'
export const PIN_FLASH_CLASS = 'wiki-pin-flash-active'
export const PIN_STYLE_ID = 'wiki-pin-show-pins-styles'
/** Delay before starting the flash so smooth scroll can bring the pin into view */
export const FLASH_DELAY_MS = 450

export interface StoredPinsPayload {
  articleId: string
  articleUrl: string
  pins: Pin[]
}

export function getStorageKey(articleUrl: string): string {
  return `${STORAGE_PINS_KEY}-${articleUrl}`
}

export function savePinsToStorage(
  articleId: string,
  articleUrl: string,
  pins: Pin[]
): void {
  try {
    const payload: StoredPinsPayload = { articleId, articleUrl, pins }
    localStorage.setItem(getStorageKey(articleUrl), JSON.stringify(payload))
  } catch (e) {
    console.error('Error saving pins to localStorage:', e)
  }
}

export function injectPinFlashStyles(): void {
  if (document.getElementById(PIN_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = PIN_STYLE_ID
  style.textContent = `
    @keyframes wiki-pin-flash {
      0%   { outline: 2px solid #1976d2; }
      50%  { outline: 3px solid #fB3A3A; }
      100% { outline: 2px solid #1976d2; }
    }
    .${PIN_FLASH_CLASS} {
      animation: wiki-pin-flash 1s ease-out;
    }
    .${PIN_HOVER_CLASS} {
      transition: filter 0.2s ease-in-out, background-color 0.2s ease-in-out, outline 0.2s ease-in-out;
      cursor: pointer;
    }
    /* Inline elements (e.g. <a>) need a box so background/outline apply */
    a.${PIN_HOVER_CLASS} {
      
    }
    .${PIN_HOVER_CLASS}:hover {
      outline: 3px solid #C4A478 !important;
      filter: brightness(0.9);
      background-color: rgba(196, 164, 120, 0.15);
    }
  `
  document.head.appendChild(style)
}

export function flashPinAfterScroll(pin: Pin): void {
  const el = findElementByXPath(pin.selector)
  if (!el || !(el instanceof HTMLElement)) return

  window.setTimeout(() => {
    el.classList.add(PIN_FLASH_CLASS)
    const onEnd = () => {
      el.classList.remove(PIN_FLASH_CLASS)
      el.removeEventListener('animationend', onEnd)
    }
    el.addEventListener('animationend', onEnd)
  }, FLASH_DELAY_MS)
}
