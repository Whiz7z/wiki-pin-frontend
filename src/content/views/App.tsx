import Logo from '@/assets/crx.svg'
import { useState, useEffect, useRef } from 'react'
import selectionStyles from './shadow-styles/selection.css?inline'
import SelectElementIcon from '@/assets/icons/SelectElementIcon'
import { Box } from '@mui/material'
import { styles } from './styles'

const STORAGE_KEY = 'wiki-pin-selected-element'
const STORAGE_URL_KEY = 'wiki-pin-selected-url'

// Generate XPath for an element
const getXPath = (element: Element): string => {
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

// Find element by XPath
const findElementByXPath = (xpath: string): Element | null => {
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

// Advanced visibility checking function
const isElementVisible = (element: Element): boolean => {
  if (!element || !(element instanceof HTMLElement)) {
    return false
  }

  const htmlElement = element as HTMLElement

  // 1. Check if element has dimensions
  const rect = htmlElement.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) {
    return false
  }

  // 2. Check computed styles: display, visibility, opacity
  const computedStyle = window.getComputedStyle(htmlElement)
  if (
    computedStyle.display === 'none' ||
    computedStyle.visibility === 'hidden' ||
    computedStyle.visibility === 'collapse' ||
    parseFloat(computedStyle.opacity) === 0
  ) {
    return false
  }

  // 3. Check if element has offsetParent (not display: none in parent chain)
  if (htmlElement.offsetParent === null && computedStyle.position !== 'fixed') {
    return false
  }

  // 4. Check if element is in viewport
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight

  if (
    rect.right < 0 ||
    rect.bottom < 0 ||
    rect.left > viewportWidth ||
    rect.top > viewportHeight
  ) {
    return false
  }

  // 5. Check parent chain for visibility issues
  let parent: HTMLElement | null = htmlElement.parentElement
  while (parent && parent !== document.body) {
    const parentStyle = window.getComputedStyle(parent)
    if (
      parentStyle.display === 'none' ||
      parentStyle.visibility === 'hidden' ||
      parseFloat(parentStyle.opacity) === 0
    ) {
      return false
    }
    parent = parent.parentElement
  }

  // 6. Check if element is covered by another element (using elementFromPoint)
  // Check center point and corners
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  const topLeftX = rect.left + 1
  const topLeftY = rect.top + 1
  const bottomRightX = rect.right - 1
  const bottomRightY = rect.bottom - 1

  const pointsToCheck = [
    { x: centerX, y: centerY },
    { x: topLeftX, y: topLeftY },
    { x: bottomRightX, y: topLeftY },
    { x: topLeftX, y: bottomRightY },
    { x: bottomRightX, y: bottomRightY },
  ]

  let visiblePoints = 0
  for (const point of pointsToCheck) {
    const elementAtPoint = document.elementFromPoint(point.x, point.y)
    if (elementAtPoint) {
      // Check if the element at point is the target element or its descendant
      let isTargetOrDescendant = false
      let current: Element | null = elementAtPoint
      while (current) {
        if (current === element) {
          isTargetOrDescendant = true
          break
        }
        current = current.parentElement
      }
      if (isTargetOrDescendant) {
        visiblePoints++
      }
    }
  }

  // If less than 50% of checked points are visible, consider element hidden
  if (visiblePoints < pointsToCheck.length * 0.5) {
    return false
  }

  // 7. Check if element is clipped by overflow: hidden on parents
  parent = htmlElement.parentElement
  while (parent && parent !== document.body) {
    const parentStyle = window.getComputedStyle(parent)
    const parentRect = parent.getBoundingClientRect()

    if (parentStyle.overflow === 'hidden' || parentStyle.overflow === 'clip') {
      // Check if element is within parent's bounds
      if (
        rect.left < parentRect.left ||
        rect.top < parentRect.top ||
        rect.right > parentRect.right ||
        rect.bottom > parentRect.bottom
      ) {
        return false
      }
    }
    parent = parent.parentElement
  }

  return true
}

function App() {
  const [enableElementSelection, setEnableElementSelection] = useState(false)
  const outlineRef = useRef<HTMLElement | null>(null)
  const selectedElementRef = useRef<Element | null>(null)
  const clickHandlerRef = useRef<((e: MouseEvent) => void) | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const previousPositionRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null)
  const frameCountRef = useRef<number>(0)
  const isRestoringRef = useRef(false)

  const toggle = () => setEnableElementSelection((prev) => !prev)

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

  const restoreSelectedElement = () => {
    try {
      const savedXPath = localStorage.getItem(STORAGE_KEY)
      const savedUrl = localStorage.getItem(STORAGE_URL_KEY)

      // Only restore if we're on the same URL
      if (savedXPath && savedUrl === window.location.href) {
        const element = findElementByXPath(savedXPath)
        if (element) {
          console.log('Restoring selected element:', savedXPath)
          isRestoringRef.current = true
          createOutlineShadowDOM(element)
          isRestoringRef.current = false
          return true
        } else {
          // Element not found, clear storage
          clearSelectedElement()
        }
      }
    } catch (e) {
      console.error('Error restoring selected element:', e)
    }
    return false
  }

  const clearSelectedElement = () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_URL_KEY)
  }

  const updateOutlinePosition = (
    host: HTMLElement,
    position: { left: number; top: number; width: number; height: number },
    isVisible: boolean
  ) => {
    console.log('updateOutlinePosition', { isVisible })
    if (isVisible) {
      host.style.display = 'block'
      host.style.left = `${position.left}px`
      host.style.top = `${position.top}px`
      host.style.width = `${position.width}px`
      host.style.height = `${position.height}px`
    } else {
      host.style.display = 'none'
    }
  }

  const createOutlineShadowDOM = (target: Element) => {
    console.log('createOutlineShadowDOM', target)

    // Clean up previous animation frame loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // Remove existing outline if any
    if (outlineRef.current) {
      outlineRef.current.remove()
      outlineRef.current = null
    }

    selectedElementRef.current = target

    // Save to localStorage (unless we're restoring)
    if (!isRestoringRef.current) {
      saveSelectedElement(target)
    }

    // Get element's bounding box
    const rect = target.getBoundingClientRect()
    const scrollX = window.scrollX || window.pageXOffset
    const scrollY = window.scrollY || window.pageYOffset

    // Check initial visibility using advanced visibility checker
    const isVisible = isElementVisible(target)

    // Create host element for shadow DOM
    const host = document.createElement('div')
    host.style.position = 'absolute'
    host.style.left = `${rect.left + scrollX}px`
    host.style.top = `${rect.top + scrollY}px`
    host.style.width = `${rect.width}px`
    host.style.height = `${rect.height}px`
    host.style.pointerEvents = 'none'
    host.style.zIndex = '2147483646' // Just below our popup
    host.style.boxSizing = 'border-box'
    host.style.display = isVisible ? 'block' : 'none'
    host.id = 'crxjs-outline-host'
    document.body.appendChild(host)

    // Create shadow root
    const shadowRoot = host.attachShadow({ mode: 'open' })

    // Inject selection styles into shadow DOM
    const styleElement = document.createElement('style')
    styleElement.textContent = selectionStyles
    shadowRoot.appendChild(styleElement)

    // Create outline element
    const outlineElement = document.createElement('div')
    outlineElement.className = 'pin-selected-element'
    outlineElement.style.width = '100%'
    outlineElement.style.height = '100%'
    outlineElement.style.boxSizing = 'border-box'
    shadowRoot.appendChild(outlineElement)

    outlineRef.current = host

    // Store initial position
    previousPositionRef.current = {
      left: rect.left + scrollX,
      top: rect.top + scrollY,
      width: rect.width,
      height: rect.height,
    }

    // Reset frame counter
    frameCountRef.current = 0

    // Position update loop using requestAnimationFrame
    // Check position every ~60 frames (approximately 1 second at 60fps)
    const checkAndUpdatePosition = () => {
      if (!selectedElementRef.current || !host.isConnected) {
        console.log('checkAndUpdatePosition selectedElementRef.current or host.isConnected is false')
        animationFrameRef.current = null
        return
      }

      frameCountRef.current++

      // Check position every ~120 frames (2 seconds at 60fps)
      if (frameCountRef.current >= 120) {
        console.log('checkAndUpdatePosition frameCountRef.current >= 120')
        frameCountRef.current = 0

        // Calculate position once
        const currentRect = selectedElementRef.current.getBoundingClientRect()
        const currentScrollX = window.scrollX || window.pageXOffset
        const currentScrollY = window.scrollY || window.pageYOffset

        // Check if element is visible using advanced visibility checker
        const isVisible = isElementVisible(selectedElementRef.current)

        const currentPosition = {
          left: currentRect.left + currentScrollX,
          top: currentRect.top + currentScrollY,
          width: currentRect.width,
          height: currentRect.height,
        }

        // Update if position changed OR visibility changed
        const positionChanged =
          !previousPositionRef.current ||
          previousPositionRef.current.left !== currentPosition.left ||
          previousPositionRef.current.top !== currentPosition.top ||
          previousPositionRef.current.width !== currentPosition.width ||
          previousPositionRef.current.height !== currentPosition.height

        if (positionChanged || !previousPositionRef.current) {
          console.log('Position or visibility changed, updating outline', { isVisible })
          // Pass the already calculated position and visibility status
          updateOutlinePosition(host, currentPosition, isVisible)
          previousPositionRef.current = currentPosition
        }
      }

      // Continue the loop
      animationFrameRef.current = requestAnimationFrame(checkAndUpdatePosition)
    }

    // Start the position check loop
    animationFrameRef.current = requestAnimationFrame(checkAndUpdatePosition)
  }

  // Restore selected element on mount
  useEffect(() => {
    console.log('restoreSelectedElement useEffect')
    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      restoreSelectedElement()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    console.log('enableElementSelection', enableElementSelection)
    if (enableElementSelection) {
      document.body.style.cursor = 'crosshair'

      if (clickHandlerRef.current) {
        document.body.removeEventListener('click', clickHandlerRef.current, true)
        clickHandlerRef.current = null

      }

      const handleClick = (e: MouseEvent) => {

        const target = e.target as Element
        if (target && target !== document.body && target !== document.documentElement && !target.shadowRoot) {
          console.log('Click observed')
          e.preventDefault()
          e.stopPropagation()

          console.log('Selected element:', target)
          createOutlineShadowDOM(target)
        }
      }

      clickHandlerRef.current = handleClick
      document.body.addEventListener('click', handleClick, true) // Use capture phase
    } else {
      document.body.style.cursor = 'default'

      // Remove element selection click handler (but keep outline visible)
      if (clickHandlerRef.current) {
        document.body.removeEventListener('click', clickHandlerRef.current, true)
        clickHandlerRef.current = null

      }
    }

  }, [enableElementSelection])

  return (
    <div className="popup-container" >
      <button className="toggle-button" onClick={toggle}>
        <SelectElementIcon />
      </button>
    </div>
  )
}

export default App
