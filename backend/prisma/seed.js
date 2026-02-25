import 'dotenv/config';

// Ensure Railway Postgres SSL for non-local hosts
const dbUrl = process.env.DATABASE_URL;
if (dbUrl && !dbUrl.includes('sslmode=') && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1')) {
  const sep = dbUrl.includes('?') ? '&' : '?';
  process.env.DATABASE_URL = `${dbUrl}${sep}sslmode=require`;
}

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@frenchwithus.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@frenchwithus.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('Created admin:', admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
