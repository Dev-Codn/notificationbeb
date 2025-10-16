import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma Client to avoid connection issues in serverless
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to preserve the client across hot reloads
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;

