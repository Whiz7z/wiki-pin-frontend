import { Box, Button, Divider, Stack } from '@mui/material'
import React, { useEffect, useState, useRef } from 'react'
import ArticleItem from './ArticleItem'
import { styles } from './styles'
import { Article, articlesApi } from '@/services/articlesApi'
import { useArticlesStore, useAuthStore } from '@/stores'
import { useRouter } from '@/popup/router'
import { getCurrentTab } from '@/utils/tabUtils'

const Articles = () => {
  const { user } = useAuthStore()
  const { isLoading, error, fetchByUser, isArticlesInitialized, getArticles } = useArticlesStore()
  const { navigate } = useRouter()

  const articles = getArticles()


  useEffect(() => {
    if (!isArticlesInitialized) {
      fetchByUser(user?.id || null)
    }
  }, [user, isArticlesInitialized])

  return (
    <Box sx={styles.root}>

      <Button variant="contained" color="primary" fullWidth onClick={() => { navigate('create-article') }}>Create Article</Button>



      <Divider sx={{ backgroundColor: 'primary.light', my: 1, height: '4px', width: '100%' }} />
      <Stack spacing={2}>
        {articles.map((article) => (
          <ArticleItem key={article.id} article={article} />
        ))}
      </Stack>
    </Box>
  )
}

export default Articles