import React, { useCallback, useRef, useState } from 'react'
import { Article } from '@/services/articlesApi'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
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
import LinkIcon from '@mui/icons-material/Link';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { useAuthStore, useArticlesStore, usePinsStore } from '@/stores'
import { useRouter } from '@/popup/router'
import { InfiniteScroll } from '@/popup/components/InfiniteScroll'
import { relevanceChipColor, relevanceShortLabel } from '@/utils/pinRelevance'
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
  const { delete: deleteArticle, updateUserTitle, associate: associateArticle, disassociate: disassociateArticle } = useArticlesStore()
  const fetchPinsForArticle = usePinsStore((s) => s.fetchPinsForArticle)
  const fetchNextPageForArticle = usePinsStore((s) => s.fetchNextPageForArticle)
  const getPins = usePinsStore((s) => s.getPins)
  const pinsLoadingByArticleId = usePinsStore((s) => s.pinsLoadingByArticleId)
  const pinsLoadingMoreByArticleId = usePinsStore((s) => s.pinsLoadingMoreByArticleId)
  const pinsErrorByArticleId = usePinsStore((s) => s.pinsErrorByArticleId)
  const getPaginationForArticle = usePinsStore((s) => s.getPaginationForArticle)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAssociating, setIsAssociating] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitleValue, setEditTitleValue] = useState('')
  const [isSavingTitle, setIsSavingTitle] = useState(false)
  const [accordionExpanded, setAccordionExpanded] = useState(false)
  const hasFetchedPinsRef = useRef(false)

  const pinsForArticle = getPins(article.id)
  const pinsLoading = pinsLoadingByArticleId[article.id] ?? false
  const pinsError = pinsErrorByArticleId[article.id]
  const pinPagination = getPaginationForArticle(article.id)
  const pinCountLabel = article._count?.pins ?? pinPagination?.count ?? pinsForArticle.length
  const pinsLoadingMore = pinsLoadingMoreByArticleId[article.id] ?? false

  const handleAccordionChange = useCallback(
    (_: React.SyntheticEvent, expanded: boolean) => {
      setAccordionExpanded(expanded)
      if (expanded && !hasFetchedPinsRef.current) {
        hasFetchedPinsRef.current = true
        void fetchPinsForArticle(article.id)
      }
    },
    [article.id, fetchPinsForArticle],
  )

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
      await disassociateArticle(article.id)
      setDeleteDialogOpen(false)
    } catch {
      // Store sets error; keep dialog open so user can retry or cancel
    } finally {
      setIsDeleting(false)
    }
  }
  const handleAssociateArticle = async () => {
    setIsAssociating(true)
    try {
      await associateArticle(article.id)
    } catch {
      // Store sets error; keep dialog open so user can retry or cancel
    } finally {
      setIsAssociating(false)
    }
  }

  const handleLoadMorePins = useCallback(() => {
    if (!pinPagination?.next) return
    void fetchNextPageForArticle(article.id)
  }, [article.id, fetchNextPageForArticle, pinPagination?.next])

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
            <IconButton onClick={handleDeleteClick} aria-label="Remove article from your list" color="error" size="small">
              <DeleteOutlineIcon color="error" />
            </IconButton>
          )}
          {!isOwnArticle && (
            <Button onClick={handleAssociateArticle} variant="outlined" size="small" endIcon={<LinkIcon />} disabled={isAssociating}>
              {isAssociating ? 'Associating…' : 'Associate'}
            </Button>
          )}
        </Box>
      </Box>
      <Box sx={styles.content}>
        <Accordion expanded={accordionExpanded} onChange={handleAccordionChange} sx={styles.accordion}>
          <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
            <Box sx={styles.accordionSummary}>
              <Typography variant="body1" title="Edit article">
                ({pinCountLabel} pins)
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={styles.detailsContainer}>
              {pinsLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              {pinsError && (
                <Typography variant="body2" color="error">
                  {pinsError}
                </Typography>
              )}
              {!pinsLoading && !pinsError && pinCountLabel === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No pins on this article yet.
                </Typography>
              )}
              {!pinsLoading && !pinsError && pinCountLabel > 0 && pinsForArticle.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No pins loaded (try reopening).
                </Typography>
              )}
              {!pinsLoading && !pinsError && pinsForArticle.length > 0 && (
                <InfiniteScroll
                  onYEnd={handleLoadMorePins}
                  isLoading={pinsLoadingMore}
                  sx={{ maxHeight: 180 }}
                >
                  <Box sx={styles.pinList}>
                    {pinsForArticle.map((pin) => {
                      const isMine = user != null && pin.authorId === user.id
                      return (
                        <Box
                          key={pin.id}
                          sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75, py: 0.25 }}
                        >
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
                              flex: '1 1 auto',
                              minWidth: 0,
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            {pin.title}
                            {isMine && (
                              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                                (my)
                              </Typography>
                            )}
                          </Typography>
                          <Chip
                            size="small"
                            label={relevanceShortLabel(pin.relevance)}
                            color={relevanceChipColor(pin.relevance)}
                            variant="outlined"
                            sx={{ flexShrink: 0 }}
                          />
                        </Box>
                      )
                    })}
                  </Box>
                </InfiniteScroll>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Remove from your list?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This removes &quot;{displayTitle}&quot; from your list and deletes your pins on this page. Other users&apos; pins are unchanged.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={isDeleting}>
            {isDeleting ? 'Removing…' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
