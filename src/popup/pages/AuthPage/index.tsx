import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from '@mui/material'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/popup/services/authApi'
import { styles } from './styles'

type TabValue = 'login' | 'register'

// Login form schema
const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

// Registration form schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type RegisterFormData = z.infer<typeof registerSchema>

const AuthPage = () => {
  const [tab, setTab] = useState<TabValue>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Login form
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isValid: isLoginValid, isDirty: isLoginDirty ,},
    reset: resetLogin,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur', // Validate only on blur
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Registration form
  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors, isValid: isRegisterValid, isDirty: isRegisterDirty },
    reset: resetRegister,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur', // Validate only on blur
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  })

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
    setTab(newValue)
    setError(null)
    setSuccess(null)
    // Reset forms when switching tabs
    resetLogin()
    resetRegister()
  }

  const onLogin = async (data: LoginFormData) => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const response = await authApi.login(data)
      // Store tokens
      await chrome.storage.local.set({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user,
      })
      setSuccess('Login successful!')
      resetLogin()
      // The App component will automatically show MainPage when auth state updates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const onRegister = async (data: RegisterFormData) => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const response = await authApi.register(data)
      // Store tokens
      await chrome.storage.local.set({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user,
      })
      setSuccess('Registration successful!')
      resetRegister()
      // The App component will automatically show MainPage when auth state updates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={styles.root}>
      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent>
          <Typography variant="h5" component="h1" gutterBottom align="center">
            Wiki Pin
          </Typography>

          <Tabs value={tab} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 3 }}>
            <Tab label="Login" value="login" />
            <Tab label="Register" value="register" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {tab === 'login' ? (
            <Box
              component="form"
              id="login-form"
              onSubmit={handleLoginSubmit(onLogin)}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <TextField
                label="Email"
                type="email"
                {...registerLogin('email')}
                error={!!loginErrors.email}
                helperText={loginErrors.email?.message}
                fullWidth
                disabled={loading}
              />

              <TextField
                label="Password"
                type="password"
                {...registerLogin('password')}
                error={!!loginErrors.password}
                helperText={loginErrors.password?.message}
                fullWidth
                disabled={loading}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={!isLoginValid || !isLoginDirty || loading}
                fullWidth
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Login'}
              </Button>
            </Box>
          ) : (
            <Box
              component="form"
              id="register-form"
              onSubmit={handleRegisterSubmit(onRegister)}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <TextField
                label="Name"
                {...registerRegister('name')}
                error={!!registerErrors.name}
                helperText={registerErrors.name?.message}
                fullWidth
                disabled={loading}
              />

              <TextField
                label="Email"
                type="email"
                {...registerRegister('email')}
                error={!!registerErrors.email}
                helperText={registerErrors.email?.message}
                fullWidth
                disabled={loading}
              />

              <TextField
                label="Password"
                type="password"
                {...registerRegister('password')}
                error={!!registerErrors.password}
                helperText={registerErrors.password?.message}
                fullWidth
                disabled={loading}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={!isRegisterValid || !isRegisterDirty || loading}
                fullWidth
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Register'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default AuthPage
