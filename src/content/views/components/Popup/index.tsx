import SelectElementIcon from '@/assets/icons/SelectElementIcon'
import { Box, Button, Typography } from '@mui/material'
import React, { useState, useRef, useEffect } from 'react'
import { styles } from './styles'
import selectionStyles from '../../shadow-styles/selection.css?inline'


const STORAGE_KEY = 'wiki-pin-selected-element'
const STORAGE_URL_KEY = 'wiki-pin-selected-url'

const VISIBILITY_CHECK_INTERVAL = 1000 // Check visibility every 1 second
const POSITION_CHECK_INTERVAL = 2000 // Check position every 2 seconds
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
  if (visiblePoints < pointsToCheck.length * 0.05) {
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

// Simplified visibility check (lightweight version)
const quickVisibilityCheck = (element: Element): boolean => {
  if (!(element instanceof HTMLElement)) return false
  const rect = element.getBoundingClientRect()
  const style = window.getComputedStyle(element)
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    parseFloat(style.opacity) > 0
  )
}

const Popup = () => {

  const [enableElementSelection, setEnableElementSelection] = useState(false)
  const outlineRef = useRef<HTMLElement | null>(null)
  const selectedElementRef = useRef<Element | null>(null)
  const clickHandlerRef = useRef<((e: MouseEvent) => void) | null>(null)
  const positionCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null)
  const previousPositionRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null)
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
    // Batch style updates for better performance (single reflow)
    if (isVisible) {
      host.style.cssText = `
        position: absolute;
        left: ${position.left}px;
        top: ${position.top}px;
        width: ${position.width}px;
        height: ${position.height}px;
        pointer-events: none;
        z-index: 2147483646;
        box-sizing: border-box;
        display: block;
      `.trim()
    } else {
      host.style.display = 'none'
    }
  }

  const createOutlineShadowDOM = (target: Element) => {
    console.log('createOutlineShadowDOM', target)

    // Clean up previous position check interval
    if (positionCheckIntervalRef.current) {
      clearInterval(positionCheckIntervalRef.current)
      positionCheckIntervalRef.current = null
    }

    // Clean up previous intersection observer
    if (intersectionObserverRef.current) {
      intersectionObserverRef.current.disconnect()
      intersectionObserverRef.current = null
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
    // Batch all style updates for better performance (single reflow)
    host.style.cssText = `
      position: absolute;
      left: ${rect.left + scrollX}px;
      top: ${rect.top + scrollY}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      pointer-events: none;
      z-index: 2147483646;
      box-sizing: border-box;
      display: ${isVisible ? 'block' : 'none'};
    `.trim()
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
    // Batch style updates for better performance
    outlineElement.style.cssText = `
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    `.trim()
    shadowRoot.appendChild(outlineElement)

    outlineRef.current = host

    // Store initial position
    previousPositionRef.current = {
      left: rect.left + scrollX,
      top: rect.top + scrollY,
      width: rect.width,
      height: rect.height,
    }

    // Optimized position update using IntersectionObserver and throttled checks
    let lastVisibilityCheck = Date.now()
    

    // Use IntersectionObserver for efficient visibility tracking
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry) {
          const isVisible = entry.isIntersecting && entry.intersectionRatio > 0 
          if (previousPositionRef.current) {
            updateOutlinePosition(host, previousPositionRef.current, isVisible)
          }
        }
      },
      {
        threshold: 0.1, // Trigger when at least 10% visible
        rootMargin: '0px',
      }
    )

    // Observe the selected element for visibility changes
    if (selectedElementRef.current instanceof HTMLElement) {
      intersectionObserver.observe(selectedElementRef.current)
    }

    // Store intersection observer for cleanup
    intersectionObserverRef.current = intersectionObserver

    // Throttled position check using setInterval instead of requestAnimationFrame
    const positionCheckInterval = setInterval(() => {
      console.log('positionCheckInterval')
      if (!selectedElementRef.current || !host.isConnected) {
        console.log('positionCheckInterval not connected')
        clearInterval(positionCheckInterval)
        intersectionObserver.disconnect()
        positionCheckIntervalRef.current = null
        intersectionObserverRef.current = null
        return
      }

      // Calculate position
      const currentRect = selectedElementRef.current.getBoundingClientRect()
      const currentScrollX = window.scrollX || window.pageXOffset
      const currentScrollY = window.scrollY || window.pageYOffset

      const currentPosition = {
        left: currentRect.left + currentScrollX,
        top: currentRect.top + currentScrollY,
        width: currentRect.width,
        height: currentRect.height,
      }

      // Only check expensive visibility if position changed or enough time passed
      const now = Date.now()
      const positionChanged =
        !previousPositionRef.current ||
        previousPositionRef.current.left !== currentPosition.left ||
        previousPositionRef.current.top !== currentPosition.top ||
        previousPositionRef.current.width !== currentPosition.width ||
        previousPositionRef.current.height !== currentPosition.height

      // Use quick check by default, full check only when needed
      let isVisible = quickVisibilityCheck(selectedElementRef.current)

      // Only do expensive visibility check if position changed and enough time passed
      if (positionChanged && now - lastVisibilityCheck >= VISIBILITY_CHECK_INTERVAL) {
        isVisible = isElementVisible(selectedElementRef.current)
        lastVisibilityCheck = now
      }

      // Update if position changed
      if (positionChanged) {
        updateOutlinePosition(host, currentPosition, isVisible)
        previousPositionRef.current = currentPosition
      }
    }, POSITION_CHECK_INTERVAL)

    // Store interval ID for cleanup
    positionCheckIntervalRef.current = positionCheckInterval
  }



  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up position check interval
      if (positionCheckIntervalRef.current) {
        clearInterval(positionCheckIntervalRef.current)
        positionCheckIntervalRef.current = null
      }
      // Clean up intersection observer
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect()
        intersectionObserverRef.current = null
      }
    }
  }, [])

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
    <Box className="App" sx={styles.root} >
      <Button variant="contained" color="primary" size="small" onClick={toggle} endIcon={<SelectElementIcon size={12} color="#ffffff" />}>
        <Typography variant="button" >Select</Typography>
      </Button>
    </Box>
  )
}

export default Popup