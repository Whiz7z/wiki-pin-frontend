import React, { useEffect, useState } from 'react'
import { Box, Button, Card, CircularProgress, Link, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { useRouter } from '@/popup/router'
import { pinsApi, type Pin } from '@/services/pinsApi'
import { styles } from './styles'
import { useAuthStore, usePinsStore } from '@/stores'
import { StyledTextField } from '@/theme/components/StyledTextField'
import PinCommentSection from '@/popup/components/PinCommentSection'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export default function PinPage() {
  const { params, navigate, goBack } = useRouter()
  const { user } = useAuthStore()
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

  return (
    <Box sx={styles.root}>
      <Box sx={styles.headerRow}>
        
        <Button startIcon={<ArrowBackIcon />} onClick={goBack} sx={{ mb: 2 }}>
          Back
        </Button>
        {isAuthor && (
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
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Article:
          <Link href={pin.article.url} target="_blank" title={pin.article.url}> {pin.article.title}</Link>

        </Typography>
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
