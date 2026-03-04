const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const matchingRoutes = require('./routes/matching');
const mapRoutes = require('./routes/map');
const adminRoutes = require('./routes/admin');
const { ensureAdminAccount } = require('./services/adminBootstrapService');
const socketHandler = require('./services/socketHandler');
const errorHandler = require('./middleware/errorHandler');

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

const getAllowedOrigins = () => {
  const rawOrigins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '';
  const extraOrigins = process.env.FRONTEND_URL || '';
  const parsedOrigins = `${rawOrigins},${extraOrigins}`
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return parsedOrigins.length > 0 ? parsedOrigins : DEFAULT_ALLOWED_ORIGINS;
};

const getAllowedOriginRegexes = () => {
  const raw = process.env.CORS_ORIGIN_REGEX || '';
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((pattern) => {
      try {
        return new RegExp(pattern);
      } catch (error) {
        console.warn(`Invalid CORS_ORIGIN_REGEX pattern ignored: ${pattern}`);
        return null;
      }
    })
    .filter(Boolean);
};

const allowedOrigins = getAllowedOrigins();
const allowedOriginRegexes = getAllowedOriginRegexes();
const debugRoutesEnabled = process.env.ENABLE_DEBUG_ROUTES === 'true';
const debugApiToken = process.env.DEBUG_API_TOKEN || '';

const validateCorsOrigin = (origin, callback) => {
  const matchesRegex = origin
    ? allowedOriginRegexes.some((regex) => regex.test(origin))
    : false;

  if (!origin || allowedOrigins.includes(origin) || matchesRegex) {
    return callback(null, true);
  }

  console.warn(`Blocked CORS origin: ${origin}`);
  return callback(new Error('Not allowed by CORS'));
};

const requireDebugAccess = (req, res, next) => {
  if (!debugRoutesEnabled) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (!debugApiToken) {
    return next();
  }

  const providedToken = req.header('x-debug-token');
  if (providedToken !== debugApiToken) {
    return res.status(403).json({ error: 'Debug access denied' });
  }
  return next();
};

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: validateCorsOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true
  }
});

// Enhanced console logging on startup
console.log('\nÃ°Å¸Å¡â‚¬ STARTING MATCHAPP BACKEND SERVER Ã°Å¸Å¡â‚¬');
console.log('Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Time: ${new Date().toISOString()}`);
console.log(`Node Version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log('Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â\n');

app.set('trust proxy', 1);
app.use(helmet());

// Enhanced Morgan logging for development
const morganFormat = process.env.NODE_ENV === 'production'
  ? 'combined'
  : ':method :url :status :res[content-length] - :response-time ms :date[iso]';

app.use(morgan(morganFormat, {
  stream: {
    write: (message) => {
      // Color code HTTP status
      const status = message.match(/(\d{3})/)?.[1];
      let color = '\x1b[0m'; // Default
      if (status) {
        if (status.startsWith('2')) color = '\x1b[32m'; // Green for 2xx
        else if (status.startsWith('3')) color = '\x1b[33m'; // Yellow for 3xx
        else if (status.startsWith('4')) color = '\x1b[31m'; // Red for 4xx
        else if (status.startsWith('5')) color = '\x1b[35m'; // Magenta for 5xx
      }
      console.log(`Ã°Å¸â€œÂ¡ ${color}${message.trim()}\x1b[0m`);
    }
  }
}));
app.use(cors({
  origin: validateCorsOrigin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-debug-token"]
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More generous in development
  message: {
    error: 'Too many requests from this IP, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.error('\nÃ°Å¸Å¡Â« RATE LIMIT EXCEEDED Ã°Å¸Å¡Â«');
    console.error('Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â');
    console.error(`Time: ${new Date().toISOString()}`);
    console.error(`IP: ${req.ip}`);
    console.error(`Method: ${req.method}`);
    console.error(`URL: ${req.originalUrl}`);
    console.error(`User-Agent: ${req.get('User-Agent')}`);
    console.error('Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â\n');

    res.status(429).json({
      error: 'Too many requests from this IP, please try again later',
      retryAfter: '15 minutes'
    });
  }
});
app.use(limiter);

// More lenient SMS rate limiter for development
const smsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // 5 in production, 50 in development
  message: {
    error: 'Too many SMS requests, try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Separate rate limiter for other auth endpoints (more permissive)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More requests for auth endpoints
  message: {
    error: 'Too many authentication requests, try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.set('io', io);

// Apply different rate limiters to different auth routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoints are opt-in only via ENABLE_DEBUG_ROUTES=true
if (debugRoutesEnabled) {
  app.get('/api/debug/auth-flow', requireDebugAccess, (req, res) => {
    res.json({
      authFlow: {
        registration: {
          step1: 'POST /api/auth/register - Returns userId, requires SMS verification',
          step2: 'POST /api/auth/verify-sms - Returns token after SMS verification'
        },
        login: {
          step1: 'POST /api/auth/login - Returns userId, requires SMS verification',
          step2: 'POST /api/auth/verify-login - Returns token after SMS verification'
        },
        note: 'Both registration and login require SMS verification to get authentication token'
      }
    });
  });

  app.get('/api/debug/rate-limits', requireDebugAccess, (req, res) => {
    res.json({
      rateLimits: {
        general: {
          windowMs: '15 minutes',
          max: process.env.NODE_ENV === 'production' ? 100 : 1000,
          current: 'Check RateLimit-Remaining header in response'
        },
        auth: {
          windowMs: '15 minutes',
          max: process.env.NODE_ENV === 'production' ? 100 : 1000,
          applies: 'All /api/auth/* routes'
        },
        sms: {
          windowMs: '1 hour',
          max: process.env.NODE_ENV === 'production' ? 5 : 20,
          applies: 'Only /api/auth/register and /api/auth/login',
          keyBy: 'IP + phone number'
        }
      },
      headers: {
        'RateLimit-Limit': 'Maximum requests allowed',
        'RateLimit-Remaining': 'Requests remaining in current window',
        'RateLimit-Reset': 'Time when rate limit resets'
      },
      troubleshooting: {
        429: 'Too Many Requests - wait for rate limit to reset',
        solution: 'Wait for the time period or restart server in development'
      }
    });
  });

  // Debug endpoint to check user registration status
  app.post('/api/debug/check-user', requireDebugAccess, async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number required' });
      }

      const User = require('./models/User');
      const user = await User.findOne({ phoneNumber }).select('-smsCode -smsCodeExpiry');

      if (!user) {
        return res.json({
          exists: false,
          status: 'NOT_REGISTERED',
          message: 'User does not exist in database',
          action: 'User needs to register first'
        });
      }

      res.json({
        exists: true,
        status: user.smsVerified ? 'FULLY_REGISTERED' : 'PENDING_SMS_VERIFICATION',
        user: {
          id: user._id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          smsVerified: user.smsVerified,
          createdAt: user.createdAt
        },
        action: user.smsVerified ? 'Can login normally' : 'Needs to complete SMS verification'
      });
    } catch (error) {
      console.error('Debug check user error:', error);
      res.status(500).json({ error: 'Server error checking user' });
    }
  });
}

// Add error handling middleware (must be last)
app.use(errorHandler);

socketHandler(io);

const PORT = process.env.PORT || 5000;

const bootServer = async () => {
  await connectDB();
  await ensureAdminAccount();

  server.listen(PORT, () => {
    console.log('\nSERVER STARTED SUCCESSFULLY');
    console.log(`Server running on port ${PORT}`);
    console.log(`Local URL: http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    if (debugRoutesEnabled) {
      console.log(`Debug info: http://localhost:${PORT}/api/debug/auth-flow`);
    }
    console.log(`Started at: ${new Date().toLocaleString()}`);

    console.log('Available API Routes:');
    console.log('  AUTH:');
    console.log('    POST /api/auth/register');
    console.log('    POST /api/auth/verify-sms');
    console.log('    POST /api/auth/login');
    console.log('    POST /api/auth/verify-login');
    console.log('    GET  /api/auth/validate');
    console.log('    GET  /api/auth/me');
    console.log('    POST /api/auth/refresh');
    console.log('  USERS:');
    console.log('    GET  /api/users/nearby');
    console.log('    GET  /api/users/all');
    console.log('    POST /api/users/update-location');
    console.log('    GET  /api/users/profile/:id');
    console.log('    PUT  /api/users/profile');
    console.log('    POST /api/users/status');
    console.log('  MATCHING:');
    console.log('    POST /api/matching/request');
    console.log('    POST /api/matching/respond');
    console.log('    GET  /api/matching/pending-summary');
    console.log('    GET  /api/matching/history');
    console.log('    POST /api/matching/confirm-meeting');
    console.log('  MAP:');
    console.log('    GET  /api/map/config');
    console.log('    GET  /api/map/data');
    console.log('    GET  /api/map/location');
    console.log('    POST /api/map/location');
    console.log('  ADMIN:');
    console.log('    GET   /api/admin/users');
    console.log('    PATCH /api/admin/users/:userId/freeze');
    console.log('    PATCH /api/admin/users/:userId/status');
    console.log('\nReady to accept requests.\n');
  });
};

bootServer().catch((error) => {
  console.error('Server boot failed:', error);
  process.exit(1);
});
