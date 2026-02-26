import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import prisma from '../lib/db.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createAccessToken, createRefreshToken, verifyRefreshToken } from '../lib/auth.js';

const router = Router();
const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
});

router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      professorId: true,
      professor: { select: { id: true, name: true } },
    },
  });
  res.json(user);
});

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

router.post('/login', loginValidation, validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);

    res.cookie(ACCESS_COOKIE, accessToken, {
      ...getCookieOptions(),
      maxAge: 20 * 60 * 1000,
    });
    res.cookie(REFRESH_COOKIE, refreshToken, {
      ...getCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(ACCESS_COOKIE, { path: '/', httpOnly: true });
  res.clearCookie(REFRESH_COOKIE, { path: '/', httpOnly: true });
  res.json({ ok: true });
});

router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });
    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const accessToken = createAccessToken(user.id);
    res.cookie(ACCESS_COOKIE, accessToken, {
      ...getCookieOptions(),
      maxAge: 20 * 60 * 1000,
    });
    res.json({ ok: true });
  } catch (err) {
    res.clearCookie(ACCESS_COOKIE, { path: '/', httpOnly: true });
    res.clearCookie(REFRESH_COOKIE, { path: '/', httpOnly: true });
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export default router;
