import React, { useEffect, useCallback, useState } from 'react'
import { Box, Typography, Button, CircularProgress } from '@mui/material'
import { useCommentsStore } from '@/stores'
import type { Comment } from '@/services/commentsApi'
import InfiniteScroll from '@/popup/components/InfiniteScroll'
import { StyledTextField } from '@/theme/components/StyledTextField'

import { styles } from './styles'

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { dateStyle: 'short' }) + ' ' + d.toLocaleTimeString(undefined, { timeStyle: 'short' })
  } catch {
    return iso
  }
}

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <Box sx={styles.commentItem}>
      <Typography variant="body2" color="text.secondary" sx={styles.commentMeta}>
        {comment.author?.name ?? comment.author?.email ?? 'Unknown'} · {formatDate(comment.createdAt)}
      </Typography>
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
        {comment.content}
      </Typography>
    </Box>
  )
}

interface PinCommentSectionProps {
  pinId: string
}

export default function PinCommentSection({ pinId }: PinCommentSectionProps) {
  const { comments, isLoading, error, fetchByPin, fetchNextPage, create: createComment, getNextUrl } = useCommentsStore()
  const [newContent, setNewContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (pinId) fetchByPin(pinId)
  }, [pinId, fetchByPin])

  const handleLoadMore = useCallback(() => {
    const next = getNextUrl()
    if (next) fetchNextPage(next)
  }, [getNextUrl, fetchNextPage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = newContent.trim()
    if (!content || submitting) return
    setSubmitting(true)
    try {
      await createComment({ content, pinId })
      setNewContent('')
    } finally {
      setSubmitting(false)
    }
  }

  const results = comments.results as Comment[]
  const hasMore = !!comments.next

  return (
    <Box sx={styles.root}>
      <Typography variant="subtitle1" sx={styles.sectionTitle}>
        Comments {comments.count > 0 ? `(${comments.count})` : ''}
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={styles.addForm}>
        <StyledTextField
          placeholder="Add a comment…"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          multiline
          minRows={2}
          maxRows={6}
          size="small"
          fullWidth
          disabled={submitting}
        />
        <Button type="submit" variant="contained" disabled={!newContent.trim() || submitting} sx={styles.submitBtn}>
          {submitting ? <CircularProgress size={20} /> : 'Add comment'}
        </Button>
      </Box>

      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}

      <Box sx={styles.listWrap}>
        <InfiniteScroll
          onYEnd={handleLoadMore}
          isLoading={isLoading}
          showLoader={hasMore}
          sx={styles.scrollSx}
        >
          {results.length === 0 && !isLoading ? (
            <Typography variant="body2" color="text.secondary">
              No comments yet. Be the first to comment.
            </Typography>
          ) : (
            results.map((comment) => <CommentItem key={comment.id} comment={comment} />)
          )}
        </InfiniteScroll>
      </Box>
    </Box>
  )
}
