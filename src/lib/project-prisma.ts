import { PrismaClient } from '@/generated/project-client';

const globalForPrisma = globalThis as unknown as { projectPrisma: PrismaClient };

export const projectPrisma = globalForPrisma.projectPrisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.projectPrisma = projectPrisma;