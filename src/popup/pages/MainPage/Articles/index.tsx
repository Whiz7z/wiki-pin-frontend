import { Box, Button, CircularProgress, Divider, Stack, Typography } from '@mui/material'
import React, { useEffect } from 'react'
import ArticleItem from './ArticleItem'
import { styles } from './styles'
import { useArticlesStore, useAuthStore } from '@/stores'
import { useRouter } from '@/popup/router'
import InfiniteScroll from '@/popup/components/InfiniteScroll'

const Articles = ({ type }: { type: 'my-articles' | 'all-articles' }) => {
  const { user } = useAuthStore()
  const {
    isLoading,
    error,
    fetchByUser,
    fetchAll,
    fetchNextPage,
    getArticles,
    getNextUrl,
  } = useArticlesStore()
  const { navigate } = useRouter()
  const articles = getArticles()
  const hasNextUrl = getNextUrl()

  const handleYEnd = () => {
    if (hasNextUrl && !isLoading) {
      fetchNextPage(hasNextUrl)
    }
  } 

  useEffect(() => {
    if (type === 'my-articles') {
      if (user?.id != null) {
        fetchByUser(user.id)
      }
    } else {
      fetchAll()
    }
  }, [type, user?.id])

  return (
    <Box sx={styles.root}>
      <Button variant="contained" color="primary" fullWidth onClick={() => { navigate('create-article') }}>
        Create Article
      </Button>

      <Divider sx={{ backgroundColor: 'primary.light', my: 1, height: '4px', width: '100%' }} />

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" sx={{ py: 2 }}>
          {error}
        </Typography>
      ) : type === 'my-articles' && !user ? (
        <Typography color="text.secondary" sx={{ py: 2 }}>
          Log in to see your articles.
        </Typography>
      ) : (
        <InfiniteScroll
          onYEnd={handleYEnd}
          isLoading={isLoading}
          showLoader={!!hasNextUrl}
          sx={styles.articleList}
        >
          {articles.length === 0 ? (
            <Typography color="text.secondary">
              {type === 'my-articles' ? 'No articles yet. Create one or pin from a page.' : 'No articles found.'}
            </Typography>
          ) : (
            articles.map((article) => (
              <ArticleItem
                key={article.id}
                article={article}
                isOwnArticle={type === 'my-articles' || article.users?.some((ua) => ua.user?.id === user?.id)}
              />
            ))
          )}
        </InfiniteScroll>
      )}
    </Box>
  )
}

export default Articles