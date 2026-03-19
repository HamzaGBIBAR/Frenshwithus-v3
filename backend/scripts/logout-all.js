#!/usr/bin/env node
/**
 * Déconnecte tous les utilisateurs du site en générant un nouveau JWT_SECRET.
 * Tous les tokens existants deviennent invalides.
 * Met à jour le fichier .env local.
 *
 * Usage: node scripts/logout-all.js
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');

const newSecret = crypto.randomBytes(48).toString('base64');

let content = '';
if (fs.existsSync(envPath)) {
  content = fs.readFileSync(envPath, 'utf8');
  if (content.includes('JWT_SECRET=')) {
    content = content.replace(/JWT_SECRET=.*/m, `JWT_SECRET=${newSecret}`);
  } else {
    content += `\nJWT_SECRET=${newSecret}\n`;
  }
} else {
  content = `JWT_SECRET=${newSecret}\n`;
}

fs.writeFileSync(envPath, content.trimEnd() + '\n');
console.log('✓ Tous les utilisateurs ont été déconnectés.');
console.log('  Un nouveau JWT_SECRET a été généré et enregistré dans .env');
console.log('\n⚠ Redémarrez le serveur backend pour appliquer les changements.');
console.log('  En production (Railway), mettez à jour la variable JWT_SECRET dans le dashboard.');
