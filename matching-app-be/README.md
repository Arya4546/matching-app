# MatchApp Backend API

The backend API server for MatchApp - A real-time location-based matching application built with Express.js, MongoDB, and Socket.io.

## 🚀 Features

- **SMS Authentication** with Twilio integration
- **Real-time Communication** via Socket.io
- **Geospatial Queries** for location-based matching
- **JWT Authentication** with secure token management
- **Rate Limiting** for API protection
- **Input Validation** and sanitization
- **Error Handling** with comprehensive logging

## 🛠️ Tech Stack

- **Express.js** - Web application framework
- **MongoDB & Mongoose** - Database and ODM
- **Socket.io** - Real-time bidirectional communication
- **JWT** - JSON Web Token authentication
- **Twilio** - SMS verification service
- **Helmet** - Security middleware
- **Morgan** - HTTP request logger
- **Express Validator** - Input validation

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Twilio account with SMS capability

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository (if not already done)
git clone <repo-url>
cd matching-app/backend

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit with your configuration
nano .env
```

**Required Environment Variables:**

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/matching-app

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### 3. Start Development Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "phoneNumber": "+1234567890",
  "gender": "male",
  "address": "123 Main St, City, State"
}
```

#### Verify SMS Code
```http
POST /api/auth/verify-sms
Content-Type: application/json

{
  "userId": "user_id_here",
  "code": "123456"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "phoneNumber": "+1234567890"
}
```

#### Verify Login SMS
```http
POST /api/auth/verify-login
Content-Type: application/json

{
  "userId": "user_id_here",
  "code": "123456"
}
```

### User Endpoints

#### Get Nearby Users
```http
GET /api/users/nearby?lat=40.7128&lng=-74.0060&radius=10000
Authorization: Bearer <jwt_token>
```

#### Update Location
```http
POST /api/users/update-location
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "lat": 40.7128,
  "lng": -74.0060
}
```

#### Get User Profile
```http
GET /api/users/profile/:userId
Authorization: Bearer <jwt_token>
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "bio": "Updated bio",
  "profilePhoto": "https://example.com/photo.jpg"
}
```

### Matching Endpoints

#### Send Match Request
```http
POST /api/matching/request
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "targetUserId": "target_user_id",
  "meetingReason": "Would like to grab coffee and chat"
}
```

#### Respond to Match
```http
POST /api/matching/respond
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "matchId": "match_id_here",
  "response": "accepted"  // or "rejected"
}
```

#### Get Match History
```http
GET /api/matching/history?page=1&limit=10&status=accepted
Authorization: Bearer <jwt_token>
```

#### Confirm Meeting
```http
POST /api/matching/confirm-meeting
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "meetingId": "meeting_id_here"
}
```

## 🔌 Socket.io Events

### Client to Server Events

- `updateLocation` - Update user's current location
- `joinRoom` - Join a chat room
- `sendMessage` - Send message in room
- `approachingMeeting` - Notify approaching meeting point

### Server to Client Events

- `userOnline` / `userOffline` - User status updates
- `userLocationUpdate` - Real-time location changes
- `newMatchRequest` - Incoming match request
- `matchAccepted` / `matchRejected` - Match responses
- `meetingConfirmed` - Meeting confirmations
- `userApproachingMeeting` - Someone approaching meeting point

## 🗄️ Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  phoneNumber: String (unique, indexed),
  gender: String (enum: ['male', 'female', 'other']),
  address: String,
  location: {
    type: "Point",
    coordinates: [longitude, latitude] // GeoJSON format
  },
  profilePhoto: String,
  bio: String,
  isOnline: Boolean,
  matchCount: Number,
  actualMeetCount: Number,
  smsVerified: Boolean,
  socketId: String,
  lastSeen: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Matches Collection
```javascript
{
  _id: ObjectId,
  requesterId: ObjectId (ref: User),
  targetUserId: ObjectId (ref: User),
  status: String (enum: ['pending', 'accepted', 'rejected', 'expired']),
  meetingReason: String,
  meetingPoint: {
    type: "Point",
    coordinates: [longitude, latitude],
    address: String,
    placeName: String
  },
  expiresAt: Date (24 hours from creation),
  createdAt: Date,
  updatedAt: Date
}
```

### Meetings Collection
```javascript
{
  _id: ObjectId,
  matchId: ObjectId (ref: Match),
  scheduledTime: Date,
  actualMeetingTime: Date,
  requesterConfirmed: Boolean,
  targetConfirmed: Boolean,
  bothConfirmed: Boolean,
  requesterRating: Number (1-5),
  targetRating: Number (1-5),
  meetingSuccess: Boolean,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Security Features

### Authentication
- JWT tokens with 7-day expiry
- SMS verification for all logins
- Secure token storage and validation

### Rate Limiting
- General API: 100 requests per 15 minutes
- SMS endpoints: 5 requests per hour per IP
- Configurable limits via environment variables

### Data Protection
- Input validation on all endpoints
- SQL injection prevention with Mongoose
- XSS protection with Helmet
- CORS configuration for frontend domain only

### Privacy
- User locations only shared after mutual match
- Phone numbers never exposed in API responses
- Automatic session cleanup for offline users

## 📊 Middleware Stack

1. **Helmet** - Security headers
2. **Morgan** - HTTP logging
3. **CORS** - Cross-origin resource sharing
4. **Rate Limiting** - API protection
5. **JSON Parser** - Request body parsing
6. **Custom Auth** - JWT validation
7. **Express Validator** - Input validation

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- user.test.js
```

### Test Structure
```
backend/
├── tests/
│   ├── auth.test.js
│   ├── users.test.js
│   ├── matching.test.js
│   └── socket.test.js
```

## 📝 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run test suite
- `npm run lint` - Check code style
- `npm run lint:fix` - Fix code style issues
- `npm run clean` - Remove node_modules and lock file

## 🚀 Deployment

### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/matchapp
JWT_SECRET=your-production-jwt-secret
PORT=80
```

### Docker Support
```bash
# Build Docker image
npm run docker:build

# Run Docker container
npm run docker:run
```

### Health Check
```http
GET /api/health
```
Returns server status and MongoDB connection state.

## 📈 Monitoring

### Logging
- HTTP requests logged via Morgan
- Error logging to console
- Custom application logs for debugging

### Performance Metrics
- Response time tracking
- Database query monitoring
- Socket.io connection stats

## 🛠️ Development Tips

### Database Inspection
```bash
# Connect to MongoDB
mongo matching-app

# View collections
show collections

# Check users
db.users.find().pretty()

# Check indexes
db.users.getIndexes()
```

### Socket.io Debugging
```bash
# Enable debug logs
DEBUG=socket.io* npm run dev
```

### API Testing with cURL
```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","phoneNumber":"+1234567890","gender":"male","address":"Test Address"}'

# Get nearby users
curl -X GET "http://localhost:5000/api/users/nearby?lat=40.7128&lng=-74.0060" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Configuration

### Environment Variables
All configuration is handled via environment variables. See `.env.example` for all available options.

### Database Indexes
The application automatically creates the following indexes:
- Users: `location` (2dsphere), `phoneNumber` (unique)
- Matches: `requesterId + targetUserId`, `expiresAt` (TTL)

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check MongoDB service is running
   - Verify connection string in `.env`
   - Check network connectivity for Atlas

2. **SMS Not Sending**
   - Verify Twilio credentials
   - Check phone number format (+1XXXXXXXXXX)
   - Review Twilio console for errors

3. **JWT Token Invalid**
   - Check JWT_SECRET is set
   - Verify token hasn't expired
   - Ensure client sends Bearer token

4. **Socket.io Connection Issues**
   - Check CORS settings
   - Verify client URL in environment
   - Review browser console for errors

### Debug Mode
```bash
# Enable all debug logs
DEBUG=* npm run dev

# Enable specific modules
DEBUG=express:*,socket.io:* npm run dev
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Commit changes (`git commit -am 'Add feature'`)
4. Push to branch (`git push origin feature/name`)
5. Create Pull Request

---

**Built with ❤️ for real-world connections**