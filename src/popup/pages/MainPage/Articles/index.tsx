import { Box } from '@mui/material'
import React, { useEffect, useState, useRef } from 'react'
import ArticleItem from './ArticleItem'
import { styles } from './styles'
import { Article, articlesApi } from '@/services/articlesApi'
import { useArticlesStore, useAuthStore } from '@/stores'

const Articles = () => {
  const { user } = useAuthStore()
  const { articles, isLoading, error, fetchByUser } = useArticlesStore()

  useEffect(() => {
    if (user) {
      fetchByUser(user.id)
    }
  }, [user, fetchByUser])

  return (
    <Box sx={styles.root}>
      {articles.map((article) => (
        <ArticleItem key={article.id} article={article} />
      ))}
    </Box>
  )
}

export default Articles