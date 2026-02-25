import 'dotenv/config';

// Ensure Railway Postgres SSL: append sslmode=require for non-local hosts
const dbUrl = process.env.DATABASE_URL;
if (dbUrl && !dbUrl.includes('sslmode=') && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1')) {
  const sep = dbUrl.includes('?') ? '&' : '?';
  process.env.DATABASE_URL = `${dbUrl}${sep}sslmode=require`;
}

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import prisma from './lib/db.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import professorRoutes from './routes/professor.js';
import studentRoutes from './routes/student.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: isProd ? true : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

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
  try {
    await prisma.$connect();
    console.log('Database connected');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
