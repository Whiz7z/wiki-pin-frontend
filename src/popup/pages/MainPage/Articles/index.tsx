import { Box } from '@mui/material'
import React, { useEffect, useState, useRef } from 'react'
import ArticleItem from './ArticleItem'
import { styles } from './styles'
import { Article, articlesApi } from '@/services/articlesApi'

const Articles = () => {
  const [articles, setArticles] = useState<Article[]>([])
  const isFetchingRef = useRef(false)

  const fetchArticles = async () => {
    // Set flag immediately to prevent concurrent fetches
    isFetchingRef.current = true

    try {
      const articlesData = await articlesApi.getArticles()
      setArticles(articlesData)
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      // Reset flag after fetch completes
      isFetchingRef.current = false
    }
  }

  useEffect(() => {
    // Prevent duplicate fetches during the same mount cycle
    if (isFetchingRef.current) {
      console.log('fetchArticles already fetching')
      return
    }
    console.log('fetchArticles')

    fetchArticles()
  }, [isFetchingRef])

  return (
    <Box sx={styles.root}>
      <ArticleItem />
    </Box>
  )
}

export default Articles