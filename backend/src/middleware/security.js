import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import prisma from '../lib/db.js';

const isProd = process.env.NODE_ENV === 'production';

export const getClientIp = (req) => req.ip || req.connection?.remoteAddress || '';

// Reject requests from blocked IPs (must run before rate limiter)
export const blockBlockedIps = async (req, res, next) => {
  const ip = getClientIp(req);
  if (!ip) return next();
  try {
    const blocked = await prisma.blockedIp.findUnique({ where: { ip } });
    if (blocked) {
      return res.status(403).json({ error: 'Access denied. Your IP has been blocked. Contact admin to unblock.' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

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

// General rate limit: 100 per minute per IP; exceeding adds IP to block list
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 100,
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  handler: async (req, res) => {
    const ip = getClientIp(req);
    try {
      await prisma.blockedIp.upsert({
        where: { ip },
        create: { ip },
        update: {},
      });
    } catch (e) {
      // ignore duplicate / DB errors, still respond 429
    }
    res.status(429).json({
      error: 'Too many requests. Your IP has been blocked. Contact admin to unblock.',
    });
  },
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
          scriptSrc: ["'self'", "https://meet.jit.si", "https://cdn.jsdelivr.net", "blob:"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "https://meet.jit.si", "wss://meet.jit.si", "https://cdn.jsdelivr.net"],
          frameSrc: ["'self'", "https://meet.jit.si"],
          workerSrc: ["'self'", "blob:", "https://cdn.jsdelivr.net"],
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
