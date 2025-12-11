// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
// Session store based on environment
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const crypto = require('crypto');
const winston = require('winston');
const expressWinston = require('express-winston');
const xss = require('xss');
const { 
  doubleCsrfProtection, 
  generateToken, 
  handleCsrfError 
} = require('./utils/csrfConfig');

const app = express();
const port = process.env.PORT || 3000;

// Logging configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Enable trust proxy if behind a reverse proxy
app.set('trust proxy', 1);

// Generate CSP nonce for each request
app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Enhanced XSS protection middleware
app.use((req, res, next) => {
  const sanitizeRecursively = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = xss(obj[key], {
          whiteList: {},        // Disable any allowed tags
          stripIgnoreTag: true, // Strip all HTML tags
          stripIgnoreTagBody: ['script'] // Remove content inside script tags
        });
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeRecursively(obj[key]);
      }
    }
  };
  
  sanitizeRecursively(req.body);
  sanitizeRecursively(req.query);
  sanitizeRecursively(req.params);

  next();
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', (req, res) => `'nonce-${res.locals.cspNonce}'`],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'], // Allow external images for development
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null, // Only in production
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' },
  hsts: false, // Disable HSTS in development (http://localhost)
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
}));

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : false,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
};
app.use(cors(corsOptions));

app.use(hpp());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public'), { 
  maxAge: '1d',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie parsing middleware
app.use(cookieParser(process.env.COOKIE_SECRET));

// Session middleware - PostgreSQL (production) or in-memory (development)
let sessionStore;

if (process.env.NODE_ENV === 'production' && process.env.DB_HOST) {
  // PostgreSQL session store for production
  const pgPool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  sessionStore = new pgSession({
    pool: pgPool,
    tableName: 'session',
    createTableIfMissing: true,
  });

  logger.info('Using PostgreSQL session store');
} else {
  // Memory store for development (warning: don't use in production)
  logger.warn('Using in-memory session store (development only)');
  sessionStore = new session.MemoryStore();
}

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Only secure in production
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  genid: (req) => uuidv4(),
}));

// Middleware to set the uniqueId cookie if it doesn't exist
app.use((req, res, next) => {
  if (!req.cookies.uniqueId) {
    res.cookie('uniqueId', uuidv4(), {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only secure in production (HTTPS)
      sameSite: 'strict'
    });
  }
  next();
});

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Logging middleware
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}}",
  expressFormat: true,
  colorize: false,
}));

// Set up the view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Apply CSRF protection middleware
app.use(doubleCsrfProtection);

// Middleware to make CSRF token available to views
app.use((req, res, next) => {
  res.locals.csrfToken = generateToken(req, res);
  next();
});

// Import and use the route modules
const indexRoutes = require('./routes/index');
const searchRoutes = require('./routes/search');
const gameRoutes = require('./routes/game');
const shortenerRoutes = require('./routes/shortener');

app.use('/', indexRoutes);
app.use('/search', searchRoutes);
app.use('/game', gameRoutes);
app.use('/shorten', shortenerRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).render('error', { message: 'Page not found' });
});

// CSRF error handler
app.use(handleCsrfError);

// General error handling middleware
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  res.status(err.status || 500).render('error', { message: 'Something went wrong' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    if (sessionStore && sessionStore.close) {
      sessionStore.close();
    }
  });
});

// Start the server
const server = app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
}).on('error', (err) => {
  logger.error('Error starting server:', err);
  process.exit(1);
});

module.exports = server;