import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useArticlesStore } from '@/stores'
import { useRouter } from '@/popup/router'
import { styles } from './styles'
import { getCurrentArticle, getCurrentTab } from '@/utils/tabUtils'
import { StyledTextField } from '@/theme/components/StyledTextField'

const createArticleSchema = z.object({
  url: z.string().min(1, 'URL is required'),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  language: z.string().max(20, 'Language must be 20 characters or less').optional(),
})

type CreateArticleFormData = z.infer<typeof createArticleSchema>

const CreateArticlePage = () => {
  const [success, setSuccess] = useState<string | null>(null)
  const { create, isLoading, error, clearError } = useArticlesStore()
  const { navigate } = useRouter()


  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<CreateArticleFormData>({
    resolver: zodResolver(createArticleSchema),
    mode: 'all',
    defaultValues: {
      url: '',
      title: '',
      language: '',
    },
  })

  const addCurrentArticle = async () => {
    const tab: chrome.tabs.Tab | undefined = await getCurrentTab()
    const articleUrl = await getCurrentArticle(tab?.url || '')
    setValue('url', articleUrl || '', { shouldTouch: true })

  }


  useEffect(() => {
    return () => {
      clearError()
    }
  }, [clearError])

  const onSubmit = async (data: CreateArticleFormData) => {
    setSuccess(null)
    clearError()

    try {
      await create({
        url: data.url.trim(),
        title: data.title.trim(),
        language: data.language?.trim() || undefined,
      })
      setSuccess('Article created successfully!')
      reset()
      setTimeout(() => {
        navigate('main')
      }, 700)
    } catch (err) {
      setSuccess(null)
    }
  }

  return (
    <Box sx={styles.root}>
      <Card>
        <CardHeader title="Create Article" action={<Button type="button" variant="contained" color='success' onClick={() => addCurrentArticle()}>Set current article</Button>} />
        <CardContent>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => clearError()}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
              <StyledTextField
                label="Article URL"
                {...register('url', { required: true })}
                slotProps={{ inputLabel: { shrink: !!watch('url') } }}
                error={!!errors.url}
                helperText={errors.url?.message}
                fullWidth
                disabled={isLoading}
              />

            <StyledTextField
              label="Title"
              {...register('title')}
              error={!!errors.title}
              helperText={errors.title?.message}
              fullWidth
              disabled={isLoading}
            />

            <StyledTextField
              label="Language (optional)"
              {...register('language')}
              error={!!errors.language}
              helperText={errors.language?.message}
              fullWidth
              disabled={isLoading}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={!isValid || !isDirty || isLoading}
              sx={{ mt: 1 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Create'}
            </Button>

            <Button
              type="button"
              variant="text"
              fullWidth
              disabled={isLoading}
              onClick={() => navigate('articles')}
            >
              Back
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default CreateArticlePage