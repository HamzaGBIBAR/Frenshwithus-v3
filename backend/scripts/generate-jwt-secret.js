#!/usr/bin/env node
/**
 * Génère une clé JWT_SECRET sécurisée (≥64 caractères).
 * Usage: node scripts/generate-jwt-secret.js
 * Copier le résultat dans Railway Variables ou .env (production uniquement).
 */
import crypto from 'crypto';
const secret = crypto.randomBytes(48).toString('base64');
console.log('JWT_SECRET (copier dans Railway Variables):');
console.log(secret);
console.log('\nLongueur:', secret.length, 'caractères');
