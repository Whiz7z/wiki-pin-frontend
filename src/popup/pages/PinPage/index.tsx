import React, { useEffect, useState } from 'react'
import { Box, Button, Card, Chip, CircularProgress, Link, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { useRouter } from '@/popup/router'
import { pinsApi, type Pin } from '@/services/pinsApi'
import { styles } from './styles'
import { useAuthStore, usePinsStore } from '@/stores'
import { StyledTextField } from '@/theme/components/StyledTextField'
import PinCommentSection from '@/popup/components/PinCommentSection'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import {
  decayReasonLabel,
  relevanceChipColor,
  relevanceShortLabel,
} from '@/utils/pinRelevance'
import { WIKI_PIN_ANCHOR_SESSION_KEY } from '@/utils/wikiPinAnchorSession'

export default function PinPage() {
  const { params, navigate, goBack } = useRouter()
  const { user } = useAuthStore()
  const isLoggedIn = !!user
  const {delete: deletePin} = usePinsStore()
  const pinId = params?.pinId
  const [pin, setPin] = useState<Pin | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!pinId) {
      navigate('main', { replace: true })
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    pinsApi
      .getById(pinId)
      .then((data) => {
        if (!cancelled) {
          setPin(data)
          setIsEditing(false)
          setDraftTitle(data.title ?? '')
          setDraftContent(data.content ?? '')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load pin')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [pinId, navigate])

  if (!pinId) return null

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !pin) {
    return (
      <Box sx={{ p: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={goBack} sx={{ mb: 2 }}>
          Back
        </Button>
        <Typography color="error">{error ?? 'Pin not found'}</Typography>
      </Box>
    )
  }

  const isAuthor = !!user && pin.authorId === user.id

  const startEdit = () => {
    setDraftTitle(pin.title ?? '')
    setDraftContent(pin.content ?? '')
    setIsEditing(true)
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
      setDeleteConfirmOpen(false)
      goBack()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pin')
    } finally {
      setIsDeleting(false)
    }
  }

  const openAnchorSession = async (mode: 'refresh' | 'reanchor') => {
    if (!pin.article?.url) {
      setError('Article URL is missing.')
      return
    }
    setError(null)
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.set({
          [WIKI_PIN_ANCHOR_SESSION_KEY]: {
            pinId: pin.id,
            mode,
            articleUrl: pin.article.url,
          },
        })
      } else {
        setError('Extension storage is not available.')
        return
      }
      if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
        chrome.tabs.create({ url: pin.article.url })
      } else {
        setError('Cannot open a new tab from this context.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start anchor session')
    }
  }

  return (
    <Box sx={styles.root}>
      <Box sx={styles.headerRow}>
        
        <Button startIcon={<ArrowBackIcon />} onClick={goBack} sx={{ mb: 2 }}>
          Back
        </Button>
        {isAuthor && isLoggedIn && (
          <Box sx={styles.actionsRow}>
            {!isEditing ? (
              <>
                <Button variant="outlined" onClick={startEdit}>
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteOutlineIcon />}
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  Delete
                </Button>
              </>
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
      </Box>

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
        <Typography variant="h5" gutterBottom>
          {pin.title}
        </Typography>
      )}

      {pin.article && (
        <Typography variant="body2" color="text.secondary" sx={styles.articleInfo}>
          Article:
          <Link href={pin.article.url} target="_blank" title={pin.article.url}> {pin.article.title}</Link>
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

      <Card sx={styles.pinContent}>
        {isEditing ? (
          <StyledTextField
            label="Content"
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            multiline
            minRows={8}
            fullWidth
          />
        ) : (
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {pin.content}
          </Typography>
        )}
      </Card>
      <PinCommentSection pinId={pin.id} />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete pin"
        message="Are you sure you want to delete this pin? This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmColor="error"
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  )
}
