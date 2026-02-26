import { Server } from 'socket.io';
import { verifyAccessToken } from './auth.js';

function parseCookie(str) {
  if (!str) return {};
  return str.split(';').reduce((acc, pair) => {
    const [k, v] = pair.trim().split('=').map((s) => s?.trim());
    if (k && v) acc[k] = decodeURIComponent(v);
    return acc;
  }, {});
}
import prisma from './db.js';

const ACCESS_COOKIE = 'access_token';
const LIVE_ROOM = 'live-room';

/**
 * Initialise Socket.IO pour le live : état professorOnline + notifications étudiants
 */
export function initLiveSocket(httpServer, app) {
  const origins = getSocketOrigins();
  const io = new Server(httpServer, {
    cors: { origin: origins, credentials: true },
    path: '/live-socket',
  });

  app.locals.professorOnline = false;
  app.locals.io = io;

  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      const token = cookieHeader
        ? parseCookie(cookieHeader)[ACCESS_COOKIE]
        : socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Non authentifié'));
      }
      const decoded = verifyAccessToken(token);
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) return next(new Error('Utilisateur introuvable'));
      if (user.role !== 'STUDENT' && user.role !== 'PROFESSOR') {
        return next(new Error('Rôle non autorisé'));
      }
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket;

    socket.join(LIVE_ROOM);

    if (user.role === 'PROFESSOR') {
      app.locals.professorOnline = true;
      io.to(LIVE_ROOM).emit('professorOnline', { online: true });
    }

    socket.on('disconnect', () => {
      if (user.role === 'PROFESSOR') {
        app.locals.professorOnline = false;
        io.to(LIVE_ROOM).emit('professorOnline', { online: false });
      }
    });
  });

  return io;
}

function getSocketOrigins() {
  const frontendUrl = process.env.FRONTEND_URL;
  if (process.env.NODE_ENV === 'production' && frontendUrl) {
    return frontendUrl.split(',').map((u) => u.trim()).filter(Boolean);
  }
  if (process.env.NODE_ENV === 'production' && process.env.RAILWAY_PUBLIC_DOMAIN) {
    return [`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`, `https://www.${process.env.RAILWAY_PUBLIC_DOMAIN}`];
  }
  return ['http://localhost:5173', 'http://127.0.0.1:5173'];
}
