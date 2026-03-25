import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Box, Button } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'
import {
  findElementByXPath,
  getElementDocumentYOffset,
  STORAGE_ANCHOR_TEXT_KEY,
  STORAGE_KEY,
  STORAGE_URL_KEY,
} from '@/content/views/components/SelectMode/SelectMode'
import { articlesApi } from '@/services/articlesApi'
import { CreatePinRequest, pinsApi, type PinApiError } from '@/services/pinsApi'
import { useAuthStore, usePinsStore } from '@/stores'
import { StyledTextField } from '@/theme/components/StyledTextField'

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
}

const addPinSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
})

type AddPinFormData = z.infer<typeof addPinSchema>

const AddPinForm = () => {
  const { user } = useAuthStore()
  const isLoggedIn = !!user
  const [isArticleExists, setIsArticleExists] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { create, triggerPinsRefresh, clearError } = usePinsStore()
  const { register, handleSubmit, formState: { errors, isLoading }, setError, reset } = useForm<AddPinFormData>({
    resolver: zodResolver(addPinSchema),
    mode: 'onBlur',
    defaultValues: {
      title: '',
      content: '',
    },
  })

  const onSubmit = async (data: AddPinFormData) => {
    setSuccessMessage(null)
    setSubmitError(null)
    clearError()
    const urlItem = localStorage.getItem(STORAGE_URL_KEY)
    const selectorItem = localStorage.getItem(STORAGE_KEY)
    const rawAnchor = localStorage.getItem(STORAGE_ANCHOR_TEXT_KEY)
    const anchorText = rawAnchor?.trim()
    const url = new URL(urlItem || '')
    const articleUrl = url.origin + url.pathname

    try {
      const article = await articlesApi.getByUrl(articleUrl)
      const anchorEl = selectorItem ? findElementByXPath(selectorItem) : null
      const yOffset = anchorEl ? getElementDocumentYOffset(anchorEl) : undefined
      const pinData: CreatePinRequest = {
        title: data.title,
        content: data.content,
        selector: selectorItem || '',
        articleId: article.id || '',
        ...(anchorText ? { anchorText } : {}),
        ...(yOffset !== undefined ? { yOffset } : {}),
      }
      await create(pinData)
      reset()
      setSuccessMessage('Pin created successfully.')
      triggerPinsRefresh()
    } catch (err) {
      const e = err as PinApiError | undefined
      if (e?.fieldErrors && typeof e.fieldErrors === 'object') {
        const formFields = ['title', 'content'] as const
        formFields.forEach((field) => {
          const message = e.fieldErrors![field]
          if (message) setError(field, { type: 'server', message })
        })
        const otherMessages = Object.entries(e.fieldErrors)
          .filter(([key]) => !formFields.includes(key as any))
          .map(([, msg]) => msg)
        if (otherMessages.length > 0) setSubmitError(otherMessages.join(' '))
      } else {
        setSubmitError(e?.message ?? 'Failed to create pin')
      }
    }
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
      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ mb: 1 }}>
          {successMessage}
        </Alert>
      )}
      {submitError && (
        <Alert severity="error" onClose={() => setSubmitError(null)} sx={{ mb: 1 }}>
          {submitError}
        </Alert>
      )}
      <StyledTextField
        label="Title"
        {...register('title')}
        error={!!errors.title}
        helperText={errors.title?.message}
      />
      <StyledTextField
        label="Content"
        multiline
        rows={4}
        {...register('content')}
        error={!!errors.content}
        helperText={errors.content?.message}
      />
      {!isArticleExists && (
        <Alert severity="error">Add article first</Alert>
      )}
      {!isLoggedIn && (
        <Alert severity="error">Login to add a pin</Alert>
      )}
      <Button type="submit" variant="contained" color="primary" disabled={!isArticleExists || !isLoggedIn || isLoading}>
        Add Pin
      </Button>
    </Box>
  )
}

export default AddPinForm