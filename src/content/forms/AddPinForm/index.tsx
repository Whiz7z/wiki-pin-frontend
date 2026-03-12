import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Box, Button, TextField } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'
import { articlesApi } from '@/services/articlesApi'
import { getCurrentArticle } from '@/utils/tabUtils'
import { CreatePinRequest, pinsApi } from '@/services/pinsApi'
import { StyledTextField } from '@/theme/components/StyledTextField'

const STORAGE_URL_KEY = 'wiki-pin-selected-url'
const STORAGE_ELEMENT_KEY = 'wiki-pin-selected-element'

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
}

const addPinSchema = z.object({
  content: z.string().min(1, 'Content is required'),
})

type AddPinFormData = z.infer<typeof addPinSchema>

const AddPinForm = () => {
  const [isArticleExists, setIsArticleExists] = useState(false)
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<AddPinFormData>({
    resolver: zodResolver(addPinSchema),
    mode: 'onBlur',
    defaultValues: {
      content: '',
    },
  })

  const onSubmit = async (data: AddPinFormData) => {
    const urlItem = localStorage.getItem(STORAGE_URL_KEY)
    const selectorItem = localStorage.getItem(STORAGE_ELEMENT_KEY)

    const url = new URL(urlItem || '')
    const articleUrl = url.origin + url.pathname



    const article = await articlesApi.getByUrl(articleUrl)
    console.log('article', article)

    const pinData = {
      content: data.content,
      selector: selectorItem || '',
      articleId: article.id || '',
    }

    const pin = await pinsApi.create(pinData)
    console.log('pin', pin)
  }

  useEffect(() => {
    const checkArticleExists = async () => {
      const urlItem = localStorage.getItem(STORAGE_URL_KEY)
      const articleUrl = new URL(urlItem || '').origin + new URL(urlItem || '').pathname
      const article = await articlesApi.getByUrl(articleUrl)
      
      setIsArticleExists(!!article)
    }
    checkArticleExists()
  }, [])

  return (
    <Box sx={styles.root} component="form" id="add-pin-form" onSubmit={handleSubmit(onSubmit)}>
      <StyledTextField
        label="Content"
        multiline
        rows={4}
        {...register('content')}
        error={!!errors.content}
        helperText={errors.content?.message}
      />
      {!isArticleExists && (
        <Alert severity="error" >Add article first</Alert>
      )}
      <Button type="submit" variant="contained" color="primary" disabled={!isArticleExists}>Add Pin</Button>
    </Box>
  )
}

export default AddPinForm