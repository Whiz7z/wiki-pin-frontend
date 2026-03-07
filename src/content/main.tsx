import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './views/App.tsx'

console.log('[CRXJS] Hello world from content script!')

// Create host element
const host = document.createElement('div')
host.id = 'crxjs-app'
document.body.appendChild(host)

// Create shadow root with open mode (allows external JS access if needed)
const shadowRoot = host.attachShadow({ mode: 'open' })

// Inject styles into shadow DOM
// const styleElement = document.createElement('style')
// styleElement.textContent = styles
// shadowRoot.appendChild(styleElement)

// Create container for React app inside shadow DOM
const container = document.createElement('div')
container.id = 'crxjs-app-container'
shadowRoot.appendChild(container)

// Render React app into shadow DOM with shadow root as prop
createRoot(container).render(
  <StrictMode>
    <App shadowRoot={shadowRoot} />
  </StrictMode>,
)
