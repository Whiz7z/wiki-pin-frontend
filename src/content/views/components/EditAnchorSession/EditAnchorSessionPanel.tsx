import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Box, Button, Card, CircularProgress, TextField, Typography } from '@mui/material'
import { pinsApi, type Pin } from '@/services/pinsApi'
import { usePinsStore } from '@/stores'
import {
  WIKI_PIN_ANCHOR_SESSION_KEY,
  parseAnchorSession,
  articlePageMatchesSession,
  type WikiPinAnchorSession,
} from '@/utils/wikiPinAnchorSession'
import {
  findElementByXPath,
  getAnchorTextFromElement,
  getElementDocumentYOffset,
  getXPath,
} from '@/content/views/components/SelectMode/SelectMode'
import { anchorOutlines, styles } from './styles'

function applyOutline(el: HTMLElement, outline: string): () => void {
  const prev = el.style.outline
  el.style.outline = outline
  return () => {
    if (prev === '') el.style.removeProperty('outline')
    else el.style.outline = prev
  }
}

export default function EditAnchorSessionPanel() {
  const [session, setSession] = useState<WikiPinAnchorSession | null>(null)
  const [pin, setPin] = useState<Pin | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [loadingPin, setLoadingPin] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentText, setCurrentText] = useState('')
  const [newElement, setNewElement] = useState<Element | null>(null)
  const [resolveError, setResolveError] = useState<string | null>(null)

  const oldCleanupRef = useRef<(() => void) | null>(null)
  const newCleanupRef = useRef<(() => void) | null>(null)
  const clickHandlerRef = useRef<((e: MouseEvent) => void) | null>(null)

  const clearSession = useCallback(async () => {
    try {
      await chrome.storage.local.remove(WIKI_PIN_ANCHOR_SESSION_KEY)
    } catch {
      /* ignore */
    }
    setSession(null)
    setPin(null)
    setLoadError(null)
    setActionError(null)
    setResolveError(null)
    setCurrentText('')
    setNewElement(null)
    oldCleanupRef.current?.()
    oldCleanupRef.current = null
    newCleanupRef.current?.()
    newCleanupRef.current = null
    if (clickHandlerRef.current) {
      document.body.removeEventListener('click', clickHandlerRef.current, true)
      clickHandlerRef.current = null
    }
    document.body.style.cursor = ''
  }, [])

  const loadSessionFromStorage = useCallback(async () => {
    try {
      const result = await chrome.storage.local.get(WIKI_PIN_ANCHOR_SESSION_KEY)
      const parsed = parseAnchorSession(result[WIKI_PIN_ANCHOR_SESSION_KEY])
      if (!parsed || !articlePageMatchesSession(parsed.articleUrl, window.location.href)) {
        setSession(null)
        return
      }
      setSession(parsed)
    } catch {
      setSession(null)
    }
  }, [])

  useEffect(() => {
    void loadSessionFromStorage()
    const onChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (area !== 'local' || !changes[WIKI_PIN_ANCHOR_SESSION_KEY]) return
      void loadSessionFromStorage()
    }
    chrome.storage.onChanged.addListener(onChange)
    return () => chrome.storage.onChanged.removeListener(onChange)
  }, [loadSessionFromStorage])

  useEffect(() => {
    if (!session) return
    let cancelled = false
    setLoadingPin(true)
    setLoadError(null)
    setPin(null)
    pinsApi
      .getById(session.pinId)
      .then((p) => {
        if (cancelled) return
        if (p.article?.url && !articlePageMatchesSession(p.article.url, window.location.href)) {
          setLoadError('This tab does not match the pin’s article URL.')
          setPin(null)
          return
        }
        setPin(p)
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load pin')
      })
      .finally(() => {
        if (!cancelled) setLoadingPin(false)
      })
    return () => {
      cancelled = true
    }
  }, [session])

  useEffect(() => {
    oldCleanupRef.current?.()
    oldCleanupRef.current = null
    newCleanupRef.current?.()
    newCleanupRef.current = null
    setResolveError(null)
    setNewElement(null)
    setCurrentText('')

    if (!session || !pin || loadError) return

    const el = findElementByXPath(pin.selector)
    if (!el || !(el instanceof HTMLElement)) {
      setResolveError('Could not find the pinned element on this page (selector may be outdated).')
      return
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'center' })

    if (session.mode === 'refresh') {
      oldCleanupRef.current = applyOutline(el, anchorOutlines.refresh)
      return () => {
        oldCleanupRef.current?.()
        oldCleanupRef.current = null
      }
    }

    oldCleanupRef.current = applyOutline(el, anchorOutlines.old)
    setCurrentText(getAnchorTextFromElement(el))

    const handleClick = (e: MouseEvent) => {
      if (e.composedPath().some((n) => n instanceof HTMLElement && n.id === 'crxjs-app')) {
        return
      }
      const target = e.target as Element
      if (
        !target ||
        target === document.body ||
        target === document.documentElement ||
        target.shadowRoot
      ) {
        return
      }
      e.preventDefault()
      e.stopPropagation()
      newCleanupRef.current?.()
      newCleanupRef.current = null
      if (!(target instanceof HTMLElement)) return
      setNewElement(target)
      newCleanupRef.current = applyOutline(target, anchorOutlines.new)
      setCurrentText(getAnchorTextFromElement(target))
    }

    clickHandlerRef.current = handleClick
    document.body.style.cursor = 'crosshair'
    document.body.addEventListener('click', handleClick, true)

    return () => {
      document.body.style.cursor = ''
      if (clickHandlerRef.current) {
        document.body.removeEventListener('click', clickHandlerRef.current, true)
        clickHandlerRef.current = null
      }
      oldCleanupRef.current?.()
      oldCleanupRef.current = null
      newCleanupRef.current?.()
      newCleanupRef.current = null
    }
  }, [session, pin, loadError])

  const handleRefreshSubmit = async () => {
    if (!session || !pin) return
    setSubmitting(true)
    setActionError(null)
    try {
      await pinsApi.refresh(session.pinId)
      usePinsStore.getState().triggerPinsRefresh()
      await clearSession()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Refresh failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReanchorSubmit = async () => {
    if (!session || !pin) return
    const text = currentText.trim()
    if (!text) {
      setActionError('Anchor text is required.')
      return
    }
    const newSelector = newElement ? getXPath(newElement) : undefined
    const elForY = newElement ?? findElementByXPath(pin.selector)
    const yOffset = elForY ? getElementDocumentYOffset(elForY) : undefined
    setSubmitting(true)
    setActionError(null)
    try {
      await pinsApi.reanchor(session.pinId, {
        currentText: text,
        newSelector,
        ...(yOffset !== undefined ? { yOffset } : {}),
      })
      usePinsStore.getState().triggerPinsRefresh()
      await clearSession()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Re-anchor failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (!session) return null

  return (
    <Card sx={styles.card} elevation={8}>
      <Typography variant="subtitle2" sx={styles.title}>
        {session.mode === 'refresh' ? 'Mark pin as active' : 'Re-anchor pin'}
      </Typography>

      <Box sx={styles.contentSlot}>
        {loadingPin && (
          <Box sx={styles.loadingCenter}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!loadingPin && loadError && (
          <Box sx={styles.errorBlock}>
            <Alert severity="error" sx={styles.alert}>
              {loadError}
            </Alert>
            <Button variant="outlined" size="small" onClick={() => void clearSession()}>
              Dismiss
            </Button>
          </Box>
        )}

        {!loadingPin && !loadError && resolveError && (
          <Box sx={styles.errorBlock}>
            <Alert severity="warning" sx={styles.alert}>
              {resolveError}
            </Alert>
            <Button variant="outlined" size="small" onClick={() => void clearSession()}>
              Dismiss
            </Button>
          </Box>
        )}

        {!loadingPin && !loadError && pin && !resolveError && session.mode === 'refresh' && (
          <Box sx={styles.formBlock}>
            <Typography variant="body2" color="text.secondary" sx={styles.hint}>
              Confirms the pin is still valid on your side. This marks relevance active without changing the
              stored anchor.
            </Typography>
            {actionError && (
              <Alert severity="error" sx={styles.alert}>
                {actionError}
              </Alert>
            )}
            <Box sx={styles.actionsRow}>
              <Button
                variant="contained"
                size="small"
                onClick={() => void handleRefreshSubmit()}
                disabled={submitting}
              >
                {submitting ? '…' : 'Confirm'}
              </Button>
              <Button variant="outlined" size="small" onClick={() => void clearSession()} disabled={submitting}>
                Cancel
              </Button>
            </Box>
          </Box>
        )}

        {!loadingPin && !loadError && pin && !resolveError && session.mode === 'reanchor' && (
          <Box sx={styles.formBlock}>
            <Typography variant="body2" color="text.secondary" sx={styles.hint}>
              Blue: current anchor. Click another element to choose a new anchor (green). Edit text if needed.
            </Typography>
            <TextField
              label="Text for new anchor hash"
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              multiline
              minRows={3}
              maxRows={3}
              fullWidth
              size="small"
              sx={styles.textField}
            />
            {newElement && (
              <Typography variant="caption" display="block" sx={styles.xpathCaption}>
                New XPath: {getXPath(newElement)}
              </Typography>
            )}
            {actionError && (
              <Alert severity="error" sx={styles.alert}>
                {actionError}
              </Alert>
            )}
            <Box sx={styles.actionsRow}>
              <Button
                variant="contained"
                size="small"
                onClick={() => void handleReanchorSubmit()}
                disabled={submitting}
              >
                {submitting ? '…' : 'Save new anchor'}
              </Button>
              <Button variant="outlined" size="small" onClick={() => void clearSession()} disabled={submitting}>
                Cancel
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Card>
  )
}
