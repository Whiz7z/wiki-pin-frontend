import React from 'react'
import { Article } from '@/services/articlesApi'

export default function ArticleItem({ article }: { article: Article }) {
  return (
    <div>
      <h3>{article.title}</h3>
      <p>{article.url}</p>
    </div>
  )
}