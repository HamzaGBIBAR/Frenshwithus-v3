import jwt from 'jsonwebtoken';

const ACCESS_EXPIRY = '20m';   // 20 min
const REFRESH_EXPIRY = '7d';

export const createAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRY });

export const createRefreshToken = (userId) =>
  jwt.sign({ userId, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: REFRESH_EXPIRY });

export const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);

export const verifyRefreshToken = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.type !== 'refresh') throw new Error('Invalid token type');
  return decoded;
};
