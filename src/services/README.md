# API Services and Zustand Stores

This directory contains all API services and Zustand stores for managing application state.

## Services

All services are located in `src/services/`:

- **api.ts** - Shared API utility with authentication token handling
- **authApi.ts** - Authentication endpoints (login, register, logout, refresh)
- **articlesApi.ts** - Article CRUD operations and user associations
- **pinsApi.ts** - Pin CRUD operations
- **commentsApi.ts** - Comment CRUD operations with nested replies
- **usersApi.ts** - User operations

## Stores

All Zustand stores are located in `src/stores/`:

- **authStore.ts** - Authentication state management
- **articlesStore.ts** - Articles state management
- **pinsStore.ts** - Pins state management
- **commentsStore.ts** - Comments state management
- **index.ts** - Central export point for all stores

## Usage Examples

### Authentication

```typescript
import { useAuthStore } from '../stores'

function LoginComponent() {
  const { login, user, isAuthenticated, isLoading, error } = useAuthStore()

  const handleLogin = async () => {
    try {
      await login({ email: 'user@example.com', password: 'password' })
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  // Load auth state on mount
  useEffect(() => {
    useAuthStore.getState().loadFromStorage()
    useAuthStore.getState().checkAuth()
  }, [])

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.name}!</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  )
}
```

### Articles

```typescript
import { useArticlesStore } from '../stores'

function ArticlesComponent() {
  const { articles, fetchAll, create, isLoading } = useArticlesStore()

  useEffect(() => {
    fetchAll({ limit: 10 })
  }, [])

  const handleCreate = async () => {
    try {
      await create({
        url: 'https://en.wikipedia.org/wiki/Example',
        title: 'Example Article',
        language: 'en'
      })
    } catch (err) {
      console.error('Failed to create article:', err)
    }
  }

  return (
    <div>
      {isLoading ? <p>Loading...</p> : (
        <ul>
          {articles.map(article => (
            <li key={article.id}>{article.title}</li>
          ))}
        </ul>
      )}
      <button onClick={handleCreate}>Create Article</button>
    </div>
  )
}
```

### Pins

```typescript
import { usePinsStore } from '../stores'

function PinsComponent({ articleId }: { articleId: string }) {
  const { pins, fetchAll, create, isLoading } = usePinsStore()

  useEffect(() => {
    fetchAll({ articleId, status: 'active' })
  }, [articleId])

  const handleCreatePin = async () => {
    try {
      await create({
        content: 'This is interesting!',
        selector: '#content > p',
        position: { x: 100, y: 200 },
        articleId
      })
    } catch (err) {
      console.error('Failed to create pin:', err)
    }
  }

  return (
    <div>
      {pins.map(pin => (
        <div key={pin.id}>{pin.content}</div>
      ))}
      <button onClick={handleCreatePin}>Add Pin</button>
    </div>
  )
}
```

### Comments

```typescript
import { useCommentsStore } from '../stores'

function CommentsComponent({ pinId }: { pinId: string }) {
  const { comments, fetchByPin, create, isLoading } = useCommentsStore()

  useEffect(() => {
    fetchByPin(pinId)
  }, [pinId])

  const handleCreateComment = async () => {
    try {
      await create({
        content: 'Great point!',
        pinId
      })
    } catch (err) {
      console.error('Failed to create comment:', err)
    }
  }

  const handleReply = async (parentId: string) => {
    try {
      await create({
        content: 'I agree!',
        pinId,
        parentId
      })
    } catch (err) {
      console.error('Failed to reply:', err)
    }
  }

  return (
    <div>
      {comments.map(comment => (
        <div key={comment.id}>
          <p>{comment.content}</p>
          {comment.replies?.map(reply => (
            <div key={reply.id} style={{ marginLeft: '20px' }}>
              {reply.content}
            </div>
          ))}
          <button onClick={() => handleReply(comment.id)}>Reply</button>
        </div>
      ))}
      <button onClick={handleCreateComment}>Add Comment</button>
    </div>
  )
}
```

## Direct API Usage

You can also use the API services directly without Zustand:

```typescript
import { articlesApi } from '../services/articlesApi'

// Direct API call
const articles = await articlesApi.getAll({ limit: 10 })
const article = await articlesApi.getByUrl('https://en.wikipedia.org/wiki/Example')
```

## Chrome Extension Compatibility

All services and stores are designed to work in both:
- **Popup context** - React components in the extension popup
- **Content script context** - Scripts injected into web pages

The authentication tokens are stored in `chrome.storage.local` and automatically included in API requests.

