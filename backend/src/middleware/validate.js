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
  body('professorId').optional({ values: 'null' }).isString().trim().isLength({ max: 30 }),
];

export const cuidParam = (name) => param(name).isLength({ min: 20, max: 30 }).matches(/^c[a-z0-9]+$/);

export const courseCreateValidation = [
  body('professorId').notEmpty().trim().isLength({ min: 20, max: 30 }),
  body('studentId').notEmpty().trim().isLength({ min: 20, max: 30 }),
  body('date').notEmpty().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be YYYY-MM-DD'),
  body('time').notEmpty().matches(/^\d{1,2}:\d{2}$/).withMessage('Time must be HH:mm'),
  body('meetingLink').optional({ checkFalsy: true }).trim().isURL().withMessage('Invalid meeting link'),
];

export const paymentCreateValidation = [
  body('studentId').notEmpty().trim().isLength({ min: 20, max: 30 }),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('status').optional().isIn(['paid', 'unpaid']),
];

export const paymentStatusValidation = [
  body('status').notEmpty().isIn(['paid', 'unpaid']),
];

export const messageValidation = [
  body('receiverId').notEmpty().trim().isLength({ min: 20, max: 30 }),
  body('content').notEmpty().trim().isLength({ min: 1, max: 2000 }),
];

export const assignProfessorValidation = [
  body('professorId').optional({ values: 'null' }).isString().trim().isLength({ max: 30 }),
];

export const availabilityValidation = [
  body('dayOfWeek').isInt({ min: 1, max: 7 }).withMessage('dayOfWeek must be 1-7'),
  body('startTime').notEmpty().matches(/^\d{1,2}:\d{2}$/).withMessage('startTime must be HH:mm'),
  body('endTime').notEmpty().matches(/^\d{1,2}:\d{2}$/).withMessage('endTime must be HH:mm'),
];
