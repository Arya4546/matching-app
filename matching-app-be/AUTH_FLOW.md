# Authentication Flow Documentation

## Overview
This backend implements a two-step SMS-based authentication system with JWT tokens and refresh tokens for session persistence.

## Frontend Implementation Guide

### 1. Token Storage
Store tokens in localStorage or sessionStorage:
```javascript
// After successful registration/login verification
localStorage.setItem('accessToken', response.token);
localStorage.setItem('refreshToken', response.refreshToken);
```

### 2. Registration Flow
```javascript
// Step 1: Register user
POST /api/auth/register
{
  "name": "User Name",
  "phoneNumber": "+1234567890",
  "gender": "male",
  "address": "User Address"
}

// Response
{
  "message": "Verification code sent to your phone",
  "userId": "xxx",
  "phoneNumber": "+1234567890",
  "isNewUser": true,
  "requiresVerification": true
}

// Step 2: Verify SMS
POST /api/auth/verify-sms
{
  "userId": "xxx",
  "code": "123456"
}

// Response
{
  "message": "Phone number verified successfully",
  "token": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "isRegistrationComplete": true,
  "user": {...}
}

// Store tokens and redirect to main app
```

### 3. Login Flow
```javascript
// Step 1: Login
POST /api/auth/login
{
  "phoneNumber": "+1234567890"
}

// Response
{
  "message": "Verification code sent to your phone",
  "userId": "xxx",
  "phoneNumber": "+1234567890",
  "isNewUser": false,
  "requiresVerification": true
}

// Step 2: Verify login
POST /api/auth/verify-login
{
  "userId": "xxx",
  "code": "123456"
}

// Response
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "isLoginComplete": true,
  "user": {...}
}
```

### 4. Page Refresh / Session Validation

**IMPORTANT:** On app initialization (e.g., App.js or main component), check for existing session:

```javascript
// On app mount or page refresh
const initializeAuth = async () => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    // No token, redirect to login
    redirectToLogin();
    return;
  }

  try {
    // Validate current session
    const response = await fetch('/api/auth/validate', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.isAuthenticated) {
      // User is authenticated, stay on current page
      setUser(data.user);
      setIsAuthenticated(true);
    } else {
      // Token invalid, try refresh token
      await refreshAccessToken();
    }
  } catch (error) {
    // Error validating, try refresh token
    await refreshAccessToken();
  }
};
```

### 5. Refresh Token Flow
```javascript
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('accessToken', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      setUser(data.user);
      setIsAuthenticated(true);
    } else {
      // Refresh token invalid, redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      redirectToLogin();
    }
  } catch (error) {
    redirectToLogin();
  }
};
```

### 6. Auto-attach Token to Requests
```javascript
// Axios interceptor example
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      await refreshAccessToken();
      return axios(error.config);
    }
    return Promise.reject(error);
  }
);
```

### 7. Logout
```javascript
const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  redirectToLogin();
};
```

## Available Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-sms` - Verify SMS for registration
- `POST /api/auth/login` - Login existing user
- `POST /api/auth/verify-login` - Verify SMS for login
- `GET /api/auth/validate` - Validate current session
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/refresh` - Refresh access token

## Key Points for Frontend

1. **Always check session on app initialization** to handle F5/refresh
2. **Store both access and refresh tokens** in localStorage
3. **Use the `/api/auth/validate` endpoint** on app mount to verify session
4. **Implement token refresh logic** for expired tokens
5. **Don't redirect to login immediately** - first try to validate/refresh session

## Flow Diagram

```
User Signs Up → SMS Verification → Store Tokens → Main App
     ↓
User Refreshes Page (F5)
     ↓
Check localStorage for token
     ↓
Token exists? → Validate with /api/auth/validate
     ↓
Valid? → Stay on current page : Try refresh token
     ↓
Refresh successful? → Stay logged in : Redirect to login
```

This ensures users stay logged in even after refreshing the page.