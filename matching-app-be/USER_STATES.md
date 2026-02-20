# User Registration States and Login Notifications

## Overview
The login system now provides specific notifications based on the user's registration status when they attempt to log in.

## User Registration States

### 1. **Unregistered User** (Not in database)
- **Status**: `USER_NOT_REGISTERED`
- **HTTP Status**: `404 Not Found`
- **Notification**: "この電話番号は登録されていません。まず新規登録を行ってください。"
- **English**: "This phone number is not registered. Please register first."
- **Action**: User should be redirected to registration page

### 2. **Registered but Not Verified** (In database, SMS not verified)
- **Status**: `SMS_NOT_VERIFIED`
- **HTTP Status**: `400 Bad Request`
- **Notification**: "この電話番号は登録されていますが、SMS認証が完了していません。"
- **English**: "This phone number is registered but SMS verification is not complete."
- **Action**: User should complete SMS verification

### 3. **Fully Registered and Verified**
- **Status**: Normal login flow proceeds
- **HTTP Status**: `200 OK`
- **Action**: Send SMS verification code for login

## API Response Examples

### Unregistered User Login Attempt
```json
POST /api/auth/login
{
  "phoneNumber": "+1234567890"
}

Response (404):
{
  "error": "この電話番号は登録されていません。まず新規登録を行ってください。",
  "errorCode": "USER_NOT_REGISTERED",
  "suggestion": "新規登録ページから登録を完了してください",
  "redirectTo": "register"
}
```

### Registered but Unverified User Login Attempt
```json
POST /api/auth/login
{
  "phoneNumber": "+1234567890"
}

Response (400):
{
  "error": "この電話番号は登録されていますが、SMS認証が完了していません。",
  "errorCode": "SMS_NOT_VERIFIED",
  "suggestion": "SMS認証を完了してからログインしてください",
  "userId": "507f1f77bcf86cd799439011",
  "redirectTo": "verify-sms"
}
```

### Successful Login (Verified User)
```json
POST /api/auth/login
{
  "phoneNumber": "+1234567890"
}

Response (200):
{
  "message": "認証コードをお使いの電話に送信しました",
  "userId": "507f1f77bcf86cd799439011",
  "phoneNumber": "+1234567890",
  "isNewUser": false,
  "requiresVerification": true
}
```

## Frontend Implementation Guide

### Handle Login Response
```javascript
const handleLogin = async (phoneNumber) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber })
    });

    const data = await response.json();

    if (response.status === 404 && data.errorCode === 'USER_NOT_REGISTERED') {
      // Show notification: User not registered
      showNotification(data.error, 'error');
      // Redirect to registration page
      redirectTo('/register');
      return;
    }

    if (response.status === 400 && data.errorCode === 'SMS_NOT_VERIFIED') {
      // Show notification: Need to complete SMS verification
      showNotification(data.error, 'warning');
      // Redirect to SMS verification with userId
      redirectTo(`/verify-sms?userId=${data.userId}`);
      return;
    }

    if (response.ok) {
      // Normal login flow - show SMS verification screen
      showNotification(data.message, 'success');
      redirectTo(`/verify-login?userId=${data.userId}`);
      return;
    }

    // Handle other errors
    showNotification(data.error || 'Login failed', 'error');

  } catch (error) {
    showNotification('Network error. Please try again.', 'error');
  }
};
```

### Notification Display Function
```javascript
const showNotification = (message, type) => {
  // Type can be: 'error', 'warning', 'success', 'info'
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;

  // Add to notification container
  document.getElementById('notifications').appendChild(notification);

  // Auto-hide after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);
};
```

## Console Logging for Debugging

When an unregistered user attempts login, you'll see:
```
🚫 Login attempt for unregistered phone: +1234***7890
```

When a registered but unverified user attempts login:
```
🚫 Login attempt for unverified user: +1234***7890
```

## Debug Endpoints (Development Only)

### Check User Registration Status
```json
POST /api/debug/check-user
{
  "phoneNumber": "+1234567890"
}

Response Examples:

// Unregistered user
{
  "exists": false,
  "status": "NOT_REGISTERED",
  "message": "User does not exist in database",
  "action": "User needs to register first"
}

// Registered but unverified user
{
  "exists": true,
  "status": "PENDING_SMS_VERIFICATION",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "phoneNumber": "+1234567890",
    "smsVerified": false,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "action": "Needs to complete SMS verification"
}

// Fully registered user
{
  "exists": true,
  "status": "FULLY_REGISTERED",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "phoneNumber": "+1234567890",
    "smsVerified": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "action": "Can login normally"
}
```

## Error Response Structure

All auth error responses now include:
- **error**: Human-readable error message (Japanese)
- **errorCode**: Machine-readable error identifier
- **suggestion**: Helpful suggestion for the user
- **redirectTo**: Suggested page to redirect to
- **userId**: (when applicable) User ID for verification flows

This structured approach allows the frontend to handle different user states appropriately and provide clear guidance to users.