import { Prisma } from '@prisma/client';

const prismaConfig: Prisma.PrismaClientOptions = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};

export default prismaConfig;
