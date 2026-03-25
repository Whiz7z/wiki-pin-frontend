import React, { useState } from 'react'
import { Typography, Button, Box, IconButton, Card, Chip } from '@mui/material'
import type { Pin } from '@/services/pinsApi'
import { styles } from './styles'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { useAuthStore } from '@/stores'
import { pinsApi } from '@/services/pinsApi'
import { StyledTextField } from '@/theme/components/StyledTextField'
import { PinCommentsSection } from './PinCommentsSection'
import { usePinsStore } from '@/stores'
import { useAuthStoreContent } from '@/hooks/useAuthStoreContent'
import { decayReasonLabel, relevanceChipColor, relevanceShortLabel } from '@/utils/pinRelevance'
import { WIKI_PIN_ANCHOR_SESSION_KEY, articlePageMatchesSession } from '@/utils/wikiPinAnchorSession'

export interface PinContentModalParams {
  pin: Pin
}

interface PinContentModalProps {
  params: PinContentModalParams
  onClose: () => void
}

export function PinContentModal({ params, onClose }: PinContentModalProps) {
  const { user } = useAuthStoreContent()
  const isLoggedIn = !!user
  const { delete: deletePin, triggerPinsRefresh } = usePinsStore()
  const [pin, setPin] = useState(params.pin)
  const isAuthor = !!user && pin.authorId === user.id

  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(pin.title ?? '')
  const [draftContent, setDraftContent] = useState(pin.content ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const startEdit = () => {
    setDraftTitle(pin.title ?? '')
    setDraftContent(pin.content ?? '')
    setIsEditing(true)
    setError(null)
  }

  const cancelEdit = () => {
    setDraftTitle(pin.title ?? '')
    setDraftContent(pin.content ?? '')
    setIsEditing(false)
    setError(null)
  }

  const saveEdit = async () => {
    if (!isAuthor || isSaving) return
    setIsSaving(true)
    setError(null)
    try {
      const updated = await pinsApi.update(pin.id, {
        title: draftTitle.trim(),
        content: draftContent,
      })
      setPin(updated)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pin')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!isAuthor || isDeleting) return
    setIsDeleting(true)
    setError(null)
    try {
      await deletePin(pin.id)
      triggerPinsRefresh()
      setDeleteConfirmOpen(false)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pin')
    } finally {
      setIsDeleting(false)
    }
  }

  /** Content script cannot open tabs; we stay on this page, persist session, and close the modal so EditAnchorSessionPanel runs. */
  const openAnchorSession = async (mode: 'refresh' | 'reanchor') => {
    if (!pin.article?.url) {
      setError('Article URL is missing.')
      return
    }
    setError(null)
    try {
      if (typeof chrome === 'undefined' || !chrome.storage?.local) {
        setError('Extension storage is not available.')
        return
      }
      if (!articlePageMatchesSession(pin.article.url, window.location.href)) {
        setError(
          'This pin belongs to another article. Open that article in this tab, then try again.',
        )
        return
      }
      await chrome.storage.local.set({
        [WIKI_PIN_ANCHOR_SESSION_KEY]: {
          pinId: pin.id,
          mode,
          articleUrl: pin.article.url,
        },
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start anchor session')
    }
  }

  return (
    <Box sx={styles.root}>
      <Box sx={styles.header}>
        <Typography variant="h6" gutterBottom>
          Pin
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={styles.content}>
        {isAuthor && isLoggedIn && (
          <Box sx={styles.actionsRow}>
            {!isEditing ? (
              <Box sx={styles.editDeleteRow}>
                <Button variant="outlined" onClick={startEdit}>
                  Edit
                </Button>
                {!deleteConfirmOpen && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={() => setDeleteConfirmOpen(true)}
                  >
                    Delete
                  </Button>
                )}
                {deleteConfirmOpen && (
                  <Box sx={styles.deleteRow}>
                    <Button variant="outlined" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button variant="outlined"
                      color="error"
                      startIcon={<DeleteOutlineIcon />} onClick={handleDeleteConfirm} disabled={isDeleting}>Confirm Delete</Button>
                  </Box>
                )}
              </Box>
            ) : (
              <>
                <Button variant="contained" onClick={saveEdit} disabled={isSaving || draftTitle.trim().length === 0}>
                  Save
                </Button>
                <Button variant="outlined" onClick={cancelEdit} disabled={isSaving}>
                  Cancel
                </Button>
              </>
            )}
            {error && (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            )}
          </Box>
        )}

        {isEditing ? (
          <StyledTextField
            label="Title"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            size="small"
            fullWidth
            sx={styles.titleField}
          />
        ) : (
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{pin.title}
            <Chip
              size="small"
              label={relevanceShortLabel(pin.relevance)}
              color={relevanceChipColor(pin.relevance)}
              variant="outlined"
            />
            {decayReasonLabel(pin.decayReason) && (
              <Typography variant="body2" color="text.secondary" sx={{ flex: '1 1 100%' }}>
                {decayReasonLabel(pin.decayReason)}
              </Typography>
            )}
          </Typography>
        )}
        {isAuthor && isLoggedIn && pin.article && !isEditing && (
          <Box sx={styles.anchorSessionButtons}>
            <Button size="small" variant="outlined" onClick={() => void openAnchorSession('refresh')}>
              Refresh relevance
            </Button>
            <Button size="small" variant="outlined" onClick={() => void openAnchorSession('reanchor')}>
              Edit anchor
            </Button>
          </Box>
        )}

        <Card sx={styles.contentCard}>
          {isEditing ? (
            <StyledTextField
              label="Content"
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              multiline
              minRows={6}
              fullWidth
            />
          ) : (
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {pin.content}
            </Typography>
          )}
        </Card>

        <PinCommentsSection pinId={pin.id} />
      </Box>


    </Box>
  )
}

export default PinContentModal