import { PrismaClient } from '@prisma/client';

const prismaOptions = {
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
};

const prisma = new PrismaClient(prismaOptions);

export default prisma;
