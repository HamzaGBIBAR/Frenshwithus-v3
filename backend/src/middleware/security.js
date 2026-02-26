import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const isProd = process.env.NODE_ENV === 'production';

// CORS allowed origins – restrict in production
export const getAllowedOrigins = () => {
  const frontendUrl = process.env.FRONTEND_URL;
  if (isProd && frontendUrl) return frontendUrl.split(',').map((u) => u.trim()).filter(Boolean);
  // Railway: derive from public domain when frontend is served from same origin
  if (isProd && process.env.RAILWAY_PUBLIC_DOMAIN) {
    return [`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`, `https://www.${process.env.RAILWAY_PUBLIC_DOMAIN}`];
  }
  if (isProd) {
    console.warn('CORS: Set FRONTEND_URL or RAILWAY_PUBLIC_DOMAIN for production. Allowing all origins as fallback.');
    return true;
  }
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
          scriptSrc: ["'self'"],
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
