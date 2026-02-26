import 'dotenv/config';

// Ensure Railway Postgres SSL: append sslmode=require for non-local hosts
const dbUrl = process.env.DATABASE_URL;
if (dbUrl && !dbUrl.includes('sslmode=') && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1')) {
  const sep = dbUrl.includes('?') ? '&' : '?';
  process.env.DATABASE_URL = `${dbUrl}${sep}sslmode=require`;
}

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import prisma from './lib/db.js';
import { helmetMiddleware, generalLimiter, authLimiter, getAllowedOrigins } from './middleware/security.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import professorRoutes from './routes/professor.js';
import studentRoutes from './routes/student.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);

// HTTPS redirect in production
if (isProd) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] === 'http') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

app.use(helmetMiddleware);
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(generalLimiter);
app.use('/api/auth/login', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/professor', professorRoutes);
app.use('/api/student', studentRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true }));

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
  if (!process.env.JWT_SECRET) {
    console.error('Fatal: JWT_SECRET environment variable is not set. Add it in Railway Variables.');
    process.exit(1);
  }
  if (isProd && process.env.JWT_SECRET.length < 64) {
    console.warn('Security: JWT_SECRET should be at least 64 characters in production.');
  }
  if (isProd && process.env.NODE_ENV !== 'production') {
    console.warn('Warning: NODE_ENV should be "production" in production.');
  }
  try {
    await prisma.$connect();
    console.log('Database connected');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

start();
