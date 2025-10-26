import { prisma } from '../../db/prisma';

export function listEnvironments() {
  return prisma.environment.findMany({ orderBy: { key: 'asc' } });
}

export function createEnvironment(key: string, name: string) {
  return prisma.environment.create({ data: { key, name } });
}
