# Authentication Setup Guide

## Overview

This document explains how to connect and use the authentication APIs in the FinBot frontend application.

## Files Created/Modified

### 1. Authentication API (`src/api/AuthApi.ts`)

- Handles sign in, sign up, and password reset API calls
- Currently uses mock responses for testing
- Includes token management utilities
- Switch `USE_MOCK_RESPONSES` to `false` when backend is ready

### 2. Authentication Context (`src/context/AuthProvider.tsx`)

- Manages global authentication state
- Provides sign in, sign up, and sign out functions
- Handles token persistence in localStorage
- Auto-redirects authenticated users

### 3. Protected Route Component (`src/components/ProtectedRoute.tsx`)

- Wraps protected pages to require authentication
- Redirects unauthenticated users to sign in page
- Shows loading state while checking authentication

### 4. Updated SignIn Page (`src/app/Signin/page.tsx`)

- Integrated with authentication API and context
- Real form validation and error handling
- Success/error messaging
- Auto-redirect after successful authentication

### 5. Updated Chat Page (`src/app/Chat/page.tsx`)

- Wrapped with ProtectedRoute component
- Includes AuthProvider in context hierarchy

### 6. Updated Navbar (`src/components/Navbar.tsx`)

- Displays current user information
- User dropdown menu with sign out functionality
- Responsive design for mobile/desktop

## How Authentication Works

### Sign In Flow

1. User enters email/password on `/Signin` page
2. Form calls `signIn()` from AuthProvider
3. AuthProvider calls `authApi.signIn()`
4. On success: user data stored in localStorage, redirected to `/Chat`
5. On error: error message displayed to user

### Sign Up Flow

1. User toggles to sign up mode and enters name/email/password
2. Form calls `signUp()` from AuthProvider
3. AuthProvider calls `authApi.signUp()`
4. On success: user automatically signed in and redirected to `/Chat`
5. On error: error message displayed to user

### Protected Routes

1. User tries to access `/Chat` page
2. ProtectedRoute component checks authentication status
3. If authenticated: renders page content
4. If not authenticated: redirects to `/Signin`

### Token Management

- JWT tokens stored in localStorage
- User data cached in localStorage
- Automatic token retrieval on app reload
- Token cleared on sign out

## Demo Credentials

For testing with mock API:

- **Email**: john@example.com
- **Password**: password123

## Integration with Backend

### When Backend is Ready:

1. Update `API_BASE_URL` in `AuthApi.ts`
2. Set `USE_MOCK_RESPONSES = false` in `AuthApi.ts`
3. Ensure backend endpoints match:
   - `POST /api/auth/signin`
   - `POST /api/auth/signup`
   - `POST /api/auth/reset-password`

### Expected API Responses:

#### Sign In/Sign Up Success:

```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "token": "jwt_token_here"
  }
}
```

#### Error Response:

```json
{
  "success": false,
  "error": "Error message here"
}
```

### Backend Authentication Requirements:

- JWT token-based authentication
- Include user data in sign in/sign up responses
- CORS enabled for frontend domain
- Secure password hashing
- Email validation for password reset

## Security Features

- Client-side token storage (localStorage)
- Automatic token cleanup on sign out
- Protected route enforcement
- Form validation and error handling
- Password reset functionality

## Usage in Components

### Check Authentication Status:

```tsx
import { useAuth } from "@/context/AuthProvider";

const MyComponent = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in</div>;

  return <div>Welcome, {user.name}!</div>;
};
```

### Sign Out:

```tsx
import { useAuth } from "@/context/AuthProvider";

const MyComponent = () => {
  const { signOut } = useAuth();

  return <button onClick={signOut}>Sign Out</button>;
};
```

### Protect a Page:

```tsx
import ProtectedRoute from "@/components/ProtectedRoute";

const MyPage = () => {
  return (
    <ProtectedRoute>
      <div>This content requires authentication</div>
    </ProtectedRoute>
  );
};
```

## Next Steps

1. Replace mock API with real backend endpoints
2. Add email verification for sign up
3. Implement "Remember Me" functionality
4. Add password strength validation
5. Implement refresh token logic
6. Add user profile management
7. Add social authentication (Google, GitHub, etc.)

## Troubleshooting

- If authentication state is lost on refresh, check localStorage in browser dev tools
- If redirects aren't working, ensure Next.js router is properly configured
- For CORS issues, verify backend allows requests from frontend domain
- Check browser console for detailed error messages
