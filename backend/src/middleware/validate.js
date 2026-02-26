import { body, param, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array()[0]?.msg || 'Validation failed';
    return res.status(400).json({ error: msg });
  }
  next();
};

export const sanitizeString = (s, maxLen = 500) => {
  if (typeof s !== 'string') return '';
  return s.trim().slice(0, maxLen);
};

export const userCreateValidation = [
  body('name').trim().isLength({ min: 1, max: 100 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6, max: 128 }),
];

export const userUpdateValidation = [
  body('name').optional().trim().isLength({ min: 1, max: 100 }).escape(),
  body('email').optional().isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 6, max: 128 }),
  body('professorId').optional().isString().trim().isLength({ max: 30 }),
];

export const cuidParam = (name) => param(name).isLength({ min: 20, max: 30 }).matches(/^c[a-z0-9]+$/);
