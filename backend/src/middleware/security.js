import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const isProd = process.env.NODE_ENV === 'production';

// CORS allowed origins – restrict in production
export const getAllowedOrigins = () => {
  const frontendUrl = process.env.FRONTEND_URL;
  if (isProd && frontendUrl) return [frontendUrl.trim()];
  if (isProd) return true; // fallback: allow same-origin
  return ['http://localhost:5173', 'http://127.0.0.1:5173'];
};

// General rate limit
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for auth endpoints (brute-force protection)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helmet security headers + CSP
export const helmetMiddleware = helmet({
  contentSecurityPolicy: isProd
    ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
          upgradeInsecureRequests: [],
        },
      }
    : false,
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true } : false,
});
