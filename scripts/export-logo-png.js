import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(__dirname, '../frontend/public/logo-instagram.svg');
const outDir = path.join(__dirname, '../frontend/public');

const svg = fs.readFileSync(svgPath);

async function exportLogo() {
  await sharp(svg)
    .resize(2048, 2048)
    .png()
    .toFile(path.join(outDir, 'logo-instagram-2048.png'));
  console.log('Created logo-instagram-2048.png (2048x2048)');

  await sharp(svg)
    .resize(1080, 1080)
    .png()
    .toFile(path.join(outDir, 'logo-instagram-1080.png'));
  console.log('Created logo-instagram-1080.png (1080x1080)');
}

exportLogo().catch((err) => {
  console.error(err);
  process.exit(1);
});
