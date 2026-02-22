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
