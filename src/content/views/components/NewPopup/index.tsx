import SelectElementIcon from '@/assets/icons/SelectElementIcon'
import { Box, Button, TextField, Typography } from '@mui/material'
import React, { useState, useRef, useEffect } from 'react'
import { styles } from './styles'
import selectionStyles from '../../shadow-styles/selection.css?inline'
import { useAuth } from '@/hooks/useAuth'

const STORAGE_KEY = 'wiki-pin-selected-element'
const STORAGE_URL_KEY = 'wiki-pin-selected-url'
const STORAGE_OUTLINE_MODE_KEY = 'wiki-pin-outline-mode' // 'shadow' or 'outline'

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

const NewPopup = () => {
  const [enableElementSelection, setEnableElementSelection] = useState(false)
  const [isElementSelected, setIsElementSelected] = useState(false)
  const selectedElementRef = useRef<Element | null>(null)
  const shadowRootRef = useRef<ShadowRoot | null>(null)
  const outlineStyleRef = useRef<string | null>(null) // Store original outline style
  const clickHandlerRef = useRef<((e: MouseEvent) => void) | null>(null)
  const isRestoringRef = useRef(false)
  const { user } = useAuth()

  const toggle = () => setEnableElementSelection((prev) => !prev)

  const saveSelectedElement = (element: Element, outlineMode: 'shadow' | 'outline') => {
    try {
      const xpath = getXPath(element)
      localStorage.setItem(STORAGE_KEY, xpath)
      localStorage.setItem(STORAGE_URL_KEY, window.location.href)
      localStorage.setItem(STORAGE_OUTLINE_MODE_KEY, outlineMode)
      console.log('Saved selected element:', xpath, 'mode:', outlineMode)
    } catch (e) {
      console.error('Error saving selected element:', e)
    }
  }

  const restoreSelectedElement = () => {
    try {
      const savedXPath = localStorage.getItem(STORAGE_KEY)
      const savedUrl = localStorage.getItem(STORAGE_URL_KEY)
      const savedOutlineMode = localStorage.getItem(STORAGE_OUTLINE_MODE_KEY) as 'shadow' | 'outline' | null

      // Only restore if we're on the same URL
      if (savedXPath && savedUrl === window.location.href) {
        const element = findElementByXPath(savedXPath)

        if (element) {
          // Check if element already has outline applied
          const hasShadowRoot = element.shadowRoot !== null
          const hasOutlineStyle = element instanceof HTMLElement && element.style.outline.includes('red')

          if (!hasShadowRoot && !hasOutlineStyle) {
            console.log('Restoring selected element:', savedXPath, 'mode:', savedOutlineMode)
            isRestoringRef.current = true

            // Restore based on saved mode
            if (savedOutlineMode === 'outline' && element instanceof HTMLElement) {
              // Restore outline style directly
              outlineStyleRef.current = element.style.outline || ''
              element.style.outline = '1px solid red'
              selectedElementRef.current = element
              setIsElementSelected(true)
            } else {
              // Try to restore with shadow DOM (will fallback to outline if needed)
              createOutlineShadowDOM(element)
            }

            isRestoringRef.current = false
            return true
          } else {
            // Element already has outline, clear storage
            clearSelectedElement()
          }
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
    localStorage.removeItem(STORAGE_OUTLINE_MODE_KEY)
  }

  const removeOutlineShadowDOM = () => {
    if (selectedElementRef.current) {
      const element = selectedElementRef.current

      // If shadow root exists, remove it by cloning
      if (shadowRootRef.current) {
        const parent = element.parentNode
        if (parent) {
          const clone = element.cloneNode(true) as Element
          // Copy all attributes
          Array.from(element.attributes).forEach((attr) => {
            clone.setAttribute(attr.name, attr.value)
          })
          parent.replaceChild(clone, element)
          shadowRootRef.current = null
        }
      }

      // If outline style was set, restore original
      if (outlineStyleRef.current !== null && element instanceof HTMLElement) {
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
  }

  const createOutlineShadowDOM = (target: Element) => {
    console.log('createOutlineShadowDOM', target)

    // Remove existing outline if any
    if (shadowRootRef.current && selectedElementRef.current || outlineStyleRef.current !== null) {
      removeOutlineShadowDOM()
    }

    // Check if element already has a shadow root
    if (target.shadowRoot) {
      console.warn('Element already has a shadow root, cannot attach outline')
      return
    }

    selectedElementRef.current = target

    // Check if shadow DOM can be attached to this element
    // Some elements like <a>, <button>, <input> cannot have shadow roots
    const canAttachShadow = target instanceof HTMLElement &&
      ['ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'BODY', 'DIV', 'FOOTER', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER', 'MAIN', 'NAV', 'SECTION', 'SPAN', 'P'].includes(target.tagName)

    let outlineMode: 'shadow' | 'outline' = 'shadow'

    if (canAttachShadow) {
      try {
        // Attach shadow root directly to the target element
        // Note: Light DOM children will be hidden unless we use slots
        const shadowRoot = target.attachShadow({ mode: 'open' })
        shadowRootRef.current = shadowRoot

        // Inject selection styles into shadow DOM
        const styleElement = document.createElement('style')
        styleElement.textContent = selectionStyles
        shadowRoot.appendChild(styleElement)

        // Create a wrapper that contains the original content via slot
        // The slot will automatically display light DOM children
        const contentWrapper = document.createElement('div')
        contentWrapper.style.cssText = `
          position: relative;
          width: 100%;
          height: 100%;
        `.trim()

        // Use slot to preserve original light DOM children
        const slot = document.createElement('slot')
        contentWrapper.appendChild(slot)
        shadowRoot.appendChild(contentWrapper)

        // Create outline element that overlays the content
        const outlineElement = document.createElement('div')
        outlineElement.className = 'pin-selected-element'
        // Use absolute positioning to overlay the entire element
        outlineElement.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          pointer-events: none;
          z-index: 9999;
        `.trim()
        contentWrapper.appendChild(outlineElement)

        outlineMode = 'shadow'
      } catch (e) {
        // If attachShadow fails, fall back to outline style
        console.warn('Failed to attach shadow root, using outline fallback:', e)
        if (target instanceof HTMLElement) {
          // Store original outline style
          outlineStyleRef.current = target.style.outline || ''
          target.style.outline = '1px solid red'
          outlineMode = 'outline'
        }
      }
    } else {
      // Element cannot have shadow root, use outline style directly
      console.log('Element cannot have shadow root, using outline style')
      if (target instanceof HTMLElement) {
        // Store original outline style
        outlineStyleRef.current = target.style.outline || ''
        target.style.outline = '1px solid red'
        outlineMode = 'outline'
      }
    }

    // Save the outline mode so we can restore it correctly
    if (!isRestoringRef.current) {
      saveSelectedElement(target, outlineMode)
    }

    // Update selected state
    setIsElementSelected(true)

    // // Make the target element position relative so absolute positioning works
    // if (target instanceof HTMLElement) {
    //   const currentPosition = window.getComputedStyle(target).position
    //   if (currentPosition === 'static') {
    //     //target.style.position = 'relative'
    //   }
    // }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (selectedElementRef.current) {
        removeOutlineShadowDOM()
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
        if (
          target &&
          target !== document.body &&
          target !== document.documentElement &&
          !target.shadowRoot &&
          !(target instanceof HTMLElement && target.style.outline.includes('red'))
        ) {
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
    <Box className="App" sx={styles.root}>
      {isElementSelected &&
        <Box sx={styles.actionContainer}>

          <TextField
            label="XPath"
            size="small"
          />

          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={removeOutlineShadowDOM}
          >
            <Typography variant="button">Remove</Typography>
          </Button>
        </Box>
      }
      <Button
        variant="contained"
        color="primary"
        size="small"
        onClick={toggle}
        endIcon={<SelectElementIcon size={12} color="#ffffff" />}
      >
        <Typography variant="button">Select</Typography>
      </Button>
      {user && <Typography variant="body1">Welcome, {user.name}</Typography>}

    </Box>
  )
}

export default NewPopup
