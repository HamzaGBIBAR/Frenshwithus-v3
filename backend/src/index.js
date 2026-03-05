import 'dotenv/config';
import http from 'http';

// Ensure Railway Postgres SSL: append sslmode=require for non-local hosts
const dbUrl = process.env.DATABASE_URL;
if (dbUrl && !dbUrl.includes('sslmode=') && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1')) {
  const sep = dbUrl.includes('?') ? '&' : '?';
  process.env.DATABASE_URL = `${dbUrl}${sep}sslmode=require`;
}

import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import prisma from './lib/db.js';
import { helmetMiddleware, blockBlockedIps, generalLimiter, authLimiter, getAllowedOrigins } from './middleware/security.js';
import { initSentry, captureException } from './lib/sentry.js';
import { initLiveSocket } from './lib/liveSocket.js';
import { startProfessorAbsenceChecker } from './lib/professorAbsenceCheck.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import professorRoutes from './routes/professor.js';
import studentRoutes from './routes/student.js';
import liveRoutes from './routes/live.js';
import chatRoutes from './routes/chat.js';
import notificationsRoutes from './routes/notifications.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';
let dbConnected = false;

app.set('trust proxy', 1);

// HTTPS redirect in production
if (isProd) {
  app.use((req, res, next) => {
    // Keep healthcheck always reachable for Railway internal probes.
    if (req.path === '/api/health') return next();
    if (req.headers['x-forwarded-proto'] === 'http') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

app.use(helmetMiddleware);
app.use(cookieParser());
app.use(express.json({ limit: '500kb' }));
app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Healthcheck before block/rate limit so it is always reachable
app.get('/api/health', (_, res) => res.json({ ok: true, db: dbConnected ? 'connected' : 'connecting' }));

app.use(blockBlockedIps);
app.use(generalLimiter);
app.use('/api/auth/login', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/professor', professorRoutes);
app.use('/api/student', studentRoutes);
app.use('/api', notificationsRoutes);
app.use('/api', liveRoutes);
app.use('/api', chatRoutes);

// Global error handler for unhandled route errors
app.use((err, req, res, next) => {
  captureException(err);
  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Resource not found' });
    if (err.code === 'P2002') return res.status(409).json({ error: 'Duplicate value' });
  }
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large (max 5MB)' });
  if (err.message?.includes('Invalid file type')) return res.status(400).json({ error: err.message });
  console.error('Route error:', err);
  res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
});

// Serve frontend static files (production – public folder created during build)
const publicPath = path.join(__dirname, '../public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

async function start() {
  try { await initSentry(); } catch (e) { console.error('Sentry init failed (non-fatal):', e.message); }

  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = `fallback-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    console.warn('Warning: JWT_SECRET missing. Temporary fallback secret generated. Set JWT_SECRET in Railway Variables.');
  }
  if (isProd && process.env.JWT_SECRET.length < 64) {
    console.warn('Security: JWT_SECRET should be at least 64 characters in production.');
  }

  const connectDbWithRetry = async () => {
    try {
      await prisma.$connect();
      dbConnected = true;
      console.log('Database connected');
    } catch (err) {
      dbConnected = false;
      console.error('Database connection failed:', err.message);
      setTimeout(connectDbWithRetry, 5000);
    }
  };
  connectDbWithRetry();

  const httpServer = http.createServer(app);
  try { initLiveSocket(httpServer, app); } catch (e) { console.error('LiveSocket init failed (non-fatal):', e.message); }
  try { startProfessorAbsenceChecker(app); } catch (e) { console.error('AbsenceChecker init failed (non-fatal):', e.message); }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

process.on('uncaughtException', (err) => {
  captureException(err);
  console.error('Uncaught exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  captureException(reason instanceof Error ? reason : new Error(String(reason)));
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

start().catch((err) => {
  console.error('FATAL start() error:', err);
});
