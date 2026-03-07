# Router System

A scalable, state-based routing system for Chrome extension popups.

## Features

- ✅ State-based routing (no URLs needed for popups)
- ✅ Route guards (authentication protection)
- ✅ Automatic redirects based on auth state
- ✅ Navigation history support
- ✅ Easy to add new routes
- ✅ Type-safe route names

## Usage

### Adding a New Route

1. Create your page component in `src/popup/pages/YourPage/index.tsx`
2. Add the route to `routes.tsx`:

```typescript
import YourPage from '../pages/YourPage'

export const routes: Route[] = [
  // ... existing routes
  {
    name: 'your-page',
    path: '/your-page',
    component: YourPage,
    requiresAuth: true, // or false
    redirectIfAuthenticated: false, // optional
    meta: { title: 'Your Page' }, // optional metadata
  },
]
```

3. Update the `RouteName` type in `types.ts`:

```typescript
export type RouteName = 'auth' | 'main' | 'your-page' | string
```

### Navigation

Use the `useRouter` hook in any component:

```typescript
import { useRouter } from '@/popup/router'

const MyComponent = () => {
  const { navigate, goBack, currentRoute } = useRouter()

  const handleClick = () => {
    navigate('your-page')
  }

  return (
    <button onClick={handleClick}>
      Go to Your Page
    </button>
  )
}
```

### Route Guards

- `requiresAuth: true` - Only accessible when authenticated
- `redirectIfAuthenticated: true` - Redirects to main page if user is authenticated (useful for auth pages)

## Example: Adding a Settings Page

```typescript
// 1. Create src/popup/pages/SettingsPage/index.tsx
const SettingsPage = () => {
  const { navigate } = useRouter()
  
  return (
    <div>
      <h1>Settings</h1>
      <button onClick={() => navigate('main')}>Back</button>
    </div>
  )
}

// 2. Add to routes.tsx
{
  name: 'settings',
  path: '/settings',
  component: SettingsPage,
  requiresAuth: true,
}

// 3. Update types.ts
export type RouteName = 'auth' | 'main' | 'settings' | string
```

