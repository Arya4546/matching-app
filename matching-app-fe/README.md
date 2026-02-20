# MatchApp Frontend

React frontend for MatchApp - A real-time location-based matching application with Google Maps integration and beautiful mobile-first design.

## 🚀 Features

- **Interactive Maps** with Google Maps integration
- **Real-time Updates** via Socket.io
- **SMS Authentication** flow with beautiful UI
- **Location Tracking** with GPS integration
- **Match System** with animated modals
- **Mobile-First Design** with responsive layouts
- **Smooth Animations** with Framer Motion
- **Modern UI/UX** inspired by popular social apps

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks
- **React Router** - Client-side routing
- **Google Maps API** - Interactive maps and geocoding
- **Socket.io Client** - Real-time communication
- **Framer Motion** - Smooth animations
- **Styled Components** - CSS-in-JS styling
- **Axios** - HTTP client
- **React Toastify** - Beautiful notifications

## 📋 Prerequisites

- Node.js (v16 or higher)
- Google Maps API key with Maps JavaScript API enabled
- Backend API server running

## 🚀 Quick Start

### 1. Installation

```bash
# Navigate to frontend directory
cd matching-app/frontend

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
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000

# Google Maps (REQUIRED)
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional
REACT_APP_APP_NAME=MatchApp
GENERATE_SOURCEMAP=false
```

### 3. Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API (optional)
4. Create API Key with restrictions:
   - Application restrictions: HTTP referrers
   - Add your domain: `http://localhost:3000/*`
   - API restrictions: Select enabled APIs only

### 4. Start Development Server

```bash
# Start the development server
npm start
```

Application will open at `http://localhost:3000`

## 📱 Application Flow

### 1. Splash Screen
- Beautiful animated loading screen
- 2-second duration with app branding
- Smooth transition to authentication

### 2. Authentication Flow
```
Login/Register → SMS Verification → Map View
```

#### Registration Steps:
1. **Basic Info**: Name and phone number
2. **Details**: Gender, address, bio
3. **SMS Verification**: 6-digit code input
4. **Success**: Auto-login to map view

#### Login Process:
1. **Phone Input**: Enter registered phone number
2. **SMS Verification**: Receive and enter code
3. **Success**: Access to main application

### 3. Main Map Interface

#### Layout (Mobile-First):
- **Header**: Profile avatar, app name, connection status, actions
- **Map**: Full-screen Google Maps (70% of screen)
- **User Panel**: Expandable bottom panel (30% when open)
- **Floating Elements**: Match requests, location refresh

#### Map Features:
- **Current User Pin**: Distinctive marker for user's location
- **Other Users**: Clickable pins for nearby users
- **Info Windows**: User profiles on pin click
- **Real-time Updates**: Live location tracking
- **Meeting Points**: Special markers for confirmed meetings

### 4. Matching System

#### Match Request Flow:
```
Click User Pin → View Profile → Send Match Request → Wait for Response
```

#### Match Response Flow:
```
Receive Request → View Details → Accept/Decline → Meeting Coordination
```

#### Meeting Flow:
```
Match Accepted → Get Directions → Arrive at Location → Confirm Meeting
```

## 🎨 UI/UX Design

### Design System

#### Colors
```css
Primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Secondary: #2ed573 (success), #ff4757 (error)
Background: #f8f9fa
Text: #333 (primary), #666 (secondary), #999 (muted)
```

#### Typography
```css
Font Family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
Headers: 700 weight, -0.5px letter-spacing
Body: 400 weight, 1.5 line-height
Small: 600 weight, 0.5px letter-spacing (uppercase)
```

#### Spacing
```css
Base Unit: 4px
Small: 8px, 12px, 16px
Medium: 20px, 24px, 32px
Large: 40px, 60px, 80px
```

### Component Library

#### Buttons
- **Primary**: Gradient background with shadow
- **Secondary**: White background with colored border
- **Outline**: Transparent with colored border
- **Danger**: Red gradient for destructive actions

#### Modals
- **Backdrop**: Blurred background
- **Content**: Rounded corners, smooth animations
- **Header**: Gradient background with close button
- **Actions**: Flexible button layout

#### Forms
- **Inputs**: Rounded, with focus animations
- **Labels**: Uppercase, small font, colored
- **Validation**: Real-time with smooth error messages

## 🗂️ Project Structure

```
frontend/
├── public/
│   ├── index.html          # HTML template
│   └── manifest.json       # PWA manifest
├── src/
│   ├── components/         # React components
│   │   ├── auth/          # Authentication components
│   │   ├── common/        # Shared components
│   │   ├── map/           # Map-related components
│   │   ├── matching/      # Matching system components
│   │   └── profile/       # User profile components
│   ├── contexts/          # React contexts
│   │   ├── AuthContext.js     # Authentication state
│   │   ├── LocationContext.js # Location management
│   │   └── SocketContext.js   # Real-time communication
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API and external services
│   │   ├── api.js         # HTTP API client
│   │   └── googleMaps.js  # Google Maps service
│   ├── styles/            # CSS modules
│   ├── utils/             # Utility functions
│   ├── App.js             # Main App component
│   └── index.js           # React entry point
└── package.json
```

### Component Architecture

#### Context Providers
```javascript
<AuthProvider>          // Authentication state
  <LocationProvider>    // GPS and location state
    <SocketProvider>    // Real-time communication
      <App />
    </SocketProvider>
  </LocationProvider>
</AuthProvider>
```

#### Component Hierarchy
```
App
├── SplashScreen
├── Auth Components
│   ├── Login
│   ├── Register
│   └── SMSVerification
├── MapView
│   ├── UserPanel
│   └── Map Controls
├── Modals
│   ├── MatchRequestModal
│   ├── MatchResponseModal
│   ├── MeetingModal
│   └── ProfileModal
└── Profile Components
```

## 🔌 Real-time Features

### Socket.io Integration

#### Connection Management
```javascript
// Auto-connect on authentication
useEffect(() => {
  if (user && token) {
    socket = io(SOCKET_URL, { auth: { token } });
  }
}, [user, token]);
```

#### Event Handling
```javascript
// Location updates
socket.on('userLocationUpdate', (data) => {
  updateMapMarker(data.userId, data.location);
});

// Match notifications
socket.on('newMatchRequest', (data) => {
  showNotification(`New match request from ${data.requester.name}`);
});
```

### Location Services

#### GPS Tracking
```javascript
// Request permission and start tracking
const startLocationTracking = () => {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      updateLocation(latitude, longitude);
    },
    (error) => handleLocationError(error),
    { enableHighAccuracy: true, maximumAge: 60000 }
  );
};
```

#### Google Maps Integration
```javascript
// Initialize map with custom styling
const map = new google.maps.Map(element, {
  center: { lat, lng },
  zoom: 15,
  styles: customMapStyles,
  disableDefaultUI: true
});
```

## 🎭 Animation System

### Framer Motion Integration

#### Page Transitions
```javascript
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};
```

#### Modal Animations
```javascript
const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
};
```

#### Button Interactions
```javascript
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", damping: 25 }}
>
```

## 🧪 Testing

### Test Structure
```
frontend/
├── src/
│   ├── __tests__/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── services/
│   │   └── utils/
│   └── setupTests.js
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- Login.test.js
```

### Testing Libraries
- **Jest** - Test runner and assertion library
- **React Testing Library** - Component testing utilities
- **User Event** - User interaction simulation

## 📱 Mobile Optimization

### Responsive Design
```css
/* Mobile First Approach */
@media (max-width: 768px) {
  .component { /* Mobile styles */ }
}

@media (min-width: 769px) {
  .component { /* Desktop styles */ }
}
```

### Touch Interactions
- **Large Touch Targets** - Minimum 44px
- **Swipe Gestures** - Pan and dismiss modals
- **Pull to Refresh** - Map data updates
- **Haptic Feedback** - On important actions

### Performance Optimization
- **Code Splitting** - Lazy load components
- **Image Optimization** - WebP format with fallbacks
- **Bundle Analysis** - Regular size monitoring
- **Service Worker** - Offline functionality

## 🔒 Security Considerations

### API Security
- **JWT Tokens** - Secure storage in httpOnly cookies
- **HTTPS Only** - All production traffic encrypted
- **CORS** - Restricted to backend domain only

### Data Protection
- **Location Privacy** - Only shared after mutual consent
- **Input Validation** - Client-side validation for UX
- **XSS Prevention** - Sanitize all user inputs

### Third-party Services
- **Google Maps** - API key restrictions by domain
- **Rate Limiting** - Prevent API abuse
- **Error Boundaries** - Graceful error handling

## 📊 Performance Monitoring

### Core Web Vitals
```javascript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### Bundle Analysis
```bash
# Analyze bundle size
npm run analyze

# Preview production build
npm run preview
```

### Lighthouse Scores
Target scores:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

## 🚀 Build and Deployment

### Development Build
```bash
npm start
# Serves on http://localhost:3000
# Hot reload enabled
# Source maps available
```

### Production Build
```bash
npm run build
# Creates optimized build in /build
# Minified and compressed
# Service worker generated
```

### Deployment Options

#### Static Hosting (Recommended)
- **Netlify** - Automatic deployments from git
- **Vercel** - Optimized for React applications
- **GitHub Pages** - Free hosting for open source
- **AWS S3** - Scalable cloud storage

#### CDN Configuration
```bash
# Build with public path
PUBLIC_URL=https://cdn.example.com npm run build
```

### Environment-Specific Builds
```bash
# Development
REACT_APP_API_URL=http://localhost:5000/api npm start

# Staging
REACT_APP_API_URL=https://staging.api.matchapp.com npm run build

# Production
REACT_APP_API_URL=https://api.matchapp.com npm run build
```

## 🔧 Configuration

### Environment Variables
```bash
# API Endpoints
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000

# Google Maps
REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here

# App Configuration
REACT_APP_APP_NAME=MatchApp
REACT_APP_VERSION=1.0.0

# Build Configuration
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
```

### Feature Flags
```javascript
const FEATURES = {
  CHAT_MESSAGING: process.env.REACT_APP_ENABLE_CHAT === 'true',
  PUSH_NOTIFICATIONS: process.env.REACT_APP_ENABLE_PUSH === 'true',
  ADVANCED_FILTERS: process.env.REACT_APP_ENABLE_FILTERS === 'true'
};
```

## 🐛 Troubleshooting

### Common Issues

1. **Google Maps Not Loading**
   ```bash
   # Check API key
   console.log(process.env.REACT_APP_GOOGLE_MAPS_API_KEY)
   
   # Check browser console for errors
   # Verify APIs are enabled in Google Cloud Console
   ```

2. **Location Permission Denied**
   ```javascript
   // Must use HTTPS in production
   // localhost works for development
   // Check browser location settings
   ```

3. **Socket Connection Failed**
   ```bash
   # Check backend server is running
   # Verify CORS settings
   # Check network connectivity
   ```

4. **Build Failures**
   ```bash
   # Clear cache and reinstall
   npm run clean
   npm install
   
   # Check for TypeScript errors
   npm run lint
   ```

### Debug Tools

#### React Developer Tools
- Component inspector
- Props and state viewer
- Performance profiler

#### Browser DevTools
```javascript
// Enable React debugging
window.__REACT_DEVTOOLS_GLOBAL_HOOK__
```

#### Network Monitoring
```javascript
// API call logging
axios.interceptors.request.use(request => {
  console.log('Starting Request', request);
  return request;
});
```

## 📝 Scripts Reference

- `npm start` - Start development server
- `npm run build` - Create production build
- `npm test` - Run test suite
- `npm run eject` - Eject from Create React App
- `npm run lint` - Check code style
- `npm run analyze` - Bundle size analysis
- `npm run serve` - Serve production build locally
- `npm run clean` - Clean dependencies and build

## 🎨 Customization

### Theming
```javascript
// themes/default.js
export const theme = {
  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    success: '#2ed573',
    error: '#ff4757'
  },
  fonts: {
    primary: '-apple-system, BlinkMacSystemFont, sans-serif'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  }
};
```

### Component Customization
```javascript
// Customize button styles
const CustomButton = styled(Button)`
  background: linear-gradient(45deg, #fe6b8b 30%, #ff8e53 90%);
  border-radius: 3px;
  border: 0;
  color: white;
  height: 48px;
  padding: 0 30px;
  box-shadow: 0 3px 5px 2px rgba(255, 105, 135, .3);
`;
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Follow code style guidelines
4. Add tests for new features
5. Update documentation
6. Commit changes (`git commit -am 'Add feature'`)
7. Push to branch (`git push origin feature/name`)
8. Create Pull Request

### Code Style Guidelines
- Use functional components with hooks
- Follow React best practices
- Use TypeScript for type safety (if enabled)
- Write meaningful component names
- Add PropTypes or TypeScript interfaces
- Keep components small and focused

---

**Built with ❤️ for seamless user experiences**