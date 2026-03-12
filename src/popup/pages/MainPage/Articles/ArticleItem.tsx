import React from 'react'
import { Article } from '@/services/articlesApi'
import { Box, IconButton, Link, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import PushPinIcon from '@mui/icons-material/PushPin';


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
  actions: {
    display: 'flex',
    flexDirection: 'row',
    gap: 1,
  },
}

export default function ArticleItem({ article }: { article: Article }) {
  return (
    <Box sx={styles.root}>
      <Box sx={styles.header}>
        <Typography variant="h6" sx={{ wordBreak: 'break-all' }}>{article.title}</Typography>

        <Box sx={styles.actions}>
          <IconButton>
            <EditIcon />
          </IconButton>
          <IconButton>
            <PushPinIcon />
          </IconButton>
        </Box>
      </Box>
      <Typography variant="body1" sx={{ wordBreak: 'break-all' }}> <Link href={article.url} target="_blank">Link</Link></Typography>
    </Box>
  )
}