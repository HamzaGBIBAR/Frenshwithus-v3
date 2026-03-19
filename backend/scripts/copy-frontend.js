/**
 * Cross-platform copy of frontend dist to backend public.
 * Run from backend directory.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, '../../frontend/dist');
const dest = path.join(__dirname, '../public');

if (!fs.existsSync(src)) {
  console.error('Frontend dist not found. Run frontend build first.');
  process.exit(1);
}
fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log('Copied frontend/dist to backend/public');
