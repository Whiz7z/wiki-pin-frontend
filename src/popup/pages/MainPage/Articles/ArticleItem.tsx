import React, { useState } from 'react'
import { Article } from '@/services/articlesApi'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Input,
  Link,
  Theme,
  Typography,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import PushPinIcon from '@mui/icons-material/PushPin'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { useAuthStore, useArticlesStore } from '@/stores'
import { useRouter } from '@/popup/router'
const styles = {
  root: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    display: 'flex',
    flexDirection: 'row',
    gap: 1,
    alignItems: 'center',
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    gap: 1,
  },
  content: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  accordion: (theme: Theme) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'none',
    borderBottom: `1px solid ${theme.palette.divider}`,
    borderRadius: '6px',
    '& .MuiAccordionSummary-root.Mui-expanded': {
      minHeight: '64px !important',
      height: '64px !important',
    },
  }),
  accordionSummary: () => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 1,
  }),
  pinList: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  detailsContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  pinListContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
}

export default function ArticleItem({
  article,
  isOwnArticle,
}: {
  article: Article
  isOwnArticle?: boolean
}) {
  const { user } = useAuthStore()
  const { navigate } = useRouter()
  const { delete: deleteArticle, updateUserTitle } = useArticlesStore()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitleValue, setEditTitleValue] = useState('')
  const [isSavingTitle, setIsSavingTitle] = useState(false)

  const displayTitle = article.userTitle ?? article.title

  const handleEditTitleClick = () => {
    setEditTitleValue(displayTitle)
    setIsEditingTitle(true)
  }
  const handleCancelEditTitle = () => {
    setIsEditingTitle(false)
    setEditTitleValue('')
  }
  const handleSaveTitle = async () => {
    const trimmed = editTitleValue.trim()
    setIsSavingTitle(true)
    try {
      await updateUserTitle(article.id, trimmed || null)
      setIsEditingTitle(false)
      setEditTitleValue('')
    } catch {
      // Store sets error
    } finally {
      setIsSavingTitle(false)
    }
  }

  const handleDeleteClick = () => setDeleteDialogOpen(true)
  const handleDeleteDialogClose = () => {
    if (!isDeleting) setDeleteDialogOpen(false)
  }
  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      await deleteArticle(article.id)
      setDeleteDialogOpen(false)
    } catch {
      // Store sets error; keep dialog open so user can retry or cancel
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Box sx={styles.root}>
      <Box sx={styles.header}>
        <Box sx={styles.title}>
          {isEditingTitle && isOwnArticle ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}>
              <Input
                value={editTitleValue}
                onChange={(e) => setEditTitleValue(e.target.value)}
                placeholder="Article title"
                size="small"
                sx={{ fontSize: '1.25rem' }}
                disabled={isSavingTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle()
                  if (e.key === 'Escape') handleCancelEditTitle()
                }}
                autoFocus
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="contained" onClick={handleSaveTitle} disabled={isSavingTitle || !editTitleValue.trim()}>
                  {isSavingTitle ? 'Saving…' : 'Save'}
                </Button>
                <Button size="small" onClick={handleCancelEditTitle} disabled={isSavingTitle}>
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Typography variant="h6" sx={{ wordBreak: 'break-all' }}>
              <Link href={article.url} target="_blank" title={article.url}>{displayTitle}</Link>
            </Typography>
          )}
        </Box>

        <Box sx={styles.actions}>
          {isOwnArticle && !isEditingTitle && (
            <IconButton onClick={handleEditTitleClick} aria-label="Edit title" size="small">
              <EditIcon />
            </IconButton>
          )}
          {isOwnArticle && !isEditingTitle && (
            <IconButton onClick={handleDeleteClick} aria-label="Delete article" color="error" size="small">
              <DeleteOutlineIcon color="error" />
            </IconButton>
          )}
        </Box>
      </Box>
      <Box sx={styles.content}>
        <Accordion sx={styles.accordion}>
          <AccordionSummary >
            <Box sx={styles.accordionSummary}>
              <Typography variant="body1" title="Edit article">
                ({article._count?.pins} pins)
              </Typography>
              <IconButton>
                <ArrowDropDownIcon />
              </IconButton>
            </Box>
          </AccordionSummary>
          <AccordionDetails >
            <Box sx={styles.detailsContainer}>
              <Box sx={styles.pinListContainer}>
                <Typography variant="body1" color="success">My pins</Typography>
                <Box sx={styles.pinList}>
                  {article.pins?.filter((pin) => pin.authorId === user?.id).map((pin) => (
                    <Box key={pin.id}>
                      <Typography
                        variant="body1"
                        component="button"
                        onClick={() => navigate('pin', { params: { pinId: pin.id } })}
                        sx={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          textAlign: 'left',
                          font: 'inherit',
                          color: 'inherit',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        {pin.title}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box sx={styles.pinListContainer}>
                <Typography variant="body1" color="error">Other pins</Typography>
                <Box sx={styles.pinList}>
                  {article.pins?.filter((pin) => pin.authorId !== user?.id).map((pin) => (
                    <Box key={pin.id}>
                      <Typography
                        variant="body1"
                        component="button"
                        onClick={() => navigate('pin', { params: { pinId: pin.id } })}
                        sx={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          textAlign: 'left',
                          font: 'inherit',
                          color: 'inherit',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        {pin.title}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete article?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete &quot;{displayTitle}&quot;? This will remove the article and all its pins. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}