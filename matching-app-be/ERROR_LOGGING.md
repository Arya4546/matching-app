# Enhanced Error Logging Documentation

## Overview
The MatchApp backend now includes comprehensive error logging that displays detailed information in the command window when errors occur during project execution.

## Error Logging Features

### 1. **Centralized Error Handler**
- **File**: `middleware/errorHandler.js`
- **Purpose**: Catches all uncaught errors and displays detailed information
- **Features**:
  - 🚨 Colored error headers for easy identification
  - ⏰ Timestamp of when error occurred
  - 🌐 Request details (method, URL, IP, User-Agent)
  - 👤 User information (if authenticated)
  - 📝 Request body (with sensitive data hidden)
  - 📚 Complete stack trace
  - 🔍 Special handling for MongoDB/Mongoose errors

### 2. **HTTP Request Logging**
- **Tool**: Morgan middleware with custom formatting
- **Features**:
  - Color-coded HTTP status codes:
    - 🟢 Green: 2xx Success
    - 🟡 Yellow: 3xx Redirection
    - 🔴 Red: 4xx Client Error
    - 🟣 Purple: 5xx Server Error
  - Response time tracking
  - Request size monitoring

### 3. **Database Connection Logging**
- **File**: `config/database.js`
- **Features**:
  - 💾 Connection success details
  - 💥 Connection failure with troubleshooting tips
  - 🔌 Real-time connection status events
  - ⚠️ Disconnection/reconnection alerts

### 4. **Socket.IO Error Logging**
- **File**: `services/socketHandler.js`
- **Features**:
  - 🔒 Authentication errors with user/socket details
  - 📍 Location update failures
  - 🟢 User connection logs
  - 🔴 User disconnection logs
  - ⚡ Real-time socket errors

### 5. **Application Lifecycle Logging**
- **File**: `server.js`
- **Features**:
  - 🚀 Detailed startup sequence
  - 📋 Available API routes listing
  - ✅ Success confirmation with URLs
  - 💥 Unhandled promise rejections
  - 💥 Uncaught exceptions

## How to View Errors

### Development Mode
Run the server with enhanced logging:
```bash
# Standard development
npm run dev

# Enhanced logging with startup details
npm run dev:verbose

# Full debug mode
npm run dev:debug

# Debug with Node.js inspector
npm run debug
```

### Production Mode
```bash
npm start
```
(Production mode has less verbose logging but still shows critical errors)

## Error Types and Display Format

### 1. **HTTP API Errors**
```
🚨 ERROR OCCURRED 🚨
═══════════════════
Time: 2024-01-15T10:30:00.000Z
Method: POST
URL: /api/auth/register
IP: 127.0.0.1
User-Agent: Mozilla/5.0...
Request Body:
{
  "name": "John Doe",
  "phoneNumber": "+1234567890",
  "code": "[HIDDEN]"
}

Error Details:
Name: ValidationError
Message: Phone number is required

Stack Trace:
ValidationError: Phone number is required
    at validateRegister (/path/to/controller.js:25:3)
    at Object.register (/path/to/controller.js:15:5)
    ...
═══════════════════
```

### 2. **Database Errors**
```
💥 DATABASE CONNECTION FAILED 💥
═══════════════════════════════════
Time: 2024-01-15T10:30:00.000Z
Error: MongoNetworkError: failed to connect to server
Connection String: mongodb://localhost:27017/matching-app

Stack Trace:
MongoNetworkError: failed to connect...

💡 Troubleshooting tips:
  1. Make sure MongoDB is running
  2. Check MONGODB_URI in .env file
  3. Verify network connectivity
  4. Check MongoDB auth credentials
═══════════════════════════════════
```

### 3. **Socket Errors**
```
🔒 SOCKET AUTH ERROR 🔒
Time: 2024-01-15T10:30:00.000Z
Socket ID: abc123def456
Error: No token provided
IP: 127.0.0.1
```

### 4. **Application Startup**
```
🚀 STARTING MATCHAPP BACKEND SERVER 🚀
══════════════════════════════════════
Environment: development
Time: 2024-01-15T10:30:00.000Z
Node Version: v18.17.0
Platform: win32
══════════════════════════════════════

🔌 Connecting to MongoDB...

💾 DATABASE CONNECTION SUCCESS 💾
═══════════════════════════════════
📍 Host: localhost
🏗️  Database: matching-app
🔗 Port: 27017
⚡ Ready State: Connected
═══════════════════════════════════

✅ SERVER STARTED SUCCESSFULLY ✅
═══════════════════════════════
🌐 Server running on port 5000
📍 Local URL: http://localhost:5000
🔍 Health check: http://localhost:5000/api/health
📊 Debug info: http://localhost:5000/api/debug/auth-flow
⏰ Started at: 1/15/2024, 10:30:00 AM
═══════════════════════════════

📋 Available API Routes:
  AUTH:
    POST /api/auth/register
    POST /api/auth/verify-sms
    ...
```

## Error Monitoring in Real-Time

### Console Colors
- **🚨 Red**: Critical errors
- **⚠️ Yellow**: Warnings
- **🟢 Green**: Success operations
- **🔵 Blue**: Information
- **🟣 Purple**: Debug information

### HTTP Request Monitoring
```
📡 POST /api/auth/register 201 1234 - 150.5 ms 2024-01-15T10:30:00.000Z
📡 GET /api/users/nearby 200 567 - 45.2 ms 2024-01-15T10:30:01.000Z
📡 POST /api/matching/request 400 89 - 12.8 ms 2024-01-15T10:30:02.000Z
```

### Socket Connections
```
🟢 User connected: John Doe (507f1f77bcf86cd799439011) at 10:30:00 AM
🔴 User disconnected: Jane Smith (507f1f77bcf86cd799439012) at 10:32:15 AM
```

## Debugging Tips

1. **Check Console Output**: All errors are displayed in the command window with detailed information
2. **Use Health Check**: Visit `http://localhost:5000/api/health` to verify server status
3. **Debug Auth Flow**: Visit `http://localhost:5000/api/debug/auth-flow` for authentication flow information
4. **Monitor Requests**: Watch the colored HTTP request logs for API call patterns
5. **Check Database**: Look for database connection messages on startup

## Security Features

- **Sensitive Data Protection**: Passwords, SMS codes, and tokens are masked in logs
- **Production Mode**: Reduced logging in production to avoid information leakage
- **IP Tracking**: All errors include client IP addresses for security monitoring

This comprehensive error logging system ensures that any issues during project execution are clearly visible in the command window with enough detail to quickly identify and resolve problems.