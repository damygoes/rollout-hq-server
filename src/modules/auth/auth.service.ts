import bcrypt from 'bcrypt';

import { prisma } from '../../db/prisma';

import type { Role } from '@prisma/client';

export async function hashPassword(raw: string) {
  return bcrypt.hash(raw, 10);
}
export async function verifyPassword(raw: string, hash: string) {
  return bcrypt.compare(raw, hash);
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(email: string, passwordHash: string, role: Role = 'VIEWER') {
  return prisma.user.create({
    data: { email, passwordHash, role },
    select: { id: true, email: true, role: true, createdAt: true },
  });
}
