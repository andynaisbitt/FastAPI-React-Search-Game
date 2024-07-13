// utils/csrfConfig.js
const { doubleCsrf } = require('csrf-csrf');

const CSRF_SECRET = process.env.CSRF_SECRET;

if (!CSRF_SECRET) {
  console.error('CSRF_SECRET is not set in environment variables');
  throw new Error('CSRF_SECRET must be set');
}

const csrfOptions = {
  getSecret: () => CSRF_SECRET,
  cookieName: '__Host-psifi.csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => {
    return req.headers['x-csrf-token'] || req.body._csrf || req.query._csrf;
  }
};

const {
  generateToken,
  doubleCsrfProtection,
  validateRequest
} = doubleCsrf(csrfOptions);

const addCsrfTokenToLocals = (req, res, next) => {
  res.locals.csrfToken = generateToken(req, res);
  next();
};

const handleCsrfError = (error, req, res, next) => {
  if (error.code === 'EBADCSRFTOKEN') {
    console.warn(`CSRF attack detected: ${req.method} ${req.originalUrl}`);
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  next(error);
};

const isValidCsrfToken = (req, res) => {
  try {
    validateRequest(req, res);
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  generateToken,
  doubleCsrfProtection,
  validateRequest,
  addCsrfTokenToLocals,
  handleCsrfError,
  isValidCsrfToken
};