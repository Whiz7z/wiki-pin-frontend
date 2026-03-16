import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './views/App.tsx'

console.log('[CRXJS] Hello world from content script!')

// Inject Prata font so MUI theme typography works inside shadow DOM
const fontLink = document.createElement('link')
fontLink.rel = 'stylesheet'
fontLink.href = 'https://fonts.googleapis.com/css2?family=Marmelad&display=swap'
document.head.appendChild(fontLink)

// Create host element
const host = document.createElement('div')
host.id = 'crxjs-app'
document.body.appendChild(host)

// Create shadow root with open mode (allows external JS access if needed)
const shadowRoot = host.attachShadow({ mode: 'open' })

// Emotion (used by MUI) will inject its style tags into this container.
// Many style tags are normal: Emotion creates one tag per "sheet" per cache,
// and MUI components generate a lot of styled CSS (Button, Dialog, Typography, etc.).
const emotionContainer = document.createElement('div')
emotionContainer.id = 'crxjs-emotion-styles'
shadowRoot.appendChild(emotionContainer)

// Create container for React app inside shadow DOM
const container = document.createElement('div')
container.id = 'crxjs-app-container'
shadowRoot.appendChild(container)

// Modal container: same shadow root so Dialog portals inside shadow DOM (not document.body)
const modalContainer = document.createElement('div')
modalContainer.id = 'crxjs-modal-container'
shadowRoot.appendChild(modalContainer)

// Render React app into shadow DOM; pass emotion container so all Emotion style tags stay in one place
createRoot(container).render(
  <StrictMode>
    <App emotionContainer={emotionContainer} modalContainer={modalContainer} />
  </StrictMode>,
)
