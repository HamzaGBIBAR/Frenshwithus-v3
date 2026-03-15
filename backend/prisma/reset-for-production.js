/**
 * Reset database for production: remove all test data, keep only ADMIN user(s).
 * Run: npm run db:reset-production (or node prisma/reset-for-production.js)
 *
 * - Deletes all reservations (contact form submissions)
 * - Deletes all blocked IPs
 * - Deletes all users that are NOT ADMIN (professors, students)
 *   → Cascades: courses, messages, availability, payments, notifications, etc.
 *
 * Your admin account (e.g. admin@frenchwithus.com) is kept.
 */
import 'dotenv/config';

const dbUrl = process.env.DATABASE_URL;
if (dbUrl && !dbUrl.includes('sslmode=') && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1')) {
  const sep = dbUrl.includes('?') ? '&' : '?';
  process.env.DATABASE_URL = `${dbUrl}${sep}sslmode=require`;
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing all data except ADMIN account...\n');

  const r1 = await prisma.reservation.deleteMany({});
  console.log('Deleted reservations:', r1.count);

  const r2 = await prisma.blockedIp.deleteMany({});
  console.log('Deleted blocked IPs:', r2.count);

  // Delete non-ADMIN users (cascade will remove their courses, messages, availability, etc.)
  const r3 = await prisma.user.deleteMany({
    where: { role: { not: 'ADMIN' } },
  });
  console.log('Deleted users (professors/students):', r3.count);

  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true, name: true } });
  console.log('\nRemaining admin account(s):', admins.map((a) => `${a.name} (${a.email})`).join(', ') || 'none');
  console.log('\nDone. Database is ready for production.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
